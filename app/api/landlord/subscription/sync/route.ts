import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/config/subscription-tiers';

// Manually sync subscription from Stripe (useful when webhooks aren't working)
export async function POST(req: NextRequest) {
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
      return NextResponse.json({ success: false, message: 'Stripe is not configured on the server (missing STRIPE_SECRET_KEY).' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

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

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription, set to free
      await prisma.landlord.update({
        where: { id: landlord.id },
        data: {
          subscriptionTier: 'free',
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'No subscription found for this Stripe customer. Set to free tier.',
        tier: 'free',
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price?.id;

    // Determine tier from price ID
    let tier: SubscriptionTier = 'free';
    if (priceId === process.env.STRIPE_PRICE_PRO) {
      tier = 'pro';
    } else {
      // Check metadata for tier, default to pro for any paid subscription
      const metaTier = subscription.metadata?.tier as SubscriptionTier;
      tier = metaTier && ['free', 'pro', 'enterprise'].includes(metaTier) ? metaTier : 'pro';
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier];

    // Update landlord subscription
    await prisma.landlordSubscription.upsert({
      where: { landlordId: landlord.id },
      create: {
        landlordId: landlord.id,
        tier,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        unitLimit: tierConfig.unitLimit === Infinity ? 999999 : tierConfig.unitLimit,
        freeBackgroundChecks: tierConfig.features.freeBackgroundChecks,
        freeEvictionChecks: tierConfig.features.freeEvictionChecks,
        freeEmploymentVerification: tierConfig.features.freeEmploymentVerification,
      },
      update: {
        tier,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        unitLimit: tierConfig.unitLimit === Infinity ? 999999 : tierConfig.unitLimit,
        freeBackgroundChecks: tierConfig.features.freeBackgroundChecks,
        freeEvictionChecks: tierConfig.features.freeEvictionChecks,
        freeEmploymentVerification: tierConfig.features.freeEmploymentVerification,
      },
    });

    // Update landlord record
    await prisma.landlord.update({
      where: { id: landlord.id },
      data: {
        subscriptionTier: tier,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        freeBackgroundChecks: tierConfig.features.freeBackgroundChecks,
        freeEmploymentVerification: tierConfig.features.freeEmploymentVerification,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Subscription synced! You are now on the ${tierConfig.name} plan.`,
      tier,
      tierConfig,
    });
  } catch (error) {
    console.error('Subscription sync error:', error);
    return NextResponse.json({ success: false, message: 'Failed to sync subscription' }, { status: 500 });
  }
}
