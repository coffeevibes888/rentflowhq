/**
 * Subscription Tiers Configuration
 * 
 * PRICING MODEL:
 * - Starter: $19.99/month or $191.90/year (20% discount)
 * - Pro: $39.99/month or $383.90/year (20% discount)
 * - Enterprise: $79.99/month or $767.90/year (20% discount)
 * 
 * All tiers include 14-day free trial
 * No transaction fees - subscription only revenue model
 */

import { stripeConfig } from '../stripe-config';

export type BillingInterval = 'monthly' | 'yearly';

/** Yearly discount percentage */
export const YEARLY_DISCOUNT_PERCENT = 20;

/** Calculate yearly price with 20% discount (price per year) */
export function getYearlyPrice(monthlyPrice: number): number {
  const yearlyFull = monthlyPrice * 12;
  const discounted = yearlyFull * (1 - YEARLY_DISCOUNT_PERCENT / 100);
  return Math.round(discounted * 100) / 100; // round to 2 decimals
}

/** Calculate equivalent monthly price when billed yearly */
export function getYearlyMonthlyEquivalent(monthlyPrice: number): number {
  return Math.round((getYearlyPrice(monthlyPrice) / 12) * 100) / 100;
}

export const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'Starter',
    price: 19.99,
    yearlyPrice: getYearlyPrice(19.99), // $191.90/year
    priceId: stripeConfig.prices.starter,
    yearlyPriceId: stripeConfig.prices.starterYearly,
    unitLimit: 24,
    trialDays: 14,
    features: {
      automaticRentReminders: false,
      automaticLateFees: false,
      employmentChecksPerMonth: 0,
      teamManagement: false,
      teamCommunications: false,
      freeBackgroundChecks: false,
      freeEvictionChecks: false,
      freeEmploymentVerification: false,
      customBranding: false,
      apiAccess: false,
      webhooks: false,
      advancedAnalytics: false,
      quickbooksIntegration: false,
      turbotaxIntegration: false,
      contractorManagement: true,
      idPaystubScanner: true, // Available on all plans
      prioritySupport: false,
      // Enterprise-only features
      shiftScheduling: false,
      timeTracking: false,
      teamPayroll: false,
      performanceReports: false,
      unlimitedTeamMembers: false,
    },
    description: 'Perfect for small landlords with up to 24 units',
  },
  pro: {
    name: 'Pro',
    price: 39.99,
    yearlyPrice: getYearlyPrice(39.99), // $383.90/year
    priceId: stripeConfig.prices.pro,
    yearlyPriceId: stripeConfig.prices.proYearly,
    unitLimit: 150,
    trialDays: 14,
    features: {
      automaticRentReminders: true,
      automaticLateFees: true,
      employmentChecksPerMonth: Infinity,
      teamManagement: true,
      teamCommunications: true,
      freeBackgroundChecks: true,
      freeEvictionChecks: true,
      freeEmploymentVerification: true,
      customBranding: false,
      apiAccess: false,
      webhooks: false,
      advancedAnalytics: true,
      quickbooksIntegration: true,
      turbotaxIntegration: true,
      contractorManagement: true,
      idPaystubScanner: true, // Available on all plans
      prioritySupport: true,
      // Enterprise-only features (disabled for Pro)
      shiftScheduling: false,
      timeTracking: false,
      teamPayroll: false,
      performanceReports: false,
      unlimitedTeamMembers: false,
    },
    description: 'Everything you need for growing portfolios up to 150 units',
  },
  enterprise: {
    name: 'Enterprise',
    price: 79.99,
    yearlyPrice: getYearlyPrice(79.99), // $767.90/year
    priceId: stripeConfig.prices.enterprise,
    yearlyPriceId: stripeConfig.prices.enterpriseYearly,
    unitLimit: Infinity,
    trialDays: 14,
    features: {
      automaticRentReminders: true,
      automaticLateFees: true,
      employmentChecksPerMonth: Infinity,
      teamManagement: true,
      teamCommunications: true,
      freeBackgroundChecks: true,
      freeEvictionChecks: true,
      freeEmploymentVerification: true,
      customBranding: true,
      apiAccess: true,
      webhooks: true,
      advancedAnalytics: true,
      quickbooksIntegration: true,
      turbotaxIntegration: true,
      contractorManagement: true,
      idPaystubScanner: true, // Available on all plans
      prioritySupport: true,
      // Enterprise-only Team Operations features
      shiftScheduling: true,
      timeTracking: true,
      teamPayroll: false, // Coming soon - third-party payroll integration
      performanceReports: true,
      unlimitedTeamMembers: true,
    },
    description: 'Unlimited units with full business operations suite',
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
export type TierFeatures = typeof SUBSCRIPTION_TIERS[SubscriptionTier]['features'];

/**
 * Normalize legacy tier names to current tier names
 */
export function normalizeTier(tier: string | null | undefined): SubscriptionTier {
  if (!tier) return 'starter';
  
  // Map legacy tiers to new structure
  const tierMap: Record<string, SubscriptionTier> = {
    'free': 'starter',        // Legacy: map to starter
    'starter': 'starter',
    'growth': 'pro',          // Legacy: map to pro
    'professional': 'pro',    // Legacy: map to pro
    'pro': 'pro',
    'enterprise': 'enterprise',
  };
  
  return tierMap[tier.toLowerCase()] || 'starter';
}

export function getTierForUnitCount(unitCount: number): SubscriptionTier {
  if (unitCount <= 24) return 'starter';
  if (unitCount <= 150) return 'pro';
  return 'enterprise';
}

export function getRequiredTierForUnitCount(unitCount: number): SubscriptionTier {
  if (unitCount <= 24) return 'starter';
  if (unitCount <= 150) return 'pro';
  return 'enterprise';
}

export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: keyof TierFeatures
): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const featureValue = tierConfig.features[feature];
  if (typeof featureValue === 'boolean') return featureValue;
  if (typeof featureValue === 'number') return featureValue > 0;
  return false;
}

