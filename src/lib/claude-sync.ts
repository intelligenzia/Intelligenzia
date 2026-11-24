import type Stripe from 'stripe';
import type { ClaudeStatus, ClaudeSubscription } from '@prisma/client';
import { prisma } from './prisma';
import { stripe, siteOrigin } from './stripe';
import { subscriptionPeriodEnd } from './membership-periods';
import { formatDate, localePath, membershipState } from './membership';
import { CLAUDE_TIERS, claudeStatusFor, isClaudeMetadata, membershipEnded } from './claude-plans';
import { claudeTierOf, isClaudeSubscription } from './claude-stripe';
import { boardEmail, claudeEndingEmail, claudeWelcomeEmail, sendQuietly } from './email';
import { boardAddress } from './workspace-sync';

// The Claude add-on's lifecycle: Stripe subscription -> ClaudeSubscription
// row -> emails to the member and the board, who add, move or remove the
// member's @intelligenzia.fi address in the Claude organisation by hand.
// The address itself is a membership benefit (workspace-sync.ts) and
// outlives the subscription.
//
// Stripe owns the subscription. Every entry point re-reads it and converges
// on the same row. Emails go out on state transitions made with a
// conditional UPDATE, so duplicate or concurrent webhooks send each one once.

const tierLabel = (row: Pick<ClaudeSubscription, 'tier'>) => CLAUDE_TIERS[row.tier].label;
const dashboardUrl = (locale: string) => `${siteOrigin()}${localePath(locale, 'dashboard')}`;

/** Moves `status` to `to` only if it is one of `from`. True if this caller moved it. */
async function transition(id: string, from: ClaudeStatus[], to: ClaudeStatus): Promise<boolean> {
  const { count } = await prisma.claudeSubscription.updateMany({
    where: { id, status: { in: from } },
    data: { status: to },
  });
  return count === 1;
}

async function memberOf(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, workspace: { select: { email: true } } },
  });
}

async function notifyBoard(row: ClaudeSubscription, action: 'add' | 'change' | 'remove', extra: string[] = []) {
  const member = await memberOf(row.userId);
  const who = member?.name ? `${member.name} (${member.email})` : (member?.email ?? row.userId);
  const address = member?.workspace?.email ?? null;
  const target = address ?? member?.email ?? row.userId;
  const tier = tierLabel(row);
  const lines = {
    add: [
      `${who} tilasi ${tier} -tason.`,
      address
        ? `Lisää ${address} Claude-organisaatioon tasolle ${tier}.`
        : 'Jäsenellä ei ole vielä @intelligenzia.fi-osoitetta. Lisää se Claude-organisaatioon, kun osoite on luotu.',
    ],
    change: [`${who} vaihtoi tasolle ${tier}. Päivitä paikka Claude-organisaatiossa (${target}).`],
    remove: [`${who}: ${tier} päättyi. Poista ${target} Claude-organisaatiosta. Sähköpostiosoite jää jäsenelle.`],
  }[action];
  const subject = {
    add: `Claude: lisää paikka – ${target}`,
    change: `Claude: vaihda taso – ${target}`,
    remove: `Claude: poista paikka – ${target}`,
  }[action];
  await sendQuietly(boardAddress(), boardEmail({ subject, lines: [...lines, ...extra] }));
}

/**
 * Mirrors a Claude subscription from Stripe onto the member's row, then
 * sends whatever its change calls for. Safe to call any number of times.
 */
