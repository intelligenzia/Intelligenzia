import type Stripe from 'stripe';
import type { MembershipStatus } from '@prisma/client';
import { prisma } from './prisma';
import { stripe, siteOrigin } from './stripe';
import { sendEmail, membershipConfirmationEmail, type ConfirmationKind } from './email';
import {
  formatDate,
  localePath,
  membershipState,
  typeLabels,
  type MembershipType,
} from './membership';

export type FulfillResult =
  | { status: 'not_paid' }
  | { status: 'processing'; email: string; locale: string }
  | { status: 'duplicate'; email: string; locale: string }
  | {
      status: 'active';
      kind: ConfirmationKind;
      type: MembershipType;
      recurring: boolean;
      until: Date | null;
      /** Set when billing is deferred, e.g. an upgrade from supporting. */
      firstChargeOn: Date | null;
      amountEuros: number | null;
      email: string;
      name: string | null;
      locale: string;
    };

// Stripe moved current_period_end onto subscription items; webhook endpoints
// pinned to an older API version still send it on the subscription.
export function subscriptionPeriodEnd(sub: Stripe.Subscription): Date | null {
  const end =
    sub.items?.data[0]?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return end ? new Date(end * 1000) : null;
}

/** null: first payment still in flight, leave the row alone. */
export function subscriptionStatus(status: Stripe.Subscription.Status): MembershipStatus | null {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
    case 'paused':
      return 'EXPIRED';
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELLED';
    default:
      return null;
  }
}

function addYear(date: Date): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}

async function resolveUser(userId: string | undefined, email: string, name: string | null) {
  const byId = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  // Guests pay first and sign in later: the magic link finds this row by email.
  const user =
    byId ?? (await prisma.user.upsert({ where: { email }, create: { email, name }, update: {} }));
  if (name && name !== user.name) {
    await prisma.user.update({ where: { id: user.id }, data: { name } });
  }
  return { id: user.id, email: user.email ?? email, name: name ?? user.name };
}

/**
 * Turns a completed Checkout Session into a membership. Called from both the
 * webhook and the thank-you page, so it must be idempotent: whichever runs
 * second finds the row already in the target state and does nothing, which
 * is also what keeps the confirmation email to exactly one.
 */
