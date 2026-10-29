import { createHash } from 'crypto';
import { prisma } from './prisma';
import { stripe } from './stripe';

/** Stable, non-reversible key for the suppression list. */
export function emailHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

/**
 * Deleted accounts, by email hash, with when they were deleted. The Stripe
 * import skips any payment made before that moment; a later payment is the
 * person rejoining and is imported as usual.
 */
export async function loadSuppressions(): Promise<(email: string, paidAt: Date) => boolean> {
  const rows = await prisma.deletedAccount.findMany();
  const byHash = new Map(rows.map((r) => [r.emailHash, r.deletedAt]));
  return (email, paidAt) => {
    const deletedAt = byHash.get(emailHash(email));
    return !!deletedAt && paidAt < deletedAt;
  };
}

/**
 * Everything the site stores about a person (GDPR art. 15 and 20). Payment
 * details themselves live in Stripe and the society's bookkeeping.
 */
export async function exportAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      membership: true,
      periods: { orderBy: { startsAt: 'asc' } },
      sessions: { select: { expires: true } },
    },
  });
  if (!user) return null;

  return {
    exportedAt: new Date().toISOString(),
    controller: 'Intelligenzia ry (1051818-0), hallitus@intelligenzia.fi',
    account: {
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      activeSessions: user.sessions.length,
    },
    membership: user.membership && {
      type: user.membership.type,
      status: user.membership.status,
      currentPeriodEnd: user.membership.currentPeriodEnd,
      amountPaidCents: user.membership.amountPaid,
      memberSince: user.membership.createdAt,
      stripeCustomerId: user.membership.stripeCustomerId,
      stripeSubscriptionId: user.membership.stripeSubscriptionId,
    },
    membershipYears: user.periods.map((p) => ({
      type: p.type,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      amountPaidCents: p.amountPaid,
      source: p.source,
      stripePaymentId: p.stripePaymentId,
    })),
    note: 'Card details are never stored by Intelligenzia; they are held by Stripe (stripe.com/privacy). Payment records are kept in the bookkeeping for 6 years as required by the Finnish Accounting Act.',
  };
}

export class AccountDeletionError extends Error {}

/**
 * Erases a person from the site (GDPR art. 17) and ends their membership:
 * stops any recurring payment first, so nobody is charged for an account
 * that no longer exists, then deletes the user, which cascades to sessions,
 * membership and membership years. Stripe keeps its payment records, which
 * the Accounting Act requires; the suppression entry keeps the Stripe import
 * from bringing the member back.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true },
  });
  if (!user) return;

  const subscriptionId = user.membership?.stripeSubscriptionId;
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (sub.status !== 'canceled' && sub.status !== 'incomplete_expired') {
        await stripe.subscriptions.cancel(subscriptionId);
      }
    } catch (err) {
      console.error(`[account] could not cancel subscription ${subscriptionId}:`, err);
      throw new AccountDeletionError('subscription_cancel_failed');
    }
  }

  await prisma.$transaction(async (tx) => {
    if (user.email) {
      await tx.deletedAccount.upsert({
        where: { emailHash: emailHash(user.email) },
        create: { emailHash: emailHash(user.email) },
        update: { deletedAt: new Date() },
      });
      await tx.verificationToken.deleteMany({ where: { identifier: user.email } });
    }
    await tx.user.delete({ where: { id: user.id } });
  });
}
