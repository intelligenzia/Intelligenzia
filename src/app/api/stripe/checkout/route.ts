import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  stripe,
  FULL_MEMBERSHIP_PRICE_ID,
  SUPPORTING_MEMBERSHIP_PRODUCT_ID,
  SUPPORTING_MEMBERSHIP_MIN_AMOUNT,
} from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { membershipType, locale, customAmount } = await req.json();

    // Validate locale
    if (!['fi', 'en'].includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    // Validate membership type
    if (!['FULL', 'SUPPORTING'].includes(membershipType)) {
      return NextResponse.json(
        { error: 'Invalid membership type' },
        { status: 400 }
      );
    }

    // Validate custom amount for supporting membership
    if (membershipType === 'SUPPORTING') {
      if (!customAmount || customAmount < SUPPORTING_MEMBERSHIP_MIN_AMOUNT) {
        return NextResponse.json(
          {
            error: `Minimum amount is €${SUPPORTING_MEMBERSHIP_MIN_AMOUNT / 100}`,
          },
          { status: 400 }
        );
      }
    }

    // Get or create Stripe customer
    let membership = await prisma.membership.findUnique({
      where: { userId: session.user.id },
    });

    let customerId = membership?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
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
            type: membershipType,
            status: 'PENDING',
            stripeCustomerId: customerId,
          },
        });
      }
    }

    // Determine success/cancel URLs based on locale
    const successPath = locale === 'fi' ? 'jasenyyys' : 'my-membership';
    const cancelPath = locale === 'fi' ? 'jaseneksi' : 'membership';

    // Create checkout session based on membership type
    let checkoutSession;

    if (membershipType === 'FULL') {
      // Full membership - recurring annual subscription
      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId!,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: FULL_MEMBERSHIP_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/${locale}/${successPath}?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/${locale}/${cancelPath}?cancelled=true`,
        metadata: {
          userId: session.user.id!,
          membershipType: 'FULL',
        },
        subscription_data: {
          metadata: {
            userId: session.user.id!,
            membershipType: 'FULL',
          },
        },
      });
    } else {
      // Supporting membership - one-time payment with custom amount
      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId!,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product: SUPPORTING_MEMBERSHIP_PRODUCT_ID,
              unit_amount: customAmount,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/${locale}/${successPath}?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/${locale}/${cancelPath}?cancelled=true`,
        metadata: {
          userId: session.user.id!,
          membershipType: 'SUPPORTING',
          customAmount: customAmount.toString(),
        },
      });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
