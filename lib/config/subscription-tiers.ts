export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    unitLimit: 24,
    features: {
      freeBackgroundChecks: false,
      freeEvictionChecks: false,
      freeEmploymentVerification: false,
    },
    description: 'Perfect for small landlords with up to 24 units',
  },
  growth: {
    name: 'Growth',
    price: 29.99,
    priceId: process.env.STRIPE_PRICE_GROWTH || null,
    unitLimit: 75,
    features: {
      freeBackgroundChecks: true,
      freeEvictionChecks: true,
      freeEmploymentVerification: true,
    },
    description: 'For growing portfolios with 25-75 units',
  },
  professional: {
    name: 'Professional',
    price: 79.99,
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || null,
    unitLimit: 200,
    features: {
      freeBackgroundChecks: true,
      freeEvictionChecks: true,
      freeEmploymentVerification: true,
    },
    description: 'For professionals managing 76-200 units',
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    priceId: null,
    unitLimit: Infinity,
    features: {
      freeBackgroundChecks: true,
      freeEvictionChecks: true,
      freeEmploymentVerification: true,
    },
    description: 'Custom pricing for 200+ units. Contact us for a quote.',
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export function getTierForUnitCount(unitCount: number): SubscriptionTier {
  if (unitCount <= 24) return 'free';
  if (unitCount <= 75) return 'growth';
  if (unitCount <= 200) return 'professional';
  return 'enterprise';
}

export function getRequiredTierForUnitCount(unitCount: number): SubscriptionTier {
  if (unitCount <= 24) return 'free';
  if (unitCount <= 75) return 'growth';
  if (unitCount <= 200) return 'professional';
  return 'enterprise';
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
      return 'growth';
    case 'growth':
      return 'professional';
    case 'professional':
      return 'enterprise';
    case 'enterprise':
      return null;
  }
}
