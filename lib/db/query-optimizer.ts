/**
 * Database Query Optimizer
 * Provides optimized query patterns and caching
 */

import { prisma } from '@/db/prisma';
import { RedisCache } from '@/lib/cache/redis-cache';

export class QueryOptimizer {
  /**
   * Get contractor profile with caching
   */
  static async getContractorProfile(contractorId: string) {
    return RedisCache.getOrCompute(
      `contractor:profile:${contractorId}`,
      async () => {
        return prisma.contractorProfile.findUnique({
          where: { id: contractorId },
          select: {
            id: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            currentPeriodEnd: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      },
      600 // 10 min TTL
    );
  }

  /**
   * Batch get multiple contractor profiles
   */
  static async getContractorProfiles(contractorIds: string[]) {
    return prisma.contractorProfile.findMany({
      where: { id: { in: contractorIds } },
      select: {
        id: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get Stripe account with caching
   */
  static async getStripeAccount(accountId: string) {
    return RedisCache.getStripeAccount(accountId);
  }

  /**
   * Invalidate contractor cache
   */
  static async invalidateContractorCache(contractorId: string) {
    await RedisCache.invalidatePattern(`contractor:*:${contractorId}*`);
  }

  /**
   * Batch create notifications (reduces DB round trips)
   */
  static async batchCreateNotifications(notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type: string;
    metadata?: any;
  }>) {
    return prisma.notification.createMany({
      data: notifications.map(n => ({
        ...n,
        read: false,
        createdAt: new Date(),
      })),
    });
  }
}
