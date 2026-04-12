import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/config/subscription-tiers';
import { SERVER_URL } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetTier = body.tier as SubscriptionTier;

    if (!targetTier || !SUBSCRIPTION_TIERS[targetTier]) {
      return NextResponse.json({ success: false, message: 'Invalid subscription tier' }, { status: 400 });
    }

    const tierConfig = SUBSCRIPTION_TIERS[targetTier];

    const tierToPriceEnvVar: Record<SubscriptionTier, string> = {
      starter: 'STRIPE_PRICE_CONTRACTOR_STARTER',
      pro: 'STRIPE_PRICE_CONTRACTOR_PRO',
      enterprise: 'STRIPE_PRICE_CONTRACTOR_ENTERPRISE',
    };
    const expectedPriceEnvVar = tierToPriceEnvVar[targetTier];

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured on the server.' },
        { status: 500 }
      );
    }

    // Look up contractor-specific price IDs, falling back to the shared PM price IDs
    const contractorPriceId =
      process.env[expectedPriceEnvVar] || tierConfig.priceId;

    if (!contractorPriceId) {
      if (targetTier === 'enterprise') {
        return NextResponse.json(
          { success: false, message: 'Enterprise tier requires custom pricing. Please contact us.', contactRequired: true },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          message: `This tier is not available for purchase. Stripe price is not configured (missing ${expectedPriceEnvVar}).`,
          missingEnvVar: expectedPriceEnvVar,
        },
        { status: 400 }
      );
    }

    const profile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, stripeCustomerId: true, businessName: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Contractor profile not found. Please complete onboarding first.' },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Validate price exists in Stripe
    try {
      await stripe.prices.retrieve(contractorPriceId);
    } catch (error) {
      const stripeMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as any).message)
          : 'Unknown Stripe error';
      return NextResponse.json(
        {
          success: false,
          message: `Stripe could not find the price for this tier. Check ${expectedPriceEnvVar}.`,
          details: stripeMessage,
        },
        { status: 500 }
      );
    }

    let customerId = profile.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: profile.businessName,
        metadata: { contractorProfileId: profile.id, userId: session.user.id },
      });
      customerId = customer.id;

      await prisma.contractorProfile.update({
        where: { id: profile.id },
        data: { stripeCustomerId: customerId },
      });
    }

    let baseUrl = SERVER_URL;
    try {
      baseUrl = new URL(SERVER_URL).origin;
    } catch {}

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: contractorPriceId, quantity: 1 }],
      success_url: `${baseUrl}/contractor/dashboard?subscription=success&tier=${targetTier}`,
      cancel_url: `${baseUrl}/onboarding/contractor/subscription?canceled=true`,
      metadata: {
        contractorProfileId: profile.id,
        tier: targetTier,
        role: 'contractor',
      },
      subscription_data: {
        trial_period_days: tierConfig.trialDays,
        metadata: {
          contractorProfileId: profile.id,
          tier: targetTier,
          role: 'contractor',
        },
      },
    });

    return NextResponse.json({ success: true, checkoutUrl: checkoutSession.url });
  } catch (error) {
    console.error('Contractor subscription checkout error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
