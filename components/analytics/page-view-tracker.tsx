'use client';

import { useEffect } from 'react';

const PageViewTracker = () => {
  useEffect(() => {
    const path = window.location.pathname + window.location.search;
    const referrer = document.referrer || undefined;

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path, referrer }),
      keepalive: true,
    }).catch(() => {
      // Ignore errors
    });
  }, []);

  return null;
};

export default PageViewTracker;
