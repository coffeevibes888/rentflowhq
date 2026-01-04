'use client';

import { useState, useCallback } from 'react';
import { SubscriptionTier } from '@/lib/config/subscription-tiers';

interface SubscriptionState {
  showUpgradeModal: boolean;
  currentTier: SubscriptionTier;
  currentUnitCount: number;
  unitLimit: number;
  reason: 'unit_limit' | 'feature_locked';
  lockedFeature?: string;
}

const initialState: SubscriptionState = {
  showUpgradeModal: false,
  currentTier: 'starter',
  currentUnitCount: 0,
  unitLimit: 24,
  reason: 'unit_limit',
  lockedFeature: undefined,
};

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>(initialState);

  const showUnitLimitModal = useCallback((data: {
    currentTier: SubscriptionTier;
    currentUnitCount: number;
    unitLimit: number;
  }) => {
    setState({
      showUpgradeModal: true,
      currentTier: data.currentTier,
      currentUnitCount: data.currentUnitCount,
      unitLimit: data.unitLimit,
      reason: 'unit_limit',
      lockedFeature: undefined,
    });
  }, []);

  const showFeatureLockedModal = useCallback((data: {
    currentTier: SubscriptionTier;
    lockedFeature: string;
  }) => {
    setState({
      showUpgradeModal: true,
      currentTier: data.currentTier,
      currentUnitCount: 0,
      unitLimit: 0,
      reason: 'feature_locked',
      lockedFeature: data.lockedFeature,
    });
  }, []);

  const closeModal = useCallback(() => {
    setState((prev) => ({ ...prev, showUpgradeModal: false }));
  }, []);

  return {
    ...state,
    showUnitLimitModal,
    showFeatureLockedModal,
    closeModal,
  };
}
