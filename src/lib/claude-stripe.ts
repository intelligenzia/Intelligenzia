import type Stripe from 'stripe';
import { CLAUDE_PRICE_IDS } from './stripe';
import { CLAUDE_TIERS, CLAUDE_TIER_ORDER, isClaudeMetadata, isClaudeTier, type ClaudeTier } from './claude-plans';

// Telling Claude add-on objects apart from membership ones on the shared
// Stripe account. The membership code used to assume every subscription was
// the membership; everything that reads subscriptions or invoices now asks
// here first.

const idOf = (x: string | { id: string } | null | undefined) =>
  !x ? null : typeof x === 'string' ? x : x.id;

function claudePriceIds(): Set<string> {
  return new Set(Object.values(CLAUDE_PRICE_IDS).filter((id): id is string => !!id));
}

export function isClaudeSubscription(sub: Stripe.Subscription): boolean {
  if (isClaudeMetadata(sub.metadata)) return true;
  const ids = claudePriceIds();
  return sub.items?.data?.some((item) => ids.has(item.price.id)) ?? false;
}

/** From the invoice alone: its subscription metadata snapshot or its prices. */
export function isClaudeInvoice(invoice: Stripe.Invoice): boolean {
  if (isClaudeMetadata(invoice.parent?.subscription_details?.metadata)) return true;
  const ids = claudePriceIds();
  return (
    invoice.lines?.data?.some((line) => {
      const price = idOf(line.pricing?.price_details?.price);
      return !!price && ids.has(price);
    }) ?? false
  );
}

/**
 * The tier a subscription is on now. The price wins over the metadata, which
 * still names the tier first bought after a change in the billing portal.
 */
export function claudeTierOf(sub: Stripe.Subscription): ClaudeTier {
  const price = sub.items?.data?.[0]?.price;
  for (const tier of CLAUDE_TIER_ORDER) {
    if (price?.id && price.id === CLAUDE_PRICE_IDS[tier]) return tier;
  }
  for (const tier of CLAUDE_TIER_ORDER) {
    if (price?.unit_amount === CLAUDE_TIERS[tier].price * 100) return tier;
  }
  return isClaudeTier(sub.metadata?.claudeTier) ? sub.metadata.claudeTier : 'STANDARD';
}
