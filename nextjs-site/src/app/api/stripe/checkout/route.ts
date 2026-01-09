import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe, MEMBERSHIP_PRICE_ID } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { membershipType, locale } = await req.json();

    // Get or create Stripe customer
    let membership = await prisma.membership.findUnique({
      where: { userId: session.user.id },
    });

    let customerId = membership?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        metadata: {
          userId: session.user.id!,
        },
      });
      customerId = customer.id;

      // Create or update membership record
      if (membership) {
        await prisma.membership.update({
          where: { id: membership.id },
          data: { stripeCustomerId: customerId },
        });
      } else {
        await prisma.membership.create({
          data: {
            user: { connect: { id: session.user.id! } },
            type: membershipType || 'FULL',
            status: 'PENDING',
            stripeCustomerId: customerId,
          },
        });
      }
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId!,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: MEMBERSHIP_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/${locale}/jasenyyys?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/${locale}/jaseneksi?cancelled=true`,
      metadata: {
        userId: session.user.id!,
        membershipType: membershipType || 'FULL',
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
