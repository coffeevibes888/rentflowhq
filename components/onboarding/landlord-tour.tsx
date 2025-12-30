'use client';

import { useState, useEffect } from 'react';
import { SpotlightTour, TourStep } from './spotlight-tour';

const STORAGE_KEY = 'landlord-tour-completed';

// Define the tour steps with actual selectors
// Steps marked with proOnly will be skipped for non-pro users
const LANDLORD_TOUR_STEPS: (TourStep & { proOnly?: boolean })[] = [
  {
    id: 'properties-nav',
    title: 'Your Properties',
    description: 'This is where you manage all your properties. Click here to add buildings, set rent amounts, and manage units.',
    targetSelector: 'a[href="/admin/products"]',
    route: '/admin/products',
    position: 'right',
  },
  {
    id: 'add-property',
    title: 'Add Your First Property',
    description: 'Click this button to create a new property. You can add multiple units, set rent prices, upload photos, and configure amenities.',
    targetSelector: '[data-tour="add-property"]',
    route: '/admin/products',
    position: 'bottom',
  },
  {
    id: 'applications-nav',
    title: 'Tenant Applications',
    description: 'When tenants apply through your property page, their applications appear here. Review their ID, income documents, and approve or reject them.',
    targetSelector: 'a[href="/admin/applications"]',
    route: '/admin/applications',
    position: 'right',
  },
  {
    id: 'branding-nav',
    title: 'Branding & Subdomain',
    description: 'Customize your brand! Upload your logo, set colors, and get your own URL where tenants can view and apply to your properties.',
    targetSelector: 'a[href="/admin/branding"]',
    route: '/admin/branding',
    position: 'right',
  },
  {
    id: 'branding-logo',
    title: 'Upload Your Logo',
    description: 'Add your company logo here. It will appear on your tenant-facing pages, emails, and documents.',
    targetSelector: '[data-tour="logo-upload"]',
    route: '/admin/branding',
    position: 'right',
  },
  {
    id: 'branding-subdomain',
    title: 'Your Custom URL',
    description: 'Set up your unique URL (e.g., yourcompany). Tenants will use this link to view your properties and submit applications.',
    targetSelector: '[data-tour="subdomain"]',
    route: '/admin/branding',
    position: 'right',
  },
  {
    id: 'contractors-nav',
    title: 'Contractor Management',
    description: 'Add and manage maintenance contractors. Create work orders, track jobs, and process payments directly to your contractors.',
    targetSelector: 'a[href="/admin/contractors"]',
    route: '/admin/contractors',
    position: 'right',
    proOnly: true, // Skip this step for non-pro users
  },
  {
    id: 'payouts-nav',
    title: 'Payouts & Banking',
    description: 'Connect your bank account to receive rent payments. All collected rent will be deposited directly to your account.',
    targetSelector: 'a[href="/admin/payouts"]',
    route: '/admin/payouts',
    position: 'right',
  },
];

interface LandlordTourProps {
  userId: string;
  isNewUser?: boolean;
  isPro?: boolean;
}

export function LandlordTour({ userId, isNewUser = false, isPro = false }: LandlordTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Filter steps based on subscription tier
  const filteredSteps = LANDLORD_TOUR_STEPS.filter(step => !step.proOnly || isPro);

  useEffect(() => {
    setMounted(true);
    
    // Check if tour was already completed
    const completed = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
    
    if (!completed && isNewUser) {
      // Delay to let the page fully render
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [userId, isNewUser]);

  const handleComplete = () => {
    localStorage.setItem(`${STORAGE_KEY}-${userId}`, 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(`${STORAGE_KEY}-${userId}`, 'true');
    setIsOpen(false);
  };

  // Don't render on server
  if (!mounted) return null;

  return (
    <SpotlightTour
      steps={filteredSteps}
      isOpen={isOpen}
      onComplete={handleComplete}
      onSkip={handleSkip}
      storageKey={`${STORAGE_KEY}-${userId}`}
    />
  );
}

// Button to manually restart the tour
export function RestartTourButton({ userId, isPro = false }: { userId: string; isPro?: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRestart = () => {
    localStorage.removeItem(`${STORAGE_KEY}-${userId}`);
    window.location.href = '/admin/products'; // Start from properties page
  };

  if (!mounted) return null;

  return (
    <button
      onClick={handleRestart}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors text-sm font-medium"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Start Guided Tour
    </button>
  );
}
