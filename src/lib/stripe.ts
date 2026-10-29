import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Full membership - recurring annual subscription. STRIPE_PRICE_ID is the
// older name some environments still use. When neither is set, checkout
// falls back to an inline yearly price so a missing variable can't take
// joining down.
export const FULL_MEMBERSHIP_PRICE_ID =
  process.env.STRIPE_FULL_MEMBERSHIP_PRICE_ID || process.env.STRIPE_PRICE_ID || undefined;

// Supporting membership - product ID for pay-what-you-want. Optional for the
// same reason; without it the product is described inline.
export const SUPPORTING_MEMBERSHIP_PRODUCT_ID =
  process.env.STRIPE_SUPPORTING_MEMBERSHIP_PRODUCT_ID || undefined;

/** Public origin for links that leave the site: Stripe redirects, emails. */
export function siteOrigin(): string {
  const url =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://intelligenzia.fi';
  return new URL(url).origin;
}
