import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import Stripe from 'stripe';

/**
 * Rent checkout API - DIRECT TO LANDLORD MODEL
 * 
 * Payments go directly to landlord's Stripe Connect account.
 * No platform fees on rent - landlords pay subscription instead.
 * 
 * Flow:
 * 1. Tenant pays rent
 * 2. Money goes directly to landlord's Connect account
 * 3. Stripe takes their processing fee
 * 4. Landlord receives the rest immediately
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as
    | { rentPaymentIds?: string[] }
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
              property: {
                include: {
                  landlord: {
                    select: {
                      id: true,
                      stripeConnectAccountId: true,
                      stripeOnboardingStatus: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (rentPayments.length === 0) {
    return NextResponse.json({ message: 'No pending rent payments found' }, { status: 400 });
  }

  // Get landlord info
  const firstPayment = rentPayments[0];
  const landlord = firstPayment.lease?.unit?.property?.landlord;

  if (!landlord) {
    return NextResponse.json({ message: 'Could not determine landlord for payment' }, { status: 400 });
  }

  // Verify landlord has completed Stripe Connect onboarding
  if (!landlord.stripeConnectAccountId) {
    return NextResponse.json({ 
      message: 'Your landlord has not set up payment receiving. Please contact them.',
      code: 'LANDLORD_NOT_ONBOARDED'
    }, { status: 400 });
  }

  // If local status isn't active, verify against Stripe (local status may be stale)
  if (landlord.stripeOnboardingStatus !== 'active') {
    try {
      const stripeForStatus = new Stripe(process.env.STRIPE_SECRET_KEY as string);
      const account = await stripeForStatus.accounts.retrieve(landlord.stripeConnectAccountId);

      const isOnboarded = account.details_submitted || false;
      const canReceivePayouts = account.payouts_enabled || false;

      let status = 'pending';
      if (isOnboarded && canReceivePayouts) {
        status = 'active';
      } else if (isOnboarded && !canReceivePayouts) {
        status = 'pending_verification';
      } else if (account.requirements?.currently_due?.length) {
        status = 'action_required';
      }

      if (landlord.stripeOnboardingStatus !== status) {
        await prisma.landlord.update({
          where: { id: landlord.id },
          data: { stripeOnboardingStatus: status },
        });
      }

      if (status !== 'active') {
        return NextResponse.json(
          {
            message:
              status === 'action_required'
                ? "Your landlord's payment account needs additional information. Please contact them."
                : "Your landlord's payment account is pending verification. Please try again later or contact them.",
            code:
              status === 'action_required'
                ? 'LANDLORD_ACTION_REQUIRED'
                : 'LANDLORD_PENDING_VERIFICATION',
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Stripe Connect status verification failed:', error);
      return NextResponse.json(
        {
          message: "Your landlord's payment account needs attention. Please contact them.",
          code: 'LANDLORD_STRIPE_STATUS_ERROR',
        },
        { status: 400 }
      );
    }
  }

  const totalAmount = rentPayments.reduce((sum, p) => {
    const amt = Number(p.amount);
    return sum + (Number.isNaN(amt) ? 0 : amt);
  }, 0);

  if (!totalAmount || totalAmount <= 0) {
    return NextResponse.json({ message: 'Invalid total amount' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const rentAmountInCents = Math.round(totalAmount * 100);

  // Create Payment Intent - DIRECT TO LANDLORD
  // Uses Stripe Connect destination charges
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: rentAmountInCents,
    currency: 'usd',
    // DIRECT PAYMENT: Money goes to landlord's Connect account
    transfer_data: {
      destination: landlord.stripeConnectAccountId,
    },
    // No application_fee_amount - subscription model, no per-transaction fees
    metadata: {
      type: 'rent_payment',
      tenantId: session.user.id as string,
      rentPaymentIds: rentPayments.map((p) => p.id).join(','),
      landlordId: landlord.id,
      rentAmount: rentAmountInCents.toString(),
    },
    payment_method_types: ['card', 'link', 'us_bank_account'],
    receipt_email: session.user.email || undefined,
    payment_method_options: {
      us_bank_account: {
        verification_method: 'automatic',
      },
    },
  };

  try {
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    await prisma.rentPayment.updateMany({
      where: { id: { in: rentPayments.map((p) => p.id) } },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      rentAmount: totalAmount,
      totalAmount: totalAmount, // Same as rent - no fees
      platformFee: 0,
      message: 'Payment goes directly to your landlord. No platform fees.',
    });
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    const stripeError = error as { message?: string; code?: string };
    
    // Handle specific Connect errors
    if (stripeError.code === 'account_invalid') {
      return NextResponse.json({ 
        message: 'Your landlord\'s payment account needs attention. Please contact them.',
        code: 'LANDLORD_ACCOUNT_INVALID'
      }, { status: 400 });
    }
    
    const message = stripeError.message || 'Payment initialization failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