export async function syncClaudeSubscription(subscription: string | Stripe.Subscription): Promise<void> {
  const sub =
    typeof subscription === 'string' ? await stripe.subscriptions.retrieve(subscription) : subscription;
  if (!isClaudeSubscription(sub)) return;

  const existing = await prisma.claudeSubscription.findFirst({
    where: {
      OR: [{ stripeSubscriptionId: sub.id }, ...(sub.metadata?.userId ? [{ userId: sub.metadata.userId }] : [])],
    },
  });
  const userId = existing?.userId ?? sub.metadata?.userId;
  if (!userId) {
    console.warn(`[claude] subscription ${sub.id} has no member to attach to`);
    return;
  }

  const status = claudeStatusFor(sub.status);
  // One row per member. A second live subscription must not replace the
  // first; the board refunds one in Stripe. An event for an older, ended
  // subscription must not overwrite a newer one either.
  if (existing?.stripeSubscriptionId && existing.stripeSubscriptionId !== sub.id) {
    if (existing.status !== 'CANCELLED' && existing.status !== 'PENDING') {
      if (status === 'ACTIVE' || status === 'PAST_DUE') {
        console.error(
          `[claude] member ${userId} has two live Claude subscriptions (${existing.stripeSubscriptionId}, ${sub.id}); cancel one in Stripe.`
        );
      }
      return;
    }
  }

  const sameSubscription = existing?.stripeSubscriptionId === sub.id;
  const tier = claudeTierOf(sub);
  const data = {
    stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: subscriptionPeriodEnd(sub),
    cancelAtPeriodEnd: sub.cancel_at_period_end || !!sub.cancel_at,
    ...(sub.metadata?.locale === 'en' || sub.metadata?.locale === 'fi' ? { locale: sub.metadata.locale } : {}),
  };

  // A replaced subscription starts over from PENDING, so its activation
  // counts as new (welcome email, board adds the seat).
  const row = await prisma.claudeSubscription.upsert({
    where: { userId },
    create: { userId, tier, status: 'PENDING', ...data },
    update: { ...data, ...(sameSubscription ? {} : { status: 'PENDING', tier }) },
  });

  // Tier change on a running subscription: the board moves the seat.
  if (sameSubscription && row.tier !== tier) {
    const { count } = await prisma.claudeSubscription.updateMany({
      where: { id: row.id, tier: row.tier },
      data: { tier },
    });
    if (count === 1 && row.status === 'ACTIVE') await notifyBoard({ ...row, tier }, 'change');
  }
  const current = { ...row, tier };

  switch (status) {
    case 'ACTIVE':
      if (await transition(row.id, ['PENDING'], 'ACTIVE')) {
        const member = await memberOf(userId);
        await sendQuietly(
          member?.email,
          claudeWelcomeEmail({
            locale: row.locale,
            name: member?.name ?? null,
            tierLabel: tierLabel(current),
            address: member?.workspace?.email ?? '@intelligenzia.fi',
            manageUrl: dashboardUrl(row.locale),
          })
        );
        await notifyBoard(current, 'add');
      } else {
        await transition(row.id, ['PAST_DUE'], 'ACTIVE');
      }
      break;
    case 'PAST_DUE':
      await transition(row.id, ['PENDING', 'ACTIVE'], 'PAST_DUE');
      break;
    case 'CANCELLED':
      if (await transition(row.id, ['ACTIVE', 'PAST_DUE'], 'CANCELLED')) {
        await notifyBoard(current, 'remove');
      } else {
        await transition(row.id, ['PENDING'], 'CANCELLED');
      }
      break;
  }
}

/**
 * Called by the webhook and the return page after a Claude checkout. The
 * signed-in member on the return page must be the one who paid.
 */
export async function syncClaudeCheckout(sessionId: string, expectUserId?: string): Promise<void> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
  if (!isClaudeMetadata(session.metadata) || session.status !== 'complete') return;
  if (expectUserId && session.metadata?.userId !== expectUserId) return;
  if (session.subscription) await syncClaudeSubscription(session.subscription);
}

export type ClaudeMaintenance = { endedByMembership: number; errors: string[] };

/**
 * The daily job's share: stops renewal for subscribers whose membership has
 * ended. One-off memberships lapse without any webhook, so nothing else
 * notices; the subscription then runs out at the end of its paid month.
 */
export async function runClaudeMaintenance(now = new Date()): Promise<ClaudeMaintenance> {
  const result: ClaudeMaintenance = { endedByMembership: 0, errors: [] };
  const live = await prisma.claudeSubscription.findMany({
    where: { status: { in: ['ACTIVE', 'PAST_DUE'] }, cancelAtPeriodEnd: false, stripeSubscriptionId: { not: null } },
    include: { user: { select: { email: true, name: true, membership: true } } },
  });
  for (const row of live) {
    if (!membershipEnded(membershipState(row.user.membership, now))) continue;
    try {
      await stripe.subscriptions.update(row.stripeSubscriptionId!, { cancel_at_period_end: true });
      await prisma.claudeSubscription.update({ where: { id: row.id }, data: { cancelAtPeriodEnd: true } });
      result.endedByMembership++;
      await sendQuietly(
        row.user.email,
        claudeEndingEmail({
          locale: row.locale,
          name: row.user.name,
          tierLabel: tierLabel(row),
          until: row.currentPeriodEnd ? formatDate(row.currentPeriodEnd, row.locale) : null,
          renewUrl: `${siteOrigin()}${localePath(row.locale, 'join')}`,
        })
      );
    } catch (err) {
      console.error(`[claude] stopping renewal of ${row.stripeSubscriptionId} failed:`, err);
      result.errors.push(`${row.stripeSubscriptionId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return result;
}

/**
 * Part of erasing a member (GDPR art. 17): stops the Claude subscription so
 * nobody is charged for an account that no longer exists. Throws if Stripe
 * can't stop the charges, like the membership does.
 */
export async function endClaudeForErasure(userId: string): Promise<void> {
  const row = await prisma.claudeSubscription.findUnique({ where: { userId } });
  if (!row) return;
  if (row.stripeSubscriptionId && row.status !== 'CANCELLED') {
    const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
    if (sub.status !== 'canceled' && sub.status !== 'incomplete_expired') {
      await stripe.subscriptions.cancel(row.stripeSubscriptionId);
    }
  }
  if (row.status === 'ACTIVE' || row.status === 'PAST_DUE') {
    await notifyBoard(row, 'remove', ['Jäsen poisti tilinsä.']);
  }
}
