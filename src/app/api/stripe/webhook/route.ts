import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Helper to get current_period_end from subscription
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date {
  // In newer Stripe SDK, current_period_end is on subscription items
  const firstItem = subscription.items.data[0];
  if (firstItem?.current_period_end) {
    return new Date(firstItem.current_period_end * 1000);
  }
  // Fallback: use billing_cycle_anchor + 1 year as approximation
  return new Date((subscription.billing_cycle_anchor + 365 * 24 * 60 * 60) * 1000);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;

        if (session.mode === 'subscription') {
          // Full membership - subscription
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data'],
          }) as Stripe.Subscription;

          await prisma.membership.update({
            where: { stripeCustomerId: customerId },
            data: {
              status: 'ACTIVE',
              type: 'FULL',
              currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
            },
          });
        } else if (session.mode === 'payment') {
          // Supporting membership - one-time payment
          // Set membership to active for 1 year from now
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

          await prisma.membership.update({
            where: { stripeCustomerId: customerId },
            data: {
              status: 'ACTIVE',
              type: 'SUPPORTING',
              currentPeriodEnd: oneYearFromNow,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const status =
          subscription.status === 'active'
            ? 'ACTIVE'
            : subscription.status === 'past_due'
              ? 'EXPIRED'
              : subscription.status === 'canceled'
                ? 'CANCELLED'
                : 'PENDING';

        await prisma.membership.update({
          where: { stripeCustomerId: customerId },
          data: {
            status,
            currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await prisma.membership.update({
          where: { stripeCustomerId: customerId },
          data: {
            status: 'CANCELLED',
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          await prisma.membership.update({
            where: { stripeCustomerId: customerId },
            data: {
              status: 'EXPIRED',
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Handle successful invoice payment (subscription renewal)
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Get subscription ID from line items
        const subscriptionLineItem = invoice.lines?.data?.find(
          (line) => line.subscription
        );
        const subscriptionId = subscriptionLineItem?.subscription;

        if (subscriptionId && customerId && typeof subscriptionId === 'string') {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data'],
          }) as Stripe.Subscription;

          await prisma.membership.update({
            where: { stripeCustomerId: customerId },
            data: {
              status: 'ACTIVE',
              currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
