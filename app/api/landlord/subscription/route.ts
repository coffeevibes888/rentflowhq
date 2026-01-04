import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { SUBSCRIPTION_TIERS, isNearUnitLimit, isAtUnitLimit, getUpgradeTier } from '@/lib/config/subscription-tiers';

export async function GET() {
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

    const unitCount = await prisma.unit.count({
      where: {
        property: {
          landlordId: landlord.id,
        },
      },
    });

    const subscription = await prisma.landlordSubscription.findUnique({
      where: { landlordId: landlord.id },
    });

    // Normalize legacy tier names (growth, professional) to new structure
    const rawTier = subscription?.tier || landlord.subscriptionTier || 'starter';
    const currentTier = rawTier === 'growth' || rawTier === 'professional' ? 'pro' : rawTier === 'free' ? 'starter' : rawTier;
    const tierConfig = SUBSCRIPTION_TIERS[currentTier as keyof typeof SUBSCRIPTION_TIERS];

    if (!tierConfig) {
      // Fallback to starter if tier is invalid
      const fallbackConfig = SUBSCRIPTION_TIERS.starter;
      return NextResponse.json({
        success: true,
        subscription: {
          tier: 'starter',
          tierName: fallbackConfig.name,
          status: subscription?.status || 'active',
          unitLimit: fallbackConfig.unitLimit,
          currentUnitCount: unitCount,
          unitsRemaining: Math.max(0, fallbackConfig.unitLimit - unitCount),
          nearLimit: false,
          atLimit: false,
          upgradeTier: 'pro',
          upgradeTierConfig: SUBSCRIPTION_TIERS.pro,
          features: fallbackConfig.features,
          currentPeriodEnd: subscription?.currentPeriodEnd,
          cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
        },
      });
    }

    const nearLimit = isNearUnitLimit(unitCount, currentTier as keyof typeof SUBSCRIPTION_TIERS);
    const atLimit = isAtUnitLimit(unitCount, currentTier as keyof typeof SUBSCRIPTION_TIERS);
    const upgradeTier = getUpgradeTier(currentTier as keyof typeof SUBSCRIPTION_TIERS);

    return NextResponse.json({
      success: true,
      subscription: {
        tier: currentTier,
        tierName: tierConfig.name,
        status: subscription?.status || 'active',
        unitLimit: tierConfig.unitLimit,
        currentUnitCount: unitCount,
        unitsRemaining: Math.max(0, tierConfig.unitLimit - unitCount),
        nearLimit,
        atLimit,
        upgradeTier,
        upgradeTierConfig: upgradeTier ? SUBSCRIPTION_TIERS[upgradeTier] : null,
        features: tierConfig.features,
        currentPeriodEnd: subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ success: false, message: 'Failed to get subscription status' }, { status: 500 });
  }
}
