/**
 * Redis Cache Layer
 * Reduces database queries and expensive computations
 */

import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export class RedisCache {
  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;

    try {
      const value = await redis.get(key);
      return value as T | null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!redis) return;

    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * Delete cached value
   */
  static async del(key: string): Promise<void> {
    if (!redis) return;

    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  /**
   * Get or compute value
   */
  static async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await computeFn();
    
    // Cache result
    await this.set(key, value, ttlSeconds);
    
    return value;
  }

  /**
   * Invalidate pattern
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    if (!redis) return;

    try {
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis invalidate pattern error:', error);
    }
  }

  /**
   * Cache contractor usage data
   */
  static async cacheContractorUsage(contractorId: string, usage: any): Promise<void> {
    await this.set(`contractor:usage:${contractorId}`, usage, 300); // 5 min TTL
  }

  /**
   * Get cached contractor usage
   */
  static async getContractorUsage(contractorId: string): Promise<any | null> {
    return this.get(`contractor:usage:${contractorId}`);
  }

  /**
   * Cache Stripe account data
   */
  static async cacheStripeAccount(accountId: string, data: any): Promise<void> {
    await this.set(`stripe:account:${accountId}`, data, 1800); // 30 min TTL
  }

  /**
   * Get cached Stripe account
   */
  static async getStripeAccount(accountId: string): Promise<any | null> {
    return this.get(`stripe:account:${accountId}`);
  }

  /**
   * Cache daily check status
   */
  static async markDailyCheckComplete(contractorId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.set(`daily-check:${contractorId}:${today}`, true, 86400); // 24 hours
  }

  /**
   * Check if daily check completed
   */
  static async isDailyCheckComplete(contractorId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.get<boolean>(`daily-check:${contractorId}:${today}`);
    return result === true;
  }
}
