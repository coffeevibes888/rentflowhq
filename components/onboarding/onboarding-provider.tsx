'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LandlordTour } from './landlord-tour';

interface OnboardingProviderProps {
  userId: string;
  userCreatedAt: string;
  userRole: string;
  isPro?: boolean;
}

export function OnboardingProvider({ userId, userCreatedAt, userRole, isPro = false }: OnboardingProviderProps) {
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const pathname = usePathname();

  // Don't show the spotlight tour while user is on the onboarding page
  // Let them complete the onboarding checklist first
  const isOnOnboardingPage = pathname?.startsWith('/admin/onboarding');

  useEffect(() => {
    // Only show tour for landlords and property managers
    if (userRole !== 'landlord' && userRole !== 'property_manager') {
      return;
    }

    // Check if user was created within the last 7 days (new user)
    const createdAt = new Date(userCreatedAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const isNewUser = hoursSinceCreation < 168; // 7 days

    // Check if tour was already completed
    const tourCompleted = localStorage.getItem(`landlord-tour-completed-${userId}`);
    
    if (isNewUser && !tourCompleted) {
      setShouldShowTour(true);
    }
  }, [userId, userCreatedAt, userRole]);

  // Don't render the tour while on the onboarding page
  if (!shouldShowTour || isOnOnboardingPage) {
    return null;
  }

  return <LandlordTour userId={userId} isNewUser={true} isPro={isPro} />;
}
