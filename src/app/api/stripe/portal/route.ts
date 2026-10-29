import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe, siteOrigin } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { localePath } from '@/lib/membership';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locale } = await req.json();

    // Validate locale
    if (!['fi', 'en'].includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    // Get user's membership with Stripe customer ID
    const membership = await prisma.membership.findUnique({
      where: { userId: session.user.id },
    });

    if (!membership?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      );
    }

    // Create a billing portal session. Live mode refuses this until the
    // portal settings have been saved once in the Stripe dashboard.
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: membership.stripeCustomerId,
      locale,
      return_url: `${siteOrigin()}${localePath(locale, 'dashboard')}`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
