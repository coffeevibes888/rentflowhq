/**
 * Optimized Contractor Daily Check Service
 * 
 * Uses Redis cache instead of in-memory cache for distributed systems.
 * Queues emails instead of sending synchronously.
 * 
 * TRIGGER: On any contractor API request
 * FREQUENCY: Once per day per contractor
 * EXECUTION: Async, non-blocking
 */

import { prisma } from '@/db/prisma';
import { getCurrentUsage } from './contractor-usage-tracker';
import { 
  createLimitWarningNotification, 
  createLimitReachedNotification,
  getFeatureDisplayName 
} from './contractor-notification-service';
import { EmailQueue } from '@/lib/queue/email-queue';
import { RedisCache } from '@/lib/cache/redis-cache';
import { CONTRACTOR_TIERS } from '@/lib/config/contractor-subscription-tiers';
import ContractorLimitWarningEmail from '@/email/templates/contractor-limit-warning';
import ContractorLimitReachedEmail from '@/email/templates/contractor-limit-reached';

// ============= Types =============

interface DailyCheckResult {
  checked: boolean;
  notificationsSent: number;
  errors: string[];
}

// ============= Main Function =============

/**
 * Perform daily check if needed (once per day)
 * OPTIMIZED: Uses Redis cache and queues emails
 */
export async function performDailyCheckIfNeeded(contractorId: string): Promise<DailyCheckResult> {
  const result: DailyCheckResult = {
    checked: false,
    notificationsSent: 0,
    errors: [],
  };

  try {
    // Check if already ran today (Redis cache)
    const alreadyChecked = await RedisCache.isDailyCheckComplete(contractorId);
    if (alreadyChecked) {
      return result;
    }

    // Get contractor profile
    const profile = await prisma.contractorProfile.findUnique({
      where: { id: contractorId },
      select: {
        id: true,
        subscriptionTier: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!profile) {
      result.errors.push('Contractor profile not found');
      return result;
    }

    // Get current usage (with caching)
    const usage = await RedisCache.getOrCompute(
      `contractor:usage:${contractorId}`,
      () => getCurrentUsage(contractorId),
      300 // 5 min TTL
    );

    const tier = profile.subscriptionTier as keyof typeof CONTRACTOR_TIERS;
    const tierConfig = CONTRACTOR_TIERS[tier];

    // Check each feature
    const features = [
      { key: 'activeJobs', current: usage.activeJobsCount, limit: tierConfig.limits.activeJobs },
      { key: 'invoicesThisMonth', current: usage.invoicesThisMonth, limit: tierConfig.limits.invoicesPerMonth },
      { key: 'totalCustomers', current: usage.totalCustomers, limit: tierConfig.limits.customers },
      { key: 'teamMembers', current: usage.teamMembersCount, limit: tierConfig.limits.teamMembers },
    ];

    for (const feature of features) {
      if (feature.limit === -1) continue; // Unlimited

      const percentage = (feature.current / feature.limit) * 100;

      // Send notifications at 80%, 90%, 95%, 100%
      if (percentage >= 80) {
        try {
          const featureDisplayName = getFeatureDisplayName(feature.key);
          
          // Create in-app notification
          if (percentage >= 100) {
            await createLimitReachedNotification(
              contractorId,
              feature.key,
              featureDisplayName,
              feature.limit
            );
          } else {
            await createLimitWarningNotification(
              contractorId,
              feature.key,
              featureDisplayName,
              feature.current,
              feature.limit,
              Math.round(percentage)
            );
          }

          // Queue email (async)
          const upgradeUrl = `${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/contractor/settings/subscription`;
          
          if (percentage >= 100) {
            await EmailQueue.send({
              to: profile.user.email!,
              subject: `${featureDisplayName} Limit Reached`,
              react: ContractorLimitReachedEmail({
                contractorName: profile.user.name || 'Contractor',
                feature: feature.key,
                featureDisplayName,
                limit: feature.limit,
                currentTier: tier,
                nextTier: tier === 'starter' ? 'pro' : 'enterprise',
                nextTierLimit: tier === 'starter' ? 50 : 'Unlimited',
                nextTierPrice: tier === 'starter' ? 49 : 149,
                upgradeUrl,
              }),
              priority: 8,
            });
          } else {
            await EmailQueue.send({
              to: profile.user.email!,
              subject: `Approaching ${featureDisplayName} Limit (${Math.round(percentage)}%)`,
              react: ContractorLimitWarningEmail({
                contractorName: profile.user.name || 'Contractor',
                feature: feature.key,
                featureDisplayName,
                currentUsage: feature.current,
                limit: feature.limit,
                percentage: Math.round(percentage),
                currentTier: tier,
                nextTier: tier === 'starter' ? 'pro' : 'enterprise',
                nextTierLimit: tier === 'starter' ? 50 : 'Unlimited',
                upgradeUrl,
              }),
              priority: 7,
            });
          }

          result.notificationsSent++;
        } catch (error: any) {
          result.errors.push(`Failed to send notification for ${feature.key}: ${error.message}`);
        }
      }
    }

    // Mark as checked in Redis
    await RedisCache.markDailyCheckComplete(contractorId);
    result.checked = true;

    return result;
  } catch (error: any) {
    result.errors.push(`Daily check failed: ${error.message}`);
    return result;
  }
}
