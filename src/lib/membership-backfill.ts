import type Stripe from 'stripe';
import type { MembershipStatus, MembershipType } from '@prisma/client';
import { prisma } from './prisma';
import { stripe, FULL_MEMBERSHIP_PRICE_ID, SUPPORTING_MEMBERSHIP_PRODUCT_ID } from './stripe';
import { subscriptionPeriodEnd, subscriptionStatus } from './membership-sync';
import { addYear, invoicePeriod, recordPeriod, type PeriodInput } from './membership-periods';
import { loadSuppressions } from './account';

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

type Period = Omit<PeriodInput, 'userId'> & { email: string; name: string | null };

export type BackfillResult = {
  dryRun: boolean;
  members: number;
  active: number;
  subscriptions: number;
  oneOffPayments: number;
  legacyCharges: number;
  /** Paid membership years found, by the year each one started. */
  periods: number;
  periodsByYear: Record<string, number>;
  skipped: number;
  /** Payments of people who had their account deleted (GDPR), left out. */
  suppressed: number;
  /** One-off payments not recognised as membership, for a human to check.
   *  Grouped by year and product/description; no personal data. */
  unmatched: { year: number; label: string; amount: number; count: number }[];
  errors: string[];
};

const rank: Record<MembershipStatus, number> = { ACTIVE: 3, EXPIRED: 2, CANCELLED: 1, PENDING: 0 };

/** Prefer a live membership, then the one that runs latest. */
function better(a: Candidate, b: Candidate): Candidate {
  if (rank[a.status] !== rank[b.status]) return rank[a.status] > rank[b.status] ? a : b;
  return (a.currentPeriodEnd?.getTime() ?? 0) >= (b.currentPeriodEnd?.getTime() ?? 0) ? a : b;
}

const idOf = (x: string | { id: string } | null | undefined) =>
  !x ? null : typeof x === 'string' ? x : x.id;

const norm = (email: string | null | undefined) => email?.trim().toLowerCase() || null;

// Old membership payments predate the site's metadata. They are recognised by
// the words Intelligenzia used in product names and charge descriptions.
const MEMBERSHIP_WORDS = /j[äa]sen|member|kannatus/i;
const SUPPORTING_WORDS = /kannatus|support/i;

/**
 * Rebuilds the member register from Stripe, the record of who actually paid:
 * the current state on Membership, and every paid year on MembershipPeriod so
 * earlier years count too. For a fresh database or to reconcile after missed
 * webhooks. Writes rows only, never emails anyone, and is safe to re-run.
 * With dryRun it reads Stripe and reports what it would write.
 */
