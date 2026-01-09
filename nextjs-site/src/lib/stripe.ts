import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const MEMBERSHIP_PRICE_ID = process.env.STRIPE_PRICE_ID!;