export function getFeatureLimit(
  tier: SubscriptionTier,
  feature: keyof TierFeatures
): number {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const featureValue = tierConfig.features[feature];
  if (typeof featureValue === 'number') return featureValue;
  return featureValue ? Infinity : 0;
}

export function canAddUnit(currentUnitCount: number, currentTier: SubscriptionTier): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[currentTier];
  return currentUnitCount < tierConfig.unitLimit;
}

export function getUnitLimitWarningThreshold(tier: SubscriptionTier): number {
  const limit = SUBSCRIPTION_TIERS[tier].unitLimit;
  if (limit === Infinity) return Infinity;
  return Math.floor(limit * 0.8);
}

export function isNearUnitLimit(currentUnitCount: number, tier: SubscriptionTier): boolean {
  const threshold = getUnitLimitWarningThreshold(tier);
  return currentUnitCount >= threshold;
}

export function isAtUnitLimit(currentUnitCount: number, tier: SubscriptionTier): boolean {
  return currentUnitCount >= SUBSCRIPTION_TIERS[tier].unitLimit;
}

export function getUpgradeTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  switch (currentTier) {
    case 'starter':
      return 'pro';
    case 'pro':
      return 'enterprise';
    case 'enterprise':
      return null;
  }
}

/**
 * Get trial period in days for a tier
 */
export function getTrialDays(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier].trialDays;
}

/**
 * @deprecated No longer used - subscription model has no transaction fees
 */
export function hasNoCashoutFees(tier: SubscriptionTier): boolean {
  return true; // All tiers have no platform fees now
}

/**
 * Get the Stripe price ID for a tier based on billing interval
 */
export function getPriceIdForInterval(
  tier: SubscriptionTier,
  interval: BillingInterval
): string | undefined {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  return interval === 'yearly' ? tierConfig.yearlyPriceId : tierConfig.priceId;
}

/**
 * Get the display price for a tier based on billing interval
 * Returns the monthly-equivalent price (for yearly, this is the discounted per-month amount)
 */
export function getDisplayPrice(
  tier: SubscriptionTier,
  interval: BillingInterval
): number {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  if (interval === 'yearly') {
    return getYearlyMonthlyEquivalent(tierConfig.price);
  }
  return tierConfig.price;
}

/**
 * Get the total billed amount for a tier based on billing interval
 */
export function getTotalBilledAmount(
  tier: SubscriptionTier,
  interval: BillingInterval
): number {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  if (interval === 'yearly') {
    return tierConfig.yearlyPrice;
  }
  return tierConfig.price;
}

/**
 * Get the yearly savings amount for a tier
 */
export function getYearlySavings(tier: SubscriptionTier): number {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const fullYearlyPrice = tierConfig.price * 12;
  return Math.round((fullYearlyPrice - tierConfig.yearlyPrice) * 100) / 100;
}
