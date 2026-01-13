import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

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

    // Determine return URL based on locale
    const returnPath = locale === 'fi' ? 'jasenyyys' : 'my-membership';

    // Create a billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: membership.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/${locale}/${returnPath}`,
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
