import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { auth } from '@/lib/auth';
import {
  stripe,
  siteOrigin,
  FULL_MEMBERSHIP_PRICE_ID,
  SUPPORTING_MEMBERSHIP_PRODUCT_ID,
} from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import {
  FULL_PRICE,
  MAX_SUPPORTING_PRICE,
  MIN_SUPPORTING_PRICE,
  formatDate,
  localePath,
  membershipState,
  planCheckout,
  type MembershipType,
} from '@/lib/membership';

const productNames: Record<MembershipType, string> = {
  FULL: 'Intelligenzia – varsinainen jäsenyys / full membership',
  SUPPORTING: 'Intelligenzia – kannatusjäsenyys / supporting membership',
};

export async function POST(req: NextRequest) {
  let body: { membershipType?: unknown; locale?: unknown; amount?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const { membershipType, amount } = body;
  const locale = body.locale === 'en' ? 'en' : body.locale === 'fi' ? 'fi' : null;
  if (!locale) {
    return NextResponse.json({ error: 'invalid_locale' }, { status: 400 });
  }
  if (membershipType !== 'FULL' && membershipType !== 'SUPPORTING') {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }
  // Whole euros; passed to Stripe as unit_amount once converted to cents.
  if (
    membershipType === 'SUPPORTING' &&
    (typeof amount !== 'number' ||
      !Number.isInteger(amount) ||
      amount < MIN_SUPPORTING_PRICE ||
      amount > MAX_SUPPORTING_PRICE)
  ) {
    return NextResponse.json({ error: 'invalid_amount' }, { status: 400 });
  }

  const fi = locale === 'fi';

  try {
    // Signing in is optional: guests pay first and Stripe collects their
    // email. Signed-in members get their eligibility checked here.
    const session = await auth();
    const userId = session?.user?.id;
    const membership = userId
      ? await prisma.membership.findUnique({ where: { userId } })
      : null;

    const plan = planCheckout(membershipState(membership), membershipType);
    if (!plan.ok) {
      return NextResponse.json(
        { error: plan.reason, opensInDays: plan.opensInDays },
        { status: 409 }
      );
    }

    const metadata: Record<string, string> = {
      membershipType,
      locale,
      ...(userId ? { userId } : {}),
      ...(plan.periodStart ? { periodStart: plan.periodStart.toISOString() } : {}),
    };

    // Reuse the member's Stripe customer so the billing portal shows one
    // history. Never look a guest up by email: Checkout would show that
    // customer's saved cards to whoever typed the address.
    const customer: Pick<
      Stripe.Checkout.SessionCreateParams,
      'customer' | 'customer_email' | 'customer_creation'
    > = membership?.stripeCustomerId
      ? { customer: membership.stripeCustomerId }
      : {
          ...(session?.user?.email ? { customer_email: session.user.email } : {}),
          // Subscriptions always create a customer; one-off payments only on request.
          ...(membershipType === 'SUPPORTING' ? { customer_creation: 'always' as const } : {}),
        };

    const origin = siteOrigin();
    const backToChoice = new URLSearchParams({
      type: membershipType,
      ...(membershipType === 'SUPPORTING' ? { amount: String(amount) } : {}),
      cancelled: '1',
    });

    const shared: Stripe.Checkout.SessionCreateParams = {
      ...customer,
      locale,
      // Omitting payment_method_types lets Stripe offer whatever is enabled
      // in the dashboard (cards, Apple Pay, Google Pay, MobilePay, …).
      name_collection: { individual: { enabled: true } },
      success_url: `${origin}${localePath(locale, 'thanks')}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${localePath(locale, 'join')}?${backToChoice}`,
      metadata,
    };

    let checkoutSession: Stripe.Checkout.Session;

    if (membershipType === 'FULL') {
      const message = plan.trialEnd
        ? fi
          ? `Varsinainen jäsenyytesi alkaa heti. Ensimmäinen ${FULL_PRICE} € veloitus tehdään ${formatDate(plan.trialEnd, locale)}, kun nykyinen jäsenkautesi päättyy. Sen jälkeen jäsenyys uusiutuu vuosittain.`
          : `Your full membership starts now. The first ${FULL_PRICE} € charge is on ${formatDate(plan.trialEnd, locale)}, when your current period ends, and it renews yearly after that.`
        : fi
          ? 'Jäsenyys uusiutuu vuosittain. Voit perua uusiutumisen milloin tahansa Jäsenyyteni-sivulla.'
          : 'Your membership renews yearly. You can stop renewal at any time on the My Membership page.';

      checkoutSession = await stripe.checkout.sessions.create({
        ...shared,
        mode: 'subscription',
        line_items: [
          FULL_MEMBERSHIP_PRICE_ID
            ? { price: FULL_MEMBERSHIP_PRICE_ID, quantity: 1 }
            : {
                price_data: {
                  currency: 'eur',
                  unit_amount: FULL_PRICE * 100,
                  recurring: { interval: 'year' },
                  product_data: { name: productNames.FULL },
                },
                quantity: 1,
              },
        ],
        subscription_data: {
          metadata,
          ...(plan.trialEnd ? { trial_end: Math.floor(plan.trialEnd.getTime() / 1000) } : {}),
        },
        custom_text: { submit: { message } },
      });
    } else {
      const start = plan.periodStart ?? new Date();
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      const message = fi
        ? `Kertamaksu. Kannatusjäsenyys on voimassa ${formatDate(end, locale)} asti, eikä se uusiudu automaattisesti.`
        : `One-time payment. Your supporting membership is valid until ${formatDate(end, locale)} and does not renew automatically.`;

      checkoutSession = await stripe.checkout.sessions.create({
        ...shared,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: (amount as number) * 100,
              ...(SUPPORTING_MEMBERSHIP_PRODUCT_ID
                ? { product: SUPPORTING_MEMBERSHIP_PRODUCT_ID }
                : { product_data: { name: productNames.SUPPORTING } }),
            },
            quantity: 1,
          },
        ],
        payment_intent_data: { metadata },
        custom_text: { submit: { message } },
      });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
  }
}