export async function backfillFromStripe({ dryRun = false } = {}): Promise<BackfillResult> {
  const result: BackfillResult = {
    dryRun,
    members: 0,
    active: 0,
    subscriptions: 0,
    oneOffPayments: 0,
    legacyCharges: 0,
    periods: 0,
    periodsByYear: {},
    skipped: 0,
    suppressed: 0,
    unmatched: [],
    errors: [],
  };
  const now = new Date();
  const isSuppressed = await loadSuppressions();
  const suppressed = (email: string, at: Date) => {
    if (!isSuppressed(email, at)) return false;
    result.suppressed++;
    return true;
  };
  const byEmail = new Map<string, Candidate>();
  const periods: Period[] = [];
  const unmatched = new Map<string, { year: number; label: string; amount: number; count: number }>();

  const offer = (c: Candidate) => {
    const prev = byEmail.get(c.email);
    const pick = prev ? better(prev, c) : c;
    // Keep the earliest start so "member since" survives a later renewal.
    const since = prev && prev.since < c.since ? prev.since : c.since;
    byEmail.set(c.email, { ...pick, since, name: pick.name ?? prev?.name ?? c.name });
  };
  const miss = (created: number, label: string, amount: number | null) => {
    const year = new Date(created * 1000).getFullYear();
    const key = `${year}|${label}|${amount}`;
    const entry = unmatched.get(key) ?? { year, label, amount: (amount ?? 0) / 100, count: 0 };
    entry.count++;
    unmatched.set(key, entry);
  };

  // 1. Subscriptions: the current state of every recurring membership. Every
  //    recurring price on the account is the membership.
  const subCustomer = new Map<string, Stripe.Customer>();
  for await (const sub of stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] })) {
    const customer = sub.customer as Stripe.Customer | Stripe.DeletedCustomer;
    const email = 'email' in customer ? norm(customer.email) : null;
    const status = subscriptionStatus(sub.status);
    if (!email || !status) {
      result.skipped++;
      continue;
    }
    if (suppressed(email, new Date(sub.start_date * 1000))) continue;
    if (!('deleted' in customer)) subCustomer.set(customer.id, customer);
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

  // 2. Paid subscription invoices: one row per membership year, including
  //    the years before the current one.
  for await (const invoice of stripe.invoices.list({ status: 'paid', limit: 100 })) {
    const period = invoicePeriod(invoice);
    if (!period || !invoice.id) continue;
    const customerId = idOf(invoice.customer);
    const customer = customerId ? subCustomer.get(customerId) : undefined;
    const email = norm(invoice.customer_email) ?? norm(customer?.email);
    if (!email) {
      result.skipped++;
      continue;
    }
    if (suppressed(email, new Date(invoice.created * 1000))) continue;
    periods.push({
      email,
      name: invoice.customer_name ?? customer?.name ?? null,
      type: 'FULL',
      startsAt: period.start,
      endsAt: period.end,
      amountPaid: invoice.amount_paid,
      source: 'invoice',
      stripePaymentId: invoice.id,
      stripeCustomerId: customerId,
    });
  }

  // 3. One-off membership payments through Checkout: the site's supporting
  //    checkout, old one-time membership prices and membership Payment
  //    Links. Event tickets share the account, so match on the product.
  const fullProduct = FULL_MEMBERSHIP_PRICE_ID
    ? idOf((await stripe.prices.retrieve(FULL_MEMBERSHIP_PRICE_ID)).product)
    : null;
  const productNames = new Map<string, string>();
  const productName = async (id: string) => {
    if (!productNames.has(id)) {
      try {
        productNames.set(id, (await stripe.products.retrieve(id)).name);
      } catch {
        productNames.set(id, '');
      }
    }
    return productNames.get(id)!;
  };
  const checkoutPaymentIntents = new Set<string>();

  for await (const session of stripe.checkout.sessions.list({
    status: 'complete',
    limit: 100,
    expand: ['data.line_items'],
  })) {
    const pi = idOf(session.payment_intent);
    if (pi) checkoutPaymentIntents.add(pi);
    if (session.mode !== 'payment' || session.payment_status !== 'paid') continue;

    const products = (session.line_items?.data ?? [])
      .map((li) => idOf(li.price?.product))
      .filter((p): p is string => !!p);
    const names = await Promise.all(products.map(productName));
    const supporting =
      session.metadata?.membershipType === 'SUPPORTING' ||
      (!!SUPPORTING_MEMBERSHIP_PRODUCT_ID && products.includes(SUPPORTING_MEMBERSHIP_PRODUCT_ID)) ||
      names.some((n) => SUPPORTING_WORDS.test(n) && MEMBERSHIP_WORDS.test(n));
    const full =
      session.metadata?.membershipType === 'FULL' ||
      (!!fullProduct && products.includes(fullProduct)) ||
      names.some((n) => MEMBERSHIP_WORDS.test(n));
    if (!supporting && !full) {
      miss(session.created, names.filter(Boolean).join(', ') || '(checkout, no product)', session.amount_total);
      continue;
    }

    const email = norm(session.customer_details?.email);
    if (!email) {
      result.skipped++;
      continue;
    }
    if (suppressed(email, new Date(session.created * 1000))) continue;
    result.oneOffPayments++;
    const paidAt = new Date(session.created * 1000);
    const start = session.metadata?.periodStart ? new Date(session.metadata.periodStart) : paidAt;
    const end = addYear(start);
    const type: MembershipType = supporting ? 'SUPPORTING' : 'FULL';
    const name =
      session.collected_information?.individual_name ??
      session.customer_details?.individual_name ??
      session.customer_details?.name ??
      null;
    periods.push({
      email,
      name,
      type,
      startsAt: start,
      endsAt: end,
      amountPaid: session.amount_total,
      source: 'checkout',
      stripePaymentId: session.id,
      stripeCustomerId: idOf(session.customer),
    });
    offer({
      email,
      name,
      type,
      status: end > now ? 'ACTIVE' : 'EXPIRED',
      currentPeriodEnd: end,
      stripeCustomerId: idOf(session.customer),
      stripeSubscriptionId: null,
      amountPaid: session.amount_total,
      since: paidAt,
    });
  }

  // 4. Legacy charges made outside Checkout and invoices (the old site's
  //    payment forms). Only ones whose description names the membership.
  for await (const charge of stripe.charges.list({ limit: 100 })) {
    if (charge.status !== 'succeeded' || !charge.paid || charge.refunded) continue;
    if (charge.amount_refunded >= charge.amount) continue;
    const pi = idOf(charge.payment_intent);
    if (pi && checkoutPaymentIntents.has(pi)) continue;
    const description = charge.description ?? '';
    // Subscription invoices are already covered by step 2.
    if (/^subscription (creation|update|cycle)/i.test(description)) continue;
    const text = [description, ...Object.values(charge.metadata ?? {})].join(' ');
    if (!MEMBERSHIP_WORDS.test(text)) {
      miss(charge.created, description || '(charge, no description)', charge.amount);
      continue;
    }

    const email = norm(charge.billing_details?.email) ?? norm(charge.receipt_email);
    if (!email) {
      result.skipped++;
      continue;
    }
    if (suppressed(email, new Date(charge.created * 1000))) continue;
    result.legacyCharges++;
    const paidAt = new Date(charge.created * 1000);
    const end = addYear(paidAt);
    const type: MembershipType = SUPPORTING_WORDS.test(text) ? 'SUPPORTING' : 'FULL';
    const name = charge.billing_details?.name ?? null;
    periods.push({
      email,
      name,
      type,
      startsAt: paidAt,
      endsAt: end,
      amountPaid: charge.amount - charge.amount_refunded,
      source: 'charge',
      stripePaymentId: charge.id,
      stripeCustomerId: idOf(charge.customer),
    });
    offer({
      email,
      name,
      type,
      status: end > now ? 'ACTIVE' : 'EXPIRED',
      currentPeriodEnd: end,
      stripeCustomerId: idOf(charge.customer),
      stripeSubscriptionId: null,
      amountPaid: charge.amount - charge.amount_refunded,
      since: paidAt,
    });
  }

  // Invoices also reveal members whose subscription object is gone.
  for (const p of periods) {
    if (!byEmail.has(p.email)) {
      offer({
        email: p.email,
        name: p.name,
        type: p.type,
        status: p.endsAt > now ? 'ACTIVE' : 'EXPIRED',
        currentPeriodEnd: p.endsAt,
        stripeCustomerId: p.stripeCustomerId,
        stripeSubscriptionId: null,
        amountPaid: p.amountPaid,
        since: p.startsAt,
      });
    }
  }

  result.periods = periods.length;
  for (const p of periods) {
    const y = String(p.startsAt.getFullYear());
    result.periodsByYear[y] = (result.periodsByYear[y] ?? 0) + 1;
  }
  result.unmatched = [...unmatched.values()].sort((a, b) => b.year - a.year || b.count - a.count);

  if (dryRun) {
    result.members = byEmail.size;
    result.active = [...byEmail.values()].filter((c) => c.status === 'ACTIVE').length;
    return result;
  }

  const userIds = new Map<string, string>();
  for (const c of byEmail.values()) {
    try {
      const user = await prisma.user.upsert({
        where: { email: c.email },
        create: { email: c.email, name: c.name, createdAt: c.since },
        update: {},
      });
      userIds.set(c.email, user.id);
      if (!user.name && c.name) {
        await prisma.user.update({ where: { id: user.id }, data: { name: c.name } });
      }
      // stripeCustomerId is unique; two emails can share a customer in
      // Stripe, so only claim it when nobody else has.
      const owner = c.stripeCustomerId
        ? await prisma.membership.findUnique({ where: { stripeCustomerId: c.stripeCustomerId } })
        : null;
      const data = {
        type: c.type,
        status: c.status,
        currentPeriodEnd: c.currentPeriodEnd,
        stripeCustomerId: owner && owner.userId !== user.id ? undefined : c.stripeCustomerId,
        stripeSubscriptionId: c.stripeSubscriptionId,
        amountPaid: c.amountPaid,
      };
      await prisma.membership.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...data, createdAt: c.since },
        update: { ...data, createdAt: c.since },
      });
      result.members++;
      if (c.status === 'ACTIVE') result.active++;
    } catch (err) {
      result.errors.push(`${c.email}: ${err instanceof Error ? err.message.split('\n').pop() : String(err)}`);
    }
  }

  for (const p of periods) {
    const { email, name, ...period } = p;
    void name;
    const userId = userIds.get(email);
    if (!userId) continue;
    try {
      await recordPeriod({ ...period, userId });
    } catch (err) {
      result.errors.push(`${period.stripePaymentId}: ${err instanceof Error ? err.message.split('\n').pop() : String(err)}`);
    }
  }

  return result;
}
