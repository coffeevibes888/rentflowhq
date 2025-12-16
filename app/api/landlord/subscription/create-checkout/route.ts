import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/config/subscription-tiers';

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

    if (!tierConfig.priceId) {
      if (targetTier === 'enterprise') {
        return NextResponse.json({ 
          success: false, 
          message: 'Enterprise tier requires custom pricing. Please contact us.',
          contactRequired: true,
        }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: 'This tier is not available for purchase' }, { status: 400 });
    }

    const landlordResult = await getOrCreateCurrentLandlord();

    if (!landlordResult.success) {
      return NextResponse.json({ success: false, message: 'Unable to determine landlord' }, { status: 400 });
    }

    const landlord = landlordResult.landlord;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/admin/settings?subscription=success&tier=${targetTier}`,
      cancel_url: `${baseUrl}/admin/settings?subscription=canceled`,
      metadata: {
        landlordId: landlord.id,
        tier: targetTier,
      },
      subscription_data: {
        metadata: {
          landlordId: landlord.id,
          tier: targetTier,
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
