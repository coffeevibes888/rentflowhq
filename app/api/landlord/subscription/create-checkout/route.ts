import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { SUBSCRIPTION_TIERS, SubscriptionTier, BillingInterval, getPriceIdForInterval } from '@/lib/config/subscription-tiers';
import { SERVER_URL } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetTier = body.tier as SubscriptionTier;
    const billingInterval: BillingInterval = body.billingInterval === 'yearly' ? 'yearly' : 'monthly';
    const referralCode = body.referralCode as string | undefined;

    if (!targetTier || !SUBSCRIPTION_TIERS[targetTier]) {
      return NextResponse.json({ success: false, message: 'Invalid subscription tier' }, { status: 400 });
    }

    const tierConfig = SUBSCRIPTION_TIERS[targetTier];
    const priceId = getPriceIdForInterval(targetTier, billingInterval);

    const tierToPriceEnvVar: Record<SubscriptionTier, Record<BillingInterval, string>> = {
      starter: { monthly: 'STRIPE_PRICE_STARTER', yearly: 'STRIPE_PRICE_STARTER_YEARLY' },
      pro: { monthly: 'STRIPE_PRICE_PRO', yearly: 'STRIPE_PRICE_PRO_YEARLY' },
      enterprise: { monthly: 'STRIPE_PRICE_ENTERPRISE', yearly: 'STRIPE_PRICE_ENTERPRISE_YEARLY' },
    };
    const expectedPriceEnvVar = tierToPriceEnvVar[targetTier][billingInterval];

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured on the server (missing STRIPE_SECRET_KEY).' },
        { status: 500 }
      );
    }

    if (!priceId) {
      if (targetTier === 'enterprise') {
        return NextResponse.json({ 
          success: false, 
          message: 'Enterprise tier requires custom pricing. Please contact us.',
          contactRequired: true,
        }, { status: 400 });
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

    const landlordResult = await getOrCreateCurrentLandlord();

    if (!landlordResult.success) {
      return NextResponse.json({ success: false, message: 'Unable to determine landlord' }, { status: 400 });
    }

    const landlord = landlordResult.landlord;
    if (session.user.role !== 'superAdmin' && landlord.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Only the account owner can manage billing and upgrades.' },
        { status: 403 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    try {
      await stripe.prices.retrieve(priceId);
    } catch (error) {
      const stripeMessage =
        error && typeof error === 'object' && 'message' in error ? String((error as any).message) : 'Unknown Stripe error';
      const stripeMode = stripeSecretKey.startsWith('sk_live_')
        ? 'live'
        : stripeSecretKey.startsWith('sk_test_')
          ? 'test'
          : 'unknown';
      return NextResponse.json(
        {
          success: false,
          message:
            `This plan is not purchasable right now. Stripe could not find the configured price for this tier. Check ${expectedPriceEnvVar} / environment mode (test vs live).`,
          details: stripeMessage,
          configuredPriceId: priceId,
          tier: targetTier,
          billingInterval,
          expectedPriceEnvVar,
          stripeMode,
        },
        { status: 500 }
      );
    }

    let customerId = landlord.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: landlord.name,
        metadata: {
          landlordId: landlord.id,
        },
      });
      customerId = customer.id;

      await prisma.landlord.update({
        where: { id: landlord.id },
        data: { stripeCustomerId: customerId },
      });
    }

    let baseUrl = SERVER_URL;
    try {
      baseUrl = new URL(SERVER_URL).origin;
    } catch {}

    // Capture Meta attribution cookies + request metadata so the Stripe webhook
    // can fire a deduplicated server-side Purchase event to the Meta Conversions API.
    const metaFbc = req.cookies.get('_fbc')?.value || '';
    const metaFbp = req.cookies.get('_fbp')?.value || '';
    const metaIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '';
    const metaUa = req.headers.get('user-agent') || '';
    const metaEventId = `purchase_${landlord.id}_${Date.now()}`;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_collection: 'always',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/admin/overview?subscription=success&tier=${targetTier}`,
      cancel_url: `${baseUrl}/onboarding/landlord/subscription?canceled=true`,
      metadata: {
        landlordId: landlord.id,
        tier: targetTier,
        billingInterval,
        ...(referralCode && { affiliateCode: referralCode }),
      },
      subscription_data: {
        trial_period_days: tierConfig.trialDays, // 14-day free trial
        metadata: {
          landlordId: landlord.id,
          tier: targetTier,
          billingInterval,
          ...(referralCode && { affiliateCode: referralCode }),
          // Meta CAPI attribution — read back in the Stripe webhook
          metaFbc,
          metaFbp,
          metaIp,
          metaUa,
          metaEventId,
          metaUserEmail: session.user.email || '',
          metaUserId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
    });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create checkout session' }, { status: 500 });
  }
}
