'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initAnalytics } from '@/lib/analytics-tracker';

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize analytics tracker
    const tracker = initAnalytics({
      enabled: true,
      trackClicks: true,
      trackScrollDepth: true,
      trackFormInteractions: true,
    });

    // Track page view on route change
    if (tracker) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        tracker.trackFunnelStep('page_view', 1, {
          path: pathname,
          search: searchParams.toString(),
        });
      }, 100);
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}
