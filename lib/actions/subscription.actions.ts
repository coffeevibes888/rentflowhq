'use server';

import { prisma } from '@/db/prisma';
import { SUBSCRIPTION_TIERS, SubscriptionTier, isNearUnitLimit, isAtUnitLimit, getUpgradeTier } from '@/lib/config/subscription-tiers';

export async function checkLandlordUnitLimits(landlordId: string) {
  const landlord = await prisma.landlord.findUnique({
    where: { id: landlordId },
    include: {
      subscription: true,
      properties: {
        include: {
          units: true,
        },
      },
      owner: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!landlord) {
    return { success: false, message: 'Landlord not found' };
  }

  const unitCount = landlord.properties.reduce((sum, p) => sum + p.units.length, 0);
  const currentTier = (landlord.subscription?.tier || landlord.subscriptionTier || 'free') as SubscriptionTier;
  const tierConfig = SUBSCRIPTION_TIERS[currentTier];

  const nearLimit = isNearUnitLimit(unitCount, currentTier);
  const atLimit = isAtUnitLimit(unitCount, currentTier);
  const upgradeTier = getUpgradeTier(currentTier);

  return {
    success: true,
    landlordId,
    landlordName: landlord.name,
    ownerEmail: landlord.owner?.email,
    ownerName: landlord.owner?.name,
    currentTier,
    tierConfig,
    unitCount,
    unitLimit: tierConfig.unitLimit,
    nearLimit,
    atLimit,
    upgradeTier,
    upgradeTierConfig: upgradeTier ? SUBSCRIPTION_TIERS[upgradeTier] : null,
    lastNotifiedAt: landlord.unitLimitNotifiedAt,
  };
}

export async function checkAndNotifyAllLandlords() {
  const landlords = await prisma.landlord.findMany({
    include: {
      subscription: true,
      properties: {
        include: {
          units: true,
        },
      },
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  const results = [];

  for (const landlord of landlords) {
    const unitCount = landlord.properties.reduce((sum, p) => sum + p.units.length, 0);
    const currentTier = (landlord.subscription?.tier || landlord.subscriptionTier || 'free') as SubscriptionTier;
    
    const nearLimit = isNearUnitLimit(unitCount, currentTier);
    const atLimit = isAtUnitLimit(unitCount, currentTier);

    if ((nearLimit || atLimit) && landlord.owner?.id) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const shouldNotify = !landlord.unitLimitNotifiedAt || landlord.unitLimitNotifiedAt < oneDayAgo;

      if (shouldNotify) {
        const upgradeTier = getUpgradeTier(currentTier);
        const tierConfig = SUBSCRIPTION_TIERS[currentTier];
        const upgradeConfig = upgradeTier ? SUBSCRIPTION_TIERS[upgradeTier] : null;

        const notificationTitle = atLimit 
          ? 'Unit Limit Reached' 
          : 'Approaching Unit Limit';
        
        const notificationMessage = atLimit
          ? `You've reached your ${tierConfig.unitLimit} unit limit on the ${tierConfig.name} plan. Upgrade to ${upgradeConfig?.name || 'a higher plan'} to add more units.`
          : `You're using ${unitCount} of ${tierConfig.unitLimit} units on the ${tierConfig.name} plan. Consider upgrading to ${upgradeConfig?.name || 'a higher plan'} for more capacity.`;

        await prisma.notification.create({
          data: {
            userId: landlord.owner.id,
            type: 'subscription',
            title: notificationTitle,
            message: notificationMessage,
            actionUrl: '/admin/settings?tab=subscription',
            metadata: {
              landlordId: landlord.id,
              currentTier,
              unitCount,
              unitLimit: tierConfig.unitLimit,
              upgradeTier,
            },
          },
        });

        await prisma.landlord.update({
          where: { id: landlord.id },
          data: { unitLimitNotifiedAt: new Date() },
        });

        results.push({
          landlordId: landlord.id,
          landlordName: landlord.name,
          notified: true,
          type: atLimit ? 'at_limit' : 'near_limit',
        });
      }
    }
  }

  return results;
}

export async function canLandlordAddUnit(landlordId: string): Promise<{ allowed: boolean; reason?: string; upgradeTier?: string }> {
  const result = await checkLandlordUnitLimits(landlordId);

  if (!result.success) {
    return { allowed: false, reason: 'Unable to verify subscription status' };
  }

  if (result.atLimit) {
    return {
      allowed: false,
      reason: `You've reached your ${result.unitLimit} unit limit on the ${result.tierConfig.name} plan. Please upgrade to add more units.`,
      upgradeTier: result.upgradeTier || undefined,
    };
  }

  return { allowed: true };
}

export async function getLandlordSubscriptionPerks(landlordId: string) {
  const landlord = await prisma.landlord.findUnique({
    where: { id: landlordId },
    include: { subscription: true },
  });

  if (!landlord) {
    return {
      freeBackgroundChecks: false,
      freeEvictionChecks: false,
      freeEmploymentVerification: false,
    };
  }

  const currentTier = (landlord.subscription?.tier || landlord.subscriptionTier || 'free') as SubscriptionTier;
  const tierConfig = SUBSCRIPTION_TIERS[currentTier];

  return {
    tier: currentTier,
    freeBackgroundChecks: landlord.subscription?.freeBackgroundChecks || tierConfig.features.freeBackgroundChecks,
    freeEvictionChecks: landlord.subscription?.freeEvictionChecks || tierConfig.features.freeEvictionChecks,
    freeEmploymentVerification: landlord.subscription?.freeEmploymentVerification || tierConfig.features.freeEmploymentVerification,
  };
}
