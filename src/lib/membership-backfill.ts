import type Stripe from 'stripe';
import type { MembershipStatus, MembershipType } from '@prisma/client';
import { prisma } from './prisma';
import { stripe, FULL_MEMBERSHIP_PRICE_ID, SUPPORTING_MEMBERSHIP_PRODUCT_ID } from './stripe';
import { subscriptionPeriodEnd, subscriptionStatus } from './membership-sync';

type Candidate = {
  email: string;
  name: string | null;
  type: MembershipType;
  status: MembershipStatus;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  amountPaid: number | null;
  since: Date;
};

export type BackfillResult = {
  members: number;
  active: number;
  subscriptions: number;
  oneOffPayments: number;
  skipped: number;
  errors: string[];
};

const rank: Record<MembershipStatus, number> = { ACTIVE: 3, EXPIRED: 2, CANCELLED: 1, PENDING: 0 };

/** Prefer a live membership, then the one that runs latest. */
function better(a: Candidate, b: Candidate): Candidate {
  if (rank[a.status] !== rank[b.status]) return rank[a.status] > rank[b.status] ? a : b;
  return (a.currentPeriodEnd?.getTime() ?? 0) >= (b.currentPeriodEnd?.getTime() ?? 0) ? a : b;
}

function addYear(date: Date): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}

const idOf = (x: string | { id: string } | null | undefined) =>
  !x ? null : typeof x === 'string' ? x : x.id;

/**
 * Rebuilds the member register from Stripe, the record of who actually paid.
 * For a fresh database, or to reconcile after missed webhooks. Writes rows
 * only; it never emails anyone. Safe to run repeatedly.
 */
export async function backfillFromStripe(): Promise<BackfillResult> {
  const result: BackfillResult = {
    members: 0,
    active: 0,
    subscriptions: 0,
    oneOffPayments: 0,
    skipped: 0,
    errors: [],
  };
  const byEmail = new Map<string, Candidate>();
  const offer = (c: Candidate) => {
    const prev = byEmail.get(c.email);
    const pick = prev ? better(prev, c) : c;
    // Keep the earliest start so "member since" survives a later renewal.
    const since = prev && prev.since < c.since ? prev.since : c.since;
    byEmail.set(c.email, { ...pick, since, name: pick.name ?? prev?.name ?? c.name });
  };

  // Every recurring price on the account is the membership.
  for await (const sub of stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] })) {
    const customer = sub.customer as Stripe.Customer | Stripe.DeletedCustomer;
    const email = 'email' in customer ? customer.email?.trim().toLowerCase() : null;
    const status = subscriptionStatus(sub.status);
    if (!email || !status) {
      result.skipped++;
      continue;
    }
    result.subscriptions++;
    offer({
      email,
      name: 'name' in customer ? (customer.name ?? null) : null,
      type: 'FULL',
      status,
      currentPeriodEnd: subscriptionPeriodEnd(sub),
      stripeCustomerId: customer.id,
      stripeSubscriptionId: sub.id,
      amountPaid: sub.items.data[0]?.price.unit_amount ?? null,
      since: new Date(sub.start_date * 1000),
    });
  }

  // One-off membership payments: the site's supporting checkout, and the
  // old one-time membership prices. Event tickets share the account, so
  // match on product rather than taking every payment.
  const fullProduct = FULL_MEMBERSHIP_PRICE_ID
    ? idOf((await stripe.prices.retrieve(FULL_MEMBERSHIP_PRICE_ID)).product)
    : null;
  const now = new Date();
  for await (const session of stripe.checkout.sessions.list({
    status: 'complete',
    limit: 100,
    expand: ['data.line_items'],
  })) {
    if (session.mode !== 'payment' || session.payment_status !== 'paid') continue;
    const products = (session.line_items?.data ?? []).map((li) => idOf(li.price?.product));
    const supporting =
      session.metadata?.membershipType === 'SUPPORTING' ||
      (!!SUPPORTING_MEMBERSHIP_PRODUCT_ID && products.includes(SUPPORTING_MEMBERSHIP_PRODUCT_ID));
    const legacyFull = !!fullProduct && products.includes(fullProduct);
    if (!supporting && !legacyFull) continue;

    const email = session.customer_details?.email?.trim().toLowerCase();
    if (!email) {
      result.skipped++;
      continue;
    }
    result.oneOffPayments++;
    const paidAt = new Date(session.created * 1000);
    const start = session.metadata?.periodStart ? new Date(session.metadata.periodStart) : paidAt;
    const end = addYear(start);
    offer({
      email,
      name:
        session.collected_information?.individual_name ??
        session.customer_details?.individual_name ??
        session.customer_details?.name ??
        null,
      type: supporting ? 'SUPPORTING' : 'FULL',
      status: end > now ? 'ACTIVE' : 'EXPIRED',
      currentPeriodEnd: end,
      stripeCustomerId: idOf(session.customer),
      stripeSubscriptionId: null,
      amountPaid: session.amount_total,
      since: paidAt,
    });
  }

  for (const c of byEmail.values()) {
    try {
      const user = await prisma.user.upsert({
        where: { email: c.email },
        create: { email: c.email, name: c.name, createdAt: c.since },
        update: {},
      });
      if (!user.name && c.name) {
        await prisma.user.update({ where: { id: user.id }, data: { name: c.name } });
      }
      const data = {
        type: c.type,
        status: c.status,
        currentPeriodEnd: c.currentPeriodEnd,
        stripeCustomerId: c.stripeCustomerId,
        stripeSubscriptionId: c.stripeSubscriptionId,
        amountPaid: c.amountPaid,
      };
      await prisma.membership.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...data, createdAt: c.since },
        update: data,
      });
      result.members++;
      if (c.status === 'ACTIVE') result.active++;
    } catch (err) {
      result.errors.push(`${c.email}: ${err instanceof Error ? err.message.split('\n').pop() : String(err)}`);
    }
  }

  return result;
}
