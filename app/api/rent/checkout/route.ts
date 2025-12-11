import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import Stripe from 'stripe';
import { getLandlordBySubdomain } from '@/lib/actions/landlord.actions';
import { getConvenienceFeeInCents } from '@/lib/config/platform-fees';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const host = req.headers.get('host') || '';
  const apex = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';

  const bareHost = host.split(':')[0].toLowerCase();
  const apexLower = apex.toLowerCase();

  let landlordId: string | null = null;

  if (apexLower && bareHost.endsWith(`.${apexLower}`) && bareHost !== apexLower) {
    const subdomain = bareHost.slice(0, bareHost.length - apexLower.length - 1);

    if (subdomain) {
      const landlordResult = await getLandlordBySubdomain(subdomain);

      if (!landlordResult.success) {
        return NextResponse.json(
          { message: landlordResult.message || 'Landlord not found for this subdomain.' },
          { status: 404 }
        );
      }

      landlordId = landlordResult.landlord.id;
    }
  }

  if (!landlordId) {
    return NextResponse.json(
      { message: 'Missing or invalid landlord context for this request.' },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null) as
    | { rentPaymentIds?: string[]; paymentMethodType?: 'ach' | 'card' }
    | null;

  if (!body?.rentPaymentIds || !Array.isArray(body.rentPaymentIds) || body.rentPaymentIds.length === 0) {
    return NextResponse.json({ message: 'No rent payments specified' }, { status: 400 });
  }

  const rentPayments = await prisma.rentPayment.findMany({
    where: {
      id: { in: body.rentPaymentIds },
      tenantId: session.user.id as string,
      status: 'pending',
      lease: {
        unit: {
          property: {
            landlordId,
          },
        },
      },
    },
  });

  if (rentPayments.length === 0) {
    return NextResponse.json({ message: 'No pending rent payments found' }, { status: 400 });
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
    // Enable multiple payment methods including wallets
    payment_method_types: ['card', 'us_bank_account', 'link'],
    // Enable automatic payment methods (Apple Pay, Google Pay, etc.)
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never', // Keep everything in-page
    },
    // ACH requires customer email for mandate
    receipt_email: session.user.email || undefined,
    // Enable setup for future recurring payments
    setup_future_usage: 'off_session', // Allows saving payment method for recurring
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
}
