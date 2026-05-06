'use client';

import { useEffect } from 'react';

/**
 * Fires a Meta Pixel ViewContent event once when the component mounts.
 * Drop into any landing page so the ad algorithm learns who converts on that funnel.
 *
 * PageView already fires globally from app/layout.tsx — this is a richer
 * ViewContent event tied to the specific landing page (PM vs contractor).
 */
export default function MetaViewContent({
  contentName,
  contentCategory,
  value,
  currency = 'USD',
}: {
  contentName: string;
  contentCategory: string;
  value?: number;
  currency?: string;
}) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
    try {
      window.fbq('track', 'ViewContent', {
        content_name: contentName,
        content_category: contentCategory,
        ...(typeof value === 'number' ? { value, currency } : {}),
      });
    } catch {
      // silent fail — analytics must never break the UX
    }
  }, [contentName, contentCategory, value, currency]);

  return null;
}
