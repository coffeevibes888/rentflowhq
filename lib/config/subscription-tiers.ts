export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    unitLimit: 24,
    noCashoutFees: false, // Free tier pays $2 platform fee on cashouts
    features: {
      automaticRentReminders: false,
      automaticLateFees: false,
      employmentChecksPerMonth: 0,
      teamManagement: false,
      teamCommunications: false, // No team chat for free tier
      freeBackgroundChecks: false,
      freeEvictionChecks: false,
      freeEmploymentVerification: false,
      customBranding: false,
      apiAccess: false,
      webhooks: false,
      advancedAnalytics: false,
      quickbooksIntegration: false,
      turbotaxIntegration: false,
      zillowComps: true, // Free tier gets Zillow neighborhood comps
      contractorManagement: false, // PRO feature
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
    price: 29.99,
    priceId: process.env.STRIPE_PRICE_PRO || null,
    unitLimit: 250,
    noCashoutFees: true, // Paid tier - no platform cashout fees (only Stripe fees)
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
      zillowComps: true,
      contractorManagement: true, // PRO feature - manage contractors, work orders, payments
      // Enterprise-only features (disabled for Pro)
      shiftScheduling: false,
      timeTracking: false,
      teamPayroll: false,
      performanceReports: false,
      unlimitedTeamMembers: false,
    },
    description: 'Everything you need for 25-250 units with full team features',
  },
  enterprise: {
    name: 'Enterprise',
    price: 79.99,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || null,
    unitLimit: Infinity,
    noCashoutFees: true,
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
      zillowComps: true,
      contractorManagement: true,
      // Enterprise-only Team Operations features
      shiftScheduling: true,
      timeTracking: true,
      teamPayroll: true,
      performanceReports: true,
      unlimitedTeamMembers: true,
    },
    description: 'Full business operations with scheduling, time tracking, payroll, and unlimited team members.',
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
export type TierFeatures = typeof SUBSCRIPTION_TIERS[SubscriptionTier]['features'];

/**
 * Normalize legacy tier names to current tier names
 * Maps old 'growth' and 'professional' tiers to 'pro'
 */
export function normalizeTier(tier: string | null | undefined): SubscriptionTier {
  if (!tier) return 'free';
  
  // Map legacy tiers to new structure
  const tierMap: Record<string, SubscriptionTier> = {
    'free': 'free',
    'growth': 'pro',      // Legacy: map to pro
    'professional': 'pro', // Legacy: map to pro
    'pro': 'pro',
    'enterprise': 'enterprise',
  };
  
  return tierMap[tier.toLowerCase()] || 'free';
}

export function getTierForUnitCount(unitCount: number): SubscriptionTier {
  if (unitCount <= 24) return 'free';
  if (unitCount <= 250) return 'pro';
  return 'enterprise';
}

export function getRequiredTierForUnitCount(unitCount: number): SubscriptionTier {
  if (unitCount <= 24) return 'free';
  if (unitCount <= 250) return 'pro';
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
    case 'free':
      return 'pro';
    case 'pro':
      return 'enterprise';
    case 'enterprise':
      return null;
  }
}

/**
 * Check if a tier has no platform cashout fees
 * Growth, Professional, and Enterprise tiers only pay Stripe's fees
 */
export function hasNoCashoutFees(tier: SubscriptionTier): boolean {
  return SUBSCRIPTION_TIERS[tier].noCashoutFees;
}
