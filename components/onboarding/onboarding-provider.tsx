'use client';

import { useEffect, useState } from 'react';
import { LandlordTour } from './landlord-tour';

interface OnboardingProviderProps {
  userId: string;
  userCreatedAt: string;
  userRole: string;
}

export function OnboardingProvider({ userId, userCreatedAt, userRole }: OnboardingProviderProps) {
  const [shouldShowTour, setShouldShowTour] = useState(false);

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

  if (!shouldShowTour) {
    return null;
  }

  return <LandlordTour userId={userId} isNewUser={true} />;
}
