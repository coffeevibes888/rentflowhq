import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { syncLandlordSubscriptionFromStripe } from '@/lib/actions/subscription-sync';
import { SUBSCRIPTION_TIERS } from '@/lib/config/subscription-tiers';

// Manually sync subscription from Stripe (useful when webhooks aren't working)
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const landlordResult = await getOrCreateCurrentLandlord();

    if (!landlordResult.success) {
      return NextResponse.json({ success: false, message: 'Unable to determine landlord' }, { status: 400 });
    }

    const landlord = landlordResult.landlord;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured on the server (missing STRIPE_SECRET_KEY).' },
        { status: 500 }
      );
    }

    // Make sure the landlord has a Stripe customer before attempting to sync.
    // If they don't, create one so the sync action can find subscriptions.
    if (!landlord.stripeCustomerId) {
      const stripe = new Stripe(stripeSecretKey);
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: landlord.name,
        metadata: { landlordId: landlord.id },
      });
      await prisma.landlord.update({
        where: { id: landlord.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    const result = await syncLandlordSubscriptionFromStripe(landlord.id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 });
    }

    const tier = result.tier === 'free' ? 'starter' : result.tier;
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    return NextResponse.json({
      success: true,
      message: `Subscription synced! You are now on the ${tierConfig.name} plan.`,
      tier: result.tier,
      tierConfig,
    });
  } catch (error) {
    console.error('Subscription sync error:', error);
    return NextResponse.json({ success: false, message: 'Failed to sync subscription' }, { status: 500 });
  }
}
