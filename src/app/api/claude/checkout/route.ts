import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, siteOrigin, CLAUDE_PRICE_IDS } from '@/lib/stripe';
import { localePath, membershipState } from '@/lib/membership';
import {
  CLAUDE_ADDON,
  CLAUDE_TIERS,
  canStartClaude,
  claudeState,
  isClaudeTier,
} from '@/lib/claude-plans';

/**
 * Starts a monthly Claude subscription. Members only: the caller must be
 * signed in with an active membership and an @intelligenzia.fi address, and
 * must not already have a subscription.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { tier?: unknown; locale?: unknown; acceptTerms?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const locale = body.locale === 'en' ? 'en' : body.locale === 'fi' ? 'fi' : null;
  if (!locale) return NextResponse.json({ error: 'invalid_locale' }, { status: 400 });
  if (!isClaudeTier(body.tier)) return NextResponse.json({ error: 'invalid_tier' }, { status: 400 });
  if (body.acceptTerms !== true) return NextResponse.json({ error: 'terms_required' }, { status: 400 });
  const tier = body.tier;

  try {
    const [membership, claude, workspace] = await Promise.all([
      prisma.membership.findUnique({ where: { userId } }),
      prisma.claudeSubscription.findUnique({ where: { userId } }),
      prisma.workspaceAccount.findUnique({ where: { userId } }),
    ]);
    if (!canStartClaude(membershipState(membership))) {
      return NextResponse.json({ error: 'not_member' }, { status: 403 });
    }
    // Claude signs in with the member's @intelligenzia.fi address.
    if (!workspace || (workspace.state !== 'ACTIVE' && workspace.state !== 'REQUESTED')) {
      return NextResponse.json({ error: 'no_address' }, { status: 409 });
    }
    if (claudeState(claude).kind !== 'none') {
      return NextResponse.json({ error: 'already_subscribed' }, { status: 409 });
    }

    const metadata: Record<string, string> = {
      addon: CLAUDE_ADDON,
      claudeTier: tier,
      userId,
      locale,
      termsAcceptedAt: new Date().toISOString(),
    };

    // Same Stripe customer as the membership, so the billing portal shows
    // both and the member has one card on file.
    const customerId = membership?.stripeCustomerId ?? claude?.stripeCustomerId ?? null;
    const customer: Pick<Stripe.Checkout.SessionCreateParams, 'customer' | 'customer_email'> =
      customerId
        ? { customer: customerId }
        : session.user.email
          ? { customer_email: session.user.email }
          : {};

    const origin = siteOrigin();
    const dashboard = `${origin}${localePath(locale, 'dashboard')}`;
    const terms = `${origin}${localePath(locale, 'claude')}`;
    const { price, label } = CLAUDE_TIERS[tier];
    const priceId = CLAUDE_PRICE_IDS[tier];

    const checkout = await stripe.checkout.sessions.create({
      ...customer,
      mode: 'subscription',
      locale,
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              price_data: {
                currency: 'eur',
                unit_amount: price * 100,
                recurring: { interval: 'month' },
                product_data: { name: `Intelligenzia – ${label}` },
              },
              quantity: 1,
            },
      ],
      metadata,
      subscription_data: { metadata },
      success_url: `${dashboard}?claude_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${dashboard}?claude=cancelled`,
      custom_text: {
        submit: {
          message:
            locale === 'fi'
              ? `Laskutetaan kuukausittain. Voit lopettaa milloin tahansa Jäsenyyteni-sivulla. Käyttöehdot: ${terms}`
              : `Billed monthly. Cancel any time on the My Membership page. Terms: ${terms}`,
        },
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error('Claude checkout error:', error);
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
  }
}
