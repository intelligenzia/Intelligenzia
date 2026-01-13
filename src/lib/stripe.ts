import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Full membership - recurring annual subscription
export const FULL_MEMBERSHIP_PRICE_ID = process.env.STRIPE_FULL_MEMBERSHIP_PRICE_ID!;

// Supporting membership - product ID for pay-what-you-want
export const SUPPORTING_MEMBERSHIP_PRODUCT_ID = process.env.STRIPE_SUPPORTING_MEMBERSHIP_PRODUCT_ID!;

// Minimum amount for supporting membership in cents (€10 = 1000 cents)
export const SUPPORTING_MEMBERSHIP_MIN_AMOUNT = 1000;