export async function fulfillCheckoutSession(sessionId: string): Promise<FulfillResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });
  const meta = session.metadata ?? {};
  const locale = meta.locale === 'en' ? 'en' : 'fi';
  const email = session.customer_details?.email?.trim().toLowerCase();

  // Sessions this site created carry membershipType. The account's old
  // Payment Link for membership carries nothing, but the only recurring
  // price on the account is the membership, so any subscription counts.
  // One-off payments without metadata are event tickets: not ours.
  const isMembership = !!meta.membershipType || session.mode === 'subscription';
  if (session.status !== 'complete' || !email || !isMembership) {
    return { status: 'not_paid' };
  }
  // Delayed methods (e.g. bank debits) complete before the money arrives;
  // checkout.session.async_payment_succeeded brings us back here.
  if (session.payment_status === 'unpaid') {
    return { status: 'processing', email, locale };
  }

  const customerId =
    typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null);
  const name =
    session.collected_information?.individual_name ??
    session.customer_details?.individual_name ??
    session.customer_details?.name ??
    null;
  const user = await resolveUser(meta.userId, email, name);

  const subscription =
    session.mode === 'subscription' && session.subscription && typeof session.subscription !== 'string'
      ? session.subscription
      : null;

  // Ensure a row exists so the transaction below has something to lock.
  await prisma.membership.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      type: subscription ? 'FULL' : 'SUPPORTING',
      status: 'PENDING',
      stripeCustomerId: customerId,
    },
    update: {},
  });

  const outcome = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Membership" WHERE "userId" = ${user.id} FOR UPDATE`;
    const existing = (await tx.membership.findUnique({ where: { userId: user.id } }))!;
    const before = membershipState(existing);

    const target = subscription
      ? {
          type: 'FULL' as const,
          status: subscriptionStatus(subscription.status) ?? 'PENDING',
          currentPeriodEnd: subscriptionPeriodEnd(subscription),
          stripeSubscriptionId: subscription.id,
        }
      : (() => {
          // Early renewals extend from the old end date, fixed when the
          // session was created; everything else runs a year from payment.
          // max() keeps a re-run from extending twice.
          const base = meta.periodStart ? new Date(meta.periodStart) : new Date(session.created * 1000);
          const end = addYear(base);
          const prev = existing.currentPeriodEnd;
          return {
            type: 'SUPPORTING' as const,
            status: 'ACTIVE' as const,
            currentPeriodEnd: prev && prev > end ? prev : end,
            stripeSubscriptionId: null,
          };
        })();

    // A logged-in member can't get here twice (checkout refuses), but a
    // guest can pay again with the address of a live subscription.
    const hasLiveSubscription =
      !!existing.stripeSubscriptionId &&
      ((before.kind === 'active' && before.recurring) || before.kind === 'payment_issue');
    if (hasLiveSubscription && existing.stripeSubscriptionId !== target.stripeSubscriptionId) {
      return { duplicate: true as const };
    }

    const unchanged =
      existing.type === target.type &&
      existing.status === target.status &&
      existing.currentPeriodEnd?.getTime() === target.currentPeriodEnd?.getTime() &&
      existing.stripeSubscriptionId === target.stripeSubscriptionId &&
      (existing.stripeCustomerId === customerId || !customerId);

    if (!unchanged) {
      await tx.membership.update({
        where: { id: existing.id },
        data: {
          ...target,
          ...(customerId ? { stripeCustomerId: customerId } : {}),
          ...(session.amount_total ? { amountPaid: session.amount_total } : {}),
        },
      });
    }

    const kind: ConfirmationKind =
      before.kind === 'active' && before.type === 'SUPPORTING' && target.type === 'FULL'
        ? 'upgrade'
        : before.kind === 'none'
          ? 'welcome'
          : 'renewal';

    return { duplicate: false as const, changed: !unchanged, target, kind };
  });

  if (outcome.duplicate) {
    console.error(
      `[membership] ${email} paid checkout ${session.id} while already holding a live subscription; refund or cancel one in Stripe.`
    );
    return { status: 'duplicate', email, locale };
  }

  const { target, kind } = outcome;
  if (target.status !== 'ACTIVE') {
    return { status: 'processing', email, locale };
  }

  const recurring = target.type === 'FULL';
  const firstChargeOn =
    subscription?.status === 'trialing' && subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;

  if (outcome.changed) {
    await sendConfirmation({
      to: user.email,
      locale,
      kind,
      name: user.name,
      type: target.type,
      recurring,
      until: target.currentPeriodEnd,
    });
  }

  return {
    status: 'active',
    kind,
    type: target.type,
    recurring,
    until: target.currentPeriodEnd,
    firstChargeOn,
    amountEuros: session.amount_total ? session.amount_total / 100 : null,
    email: user.email,
    name: user.name,
    locale,
  };
}

async function sendConfirmation(opts: {
  to: string;
  locale: string;
  kind: ConfirmationKind;
  name: string | null;
  type: MembershipType;
  recurring: boolean;
  until: Date | null;
}) {
  const fi = opts.locale !== 'en';
  const date = opts.until ? formatDate(opts.until, opts.locale) : null;
  const validity = !date
    ? ''
    : opts.recurring
      ? fi ? `uusiutuu ${date}` : `renews on ${date}`
      : fi ? `voimassa ${date} asti` : `valid until ${date}`;

  try {
    await sendEmail({
      to: opts.to,
      ...membershipConfirmationEmail({
        locale: opts.locale,
        kind: opts.kind,
        name: opts.name,
        typeLabel: typeLabels[opts.type][fi ? 'fi' : 'en'],
        validity,
        manageUrl: `${siteOrigin()}${localePath(opts.locale, 'dashboard')}`,
      }),
    });
  } catch (err) {
    // The membership is already recorded; a lost email must not fail the
    // webhook and trigger a retry storm.
    console.error('[membership] confirmation email failed:', err);
  }
}

/** Re-reads a subscription from Stripe and mirrors its state onto the row. */
export async function syncSubscription(subscriptionId: string): Promise<void> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const status = subscriptionStatus(sub.status);
  if (!status) return;

  const periodEnd = subscriptionPeriodEnd(sub);
  const data = { status, ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}) };

  const { count } = await prisma.membership.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data,
  });
  if (count > 0) return;

  // Subscriptions this site started are linked by fulfillCheckoutSession;
  // an event that beats it here has nothing to update yet.
  if (sub.metadata?.membershipType) return;

  // Older subscriptions predate storing the id: link a live one by customer.
  // A dead one must not overwrite whatever the member has bought since.
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  if (status === 'CANCELLED') return;
  const legacy = await prisma.membership.updateMany({
    where: { stripeCustomerId: customerId, stripeSubscriptionId: null },
    data: { ...data, type: 'FULL', stripeSubscriptionId: sub.id },
  });
  if (legacy.count === 0) {
    console.warn(`[membership] no membership for subscription ${sub.id} (customer ${customerId})`);
  }
}
