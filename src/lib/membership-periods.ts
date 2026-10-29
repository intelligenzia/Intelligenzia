import type Stripe from 'stripe';
import type { MembershipType, Prisma } from '@prisma/client';
import { prisma } from './prisma';

export type PeriodInput = {
  userId: string;
  type: MembershipType;
  startsAt: Date;
  endsAt: Date;
  amountPaid: number | null;
  source: 'invoice' | 'checkout' | 'charge';
  /** Invoice, Checkout Session or Charge id: one row per payment. */
  stripePaymentId: string;
  stripeCustomerId: string | null;
};

type Db = Prisma.TransactionClient | typeof prisma;

/** Idempotent: a re-run or a duplicate webhook leaves one row per payment. */
export async function recordPeriod(input: PeriodInput, db: Db = prisma): Promise<void> {
  const { stripePaymentId, ...data } = input;
  await db.membershipPeriod.upsert({
    where: { stripePaymentId },
    create: { stripePaymentId, ...data },
    update: data,
  });
}

export function addYear(date: Date): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}

/**
 * The billed period of a paid subscription invoice, or null for invoices that
 * aren't a membership year (zero-amount trial invoices, one-off invoices).
 */
export function invoicePeriod(invoice: Stripe.Invoice): { start: Date; end: Date } | null {
  if (invoice.status !== 'paid' || !invoice.amount_paid) return null;
  const line = invoice.lines?.data?.find(
    (l) => l.parent?.subscription_item_details || l.subscription
  );
  if (!line?.period?.start || !line.period.end) return null;
  return { start: new Date(line.period.start * 1000), end: new Date(line.period.end * 1000) };
}

/** Records the year a paid subscription invoice covers. Used by the webhook. */
export async function recordInvoicePeriod(invoice: Stripe.Invoice): Promise<void> {
  const period = invoicePeriod(invoice);
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer?.id ?? null);
  if (!period || !customerId || !invoice.id) return;

  const membership = await prisma.membership.findUnique({ where: { stripeCustomerId: customerId } });
  if (!membership) return;
  await recordPeriod({
    userId: membership.userId,
    type: 'FULL',
    startsAt: period.start,
    endsAt: period.end,
    amountPaid: invoice.amount_paid,
    source: 'invoice',
    stripePaymentId: invoice.id,
    stripeCustomerId: customerId,
  });
}
