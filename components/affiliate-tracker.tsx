'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (!refCode) return;

    // Generate a session ID for tracking
    const sessionId = crypto.randomUUID();

    // Track the click
    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: refCode,
        landingPage: window.location.pathname,
        referrerUrl: document.referrer || null,
        sessionId,
      }),
    }).catch(console.error);
  }, [searchParams]);

  return null;
}
