import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

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
        const subscriptionId = session.subscription as string;

        // Get subscription details
        const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
        const subscription = subscriptionResponse as unknown as { current_period_end: number };

        // Update membership status
        await prisma.membership.update({
          where: { stripeCustomerId: customerId },
          data: {
            status: 'ACTIVE',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscriptionData = event.data.object as unknown as {
          customer: string;
          status: string;
          current_period_end: number;
        };

        await prisma.membership.update({
          where: { stripeCustomerId: subscriptionData.customer },
          data: {
            status: subscriptionData.status === 'active' ? 'ACTIVE' : 'EXPIRED',
            currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscriptionData = event.data.object as unknown as { customer: string };

        await prisma.membership.update({
          where: { stripeCustomerId: subscriptionData.customer },
          data: {
            status: 'CANCELLED',
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as { customer: string };

        await prisma.membership.update({
          where: { stripeCustomerId: invoice.customer },
          data: {
            status: 'EXPIRED',
          },
        });
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
