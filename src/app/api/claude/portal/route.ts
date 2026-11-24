import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, siteOrigin } from '@/lib/stripe';
import { localePath } from '@/lib/membership';

/** Stripe billing portal for the Claude subscription: card, receipts, cancel. */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { locale } = await req.json().catch(() => ({ locale: null }));
  if (locale !== 'fi' && locale !== 'en') {
    return NextResponse.json({ error: 'invalid_locale' }, { status: 400 });
  }

  const claude = await prisma.claudeSubscription.findUnique({ where: { userId: session.user.id } });
  if (!claude?.stripeCustomerId) {
    return NextResponse.json({ error: 'no_subscription' }, { status: 400 });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: claude.stripeCustomerId,
      locale,
      return_url: `${siteOrigin()}${localePath(locale, 'dashboard')}`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('Claude portal error:', error);
    return NextResponse.json({ error: 'portal_failed' }, { status: 500 });
  }
}
