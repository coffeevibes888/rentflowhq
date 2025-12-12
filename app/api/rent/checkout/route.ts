import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import Stripe from 'stripe';
import { getConvenienceFeeInCents } from '@/lib/config/platform-fees';

/**
 * Rent checkout API - works with path-based routing
 * Landlord is determined from the rent payment's property, not from subdomain
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as
    | { rentPaymentIds?: string[]; paymentMethodType?: 'ach' | 'card' }
    | null;

  if (!body?.rentPaymentIds || !Array.isArray(body.rentPaymentIds) || body.rentPaymentIds.length === 0) {
    return NextResponse.json({ message: 'No rent payments specified' }, { status: 400 });
  }

  // Get rent payments for this tenant
  const rentPayments = await prisma.rentPayment.findMany({
    where: {
      id: { in: body.rentPaymentIds },
      tenantId: session.user.id as string,
      status: 'pending',
    },
    include: {
      lease: {
        include: {
          unit: {
            include: {
              property: true,
            },
          },
        },
      },
    },
  });

  if (rentPayments.length === 0) {
    return NextResponse.json({ message: 'No pending rent payments found' }, { status: 400 });
  }

  // Get landlordId from the rent payment's property
  const firstPayment = rentPayments[0] as typeof rentPayments[0] & {
    lease: { unit: { property: { landlordId: string } } };
  };
  const landlordId = firstPayment.lease?.unit?.property?.landlordId || null;

  if (!landlordId) {
    return NextResponse.json({ message: 'Could not determine landlord for payment' }, { status: 400 });
  }

  const totalAmount = rentPayments.reduce((sum, p) => {
    const amt = Number(p.amount);
    return sum + (Number.isNaN(amt) ? 0 : amt);
  }, 0);

  if (!totalAmount || totalAmount <= 0) {
    return NextResponse.json({ message: 'Invalid total amount' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  const landlord = await prisma.landlord.findUnique({
    where: { id: landlordId },
    select: { stripeConnectAccountId: true },
  });

  // Get convenience fee based on payment method type
  // Default to 'card' to show the convenience fee, but ACH will be free
  const paymentMethodType = body.paymentMethodType || 'card';
  const convenienceFee = getConvenienceFeeInCents(paymentMethodType);
  const rentAmountInCents = Math.round(totalAmount * 100);
  const totalWithFee = rentAmountInCents + convenienceFee;

  // Create Payment Intent with dynamic payment method options
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: totalWithFee,
    currency: 'usd',
    metadata: {
      type: 'rent_payment',
      tenantId: session.user.id as string,
      rentPaymentIds: rentPayments.map((p) => p.id).join(','),
      landlordId,
      landlordStripeConnectAccountId: landlord?.stripeConnectAccountId ?? null,
      rentAmount: rentAmountInCents.toString(),
      convenienceFee: convenienceFee.toString(),
      maxConvenienceFee: getConvenienceFeeInCents('card').toString(), // Max possible fee
    },
    // Use automatic_payment_methods for card, ACH, Link, Apple Pay, Google Pay
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never', // Keep everything in-page
    },
    // ACH requires customer email for mandate
    receipt_email: session.user.email || undefined,
  };

  // If landlord has Stripe Connect account, charge them directly with application fee
  if (landlord?.stripeConnectAccountId) {
    // The convenience fee is the application fee that goes to platform
    paymentIntentParams.application_fee_amount = convenienceFee;
    paymentIntentParams.on_behalf_of = landlord.stripeConnectAccountId;
    // Transfer remaining funds (rent amount) to landlord's connected account
    paymentIntentParams.transfer_data = {
      destination: landlord.stripeConnectAccountId,
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    await prisma.rentPayment.updateMany({
      where: { id: { in: rentPayments.map((p) => p.id) } },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      convenienceFee: convenienceFee / 100, // Return as dollars
      rentAmount: totalAmount,
      totalAmount: totalWithFee / 100,
    });
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    const message = error instanceof Error ? error.message : 'Payment initialization failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
