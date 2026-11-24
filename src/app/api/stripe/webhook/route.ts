import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { fulfillCheckoutSession, syncSubscription } from '@/lib/membership-sync';
import { invoiceSubscriptionId, recordInvoicePeriod } from '@/lib/membership-periods';
import { syncClaudeCheckout, syncClaudeSubscription } from '@/lib/claude-sync';
import { isClaudeInvoice, isClaudeSubscription } from '@/lib/claude-stripe';
import { isClaudeMetadata } from '@/lib/claude-plans';

// Subscribe the endpoint to exactly these events in the Stripe dashboard.
// Everything else is acknowledged and ignored.
//
// Each handler re-reads the object from Stripe instead of trusting the
// payload, so events arriving out of order (or from an endpoint pinned to an
// older API version) still converge on the current state.

// The Claude add-on shares the account. Its objects carry metadata
// addon=claude (or a Claude price) and go to claude-sync; everything else is
// the membership, as before.

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Stripe webhook: STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        if (isClaudeMetadata(event.data.object.metadata)) {
          await syncClaudeCheckout(event.data.object.id);
        } else {
          await fulfillCheckoutSession(event.data.object.id);
        }
        break;

      case 'checkout.session.async_payment_failed':
        console.warn(`Checkout ${event.data.object.id}: delayed payment failed`);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        if (isClaudeSubscription(event.data.object)) {
          await syncClaudeSubscription(event.data.object.id);
        } else {
          await syncSubscription(event.data.object.id);
        }
        break;

      case 'invoice.paid':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const subscriptionId = invoiceSubscriptionId(event.data.object);
        if (!subscriptionId) break;
        // Old invoices may lack the metadata snapshot: ask the subscription.
        const claude =
          isClaudeInvoice(event.data.object) ||
          isClaudeSubscription(await stripe.subscriptions.retrieve(subscriptionId));
        if (claude) {
          await syncClaudeSubscription(subscriptionId);
          break;
        }
        await syncSubscription(subscriptionId);
        // Each paid renewal is one more year in the member's history.
        if (event.type !== 'invoice.payment_failed') {
          await recordInvoicePeriod(await stripe.invoices.retrieve(event.data.object.id!));
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // 500 makes Stripe retry with backoff, which is what we want for a
    // transient database or API failure.
    console.error(`Webhook ${event.type} (${event.id}) failed:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
