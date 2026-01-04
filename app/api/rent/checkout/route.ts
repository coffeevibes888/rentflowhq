import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import Stripe from 'stripe';
import { getTenantPaymentTransparency, compareTenantPaymentMethods } from '@/lib/utils/stripe-transparency';
import { getConvenienceFeeInCents } from '@/lib/config/platform-fees';

/**
 * Rent checkout API - PLATFORM-HELD FUNDS MODEL
 * 
 * All payments go directly to YOUR platform Stripe account.
 * No Connect accounts needed - landlords just add their bank/card for payouts.
 * 
 * TRANSPARENCY: Tenants see exact breakdown of:
 * - Rent amount
 * - Platform convenience fee
 * - Stripe processing fees
 * - Total to pay
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

  // Get convenience fee - using 'card' as default (max fee)
  // Actual fee will be adjusted on client based on selected payment method
  const convenienceFee = getConvenienceFeeInCents('card');
  const rentAmountInCents = Math.round(totalAmount * 100);
  const totalWithFee = rentAmountInCents + convenienceFee;

  // Create Payment Intent - PLATFORM-HELD MODEL
  // Payment goes directly to YOUR Stripe account (no on_behalf_of or transfer_data)
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: totalWithFee,
    currency: 'usd',
    metadata: {
      type: 'rent_payment',
      tenantId: session.user.id as string,
      rentPaymentIds: rentPayments.map((p) => p.id).join(','),
      landlordId,
      rentAmount: rentAmountInCents.toString(),
      convenienceFee: convenienceFee.toString(),
      maxConvenienceFee: getConvenienceFeeInCents('card').toString(),
    },
    // Payment methods enabled on YOUR platform account
    payment_method_types: ['card', 'link', 'us_bank_account', 'cashapp'],
    // ACH requires customer email for mandate
    receipt_email: session.user.email || undefined,
    payment_method_options: {
      us_bank_account: {
        verification_method: 'automatic',
      },
    },
    // NOTE: No on_behalf_of or transfer_data - payment goes to YOUR account
    // Landlord receives funds via payout from your platform wallet
  };

  try {
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    await prisma.rentPayment.updateMany({
      where: { id: { in: rentPayments.map((p) => p.id) } },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    // Get transparency info - use 'CARD' as the default shown method
    const transparency = getTenantPaymentTransparency(totalAmount, 'CARD');
    const comparisons = compareTenantPaymentMethods(totalAmount);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      
      // TRANSPARENCY: What tenant will pay
      convenienceFee: convenienceFee / 100, // Return as dollars
      rentAmount: totalAmount,
      totalAmount: totalWithFee / 100,
      
      // TRANSPARENCY: Detailed breakdown
      transparency: {
        rentAmount: transparency.rentAmount,
        platformFee: transparency.platformFee,
        stripeFee: transparency.stripeFee,
        totalFees: transparency.totalFees,
        totalToPay: transparency.totalToPay,
        breakdown: transparency.breakdown,
        paymentMethod: transparency.paymentMethod,
        timeline: transparency.timeline,
        processingTime: transparency.processingTime,
      },
      
      // TRANSPARENCY: Compare all payment methods
      paymentMethodComparisons: comparisons.map(m => ({
        name: m.name,
        type: m.type,
        fee: m.fee,
        total: m.total,
        savings: m.savings,
        timeline: m.timeline,
        description: m.description,
        recommended: m.recommended,
      })),
    });
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    const message = error instanceof Error ? error.message : 'Payment initialization failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
