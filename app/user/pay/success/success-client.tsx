'use client';

import { useEffect, useRef } from 'react';

export default function PaymentSuccessClient({
  paymentIntentId,
}: {
  paymentIntentId: string | null;
}) {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (!paymentIntentId) return;

    (async () => {
      try {
        await fetch('/api/rent/mark-paid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId }),
        });
      } catch {
        // noop
      }
    })();
  }, [paymentIntentId]);

  return null;
}
