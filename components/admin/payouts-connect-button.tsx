'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { loadConnect } from '@stripe/connect-js';

const PayoutsConnectButton = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    try {
      setStripeError(null);
      setOpen(true);
    } catch (error) {
      console.error('Error calling payouts onboarding API', error);
      toast({
        variant: 'destructive',
        description: 'Something went wrong while preparing payouts.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type='button'
        onClick={handleClick}
        disabled={loading}
        className='rounded-full bg-emerald-600 text-white px-6 py-2.5 text-sm font-semibold shadow hover:bg-emerald-500 transition'
      >
        {loading ? 'Saving payout method…' : 'Add / update payout method'}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setStripeError(null);
        }}
      >
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Connect your payout method</DialogTitle>
          </DialogHeader>

          {stripeError ? (
            <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
              {stripeError}
            </div>
          ) : (
            <EmbeddedStripeOnboarding
              onError={(message) => setStripeError(message)}
              onExit={() => {
                toast({ description: 'Payout setup closed. You can reopen it any time.' });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PayoutsConnectButton;

function EmbeddedStripeOnboarding({
  onError,
  onExit,
}: {
  onError: (message: string) => void;
  onExit: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const [isInitializing, setIsInitializing] = useState(true);

  type AccountOnboardingElement = HTMLElement & {
    setOnExit?: (cb: () => void) => void;
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let canceled = false;

    void (async () => {
      try {
        setIsInitializing(true);
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
          onError('Payout setup is not configured yet. Please contact support.');
          return;
        }

        const fetchClientSecret = async () => {
          const res = await fetch('/api/landlord/stripe/onboard');
          const data = await res.json();

          if (!res.ok || !data?.success || !data?.clientSecret) {
            const message = data?.message || 'Unable to start secure payout verification.';
            throw new Error(message);
          }

          return data.clientSecret as string;
        };

        let clientSecret: string;
        try {
          clientSecret = await fetchClientSecret();
        } catch (e) {
          onError(e instanceof Error ? e.message : 'Unable to start secure payout verification.');
          return;
        }

        const stripeConnectWrapper = await loadConnect();
        const stripeConnectInstance = stripeConnectWrapper.initialize({
          publishableKey,
          clientSecret,
          refreshClientSecret: fetchClientSecret,
        });

        const accountOnboarding = stripeConnectInstance.create(
          'account-onboarding'
        ) as AccountOnboardingElement | null;

        if (!accountOnboarding) {
          onError('Unable to render payouts setup. Please refresh and try again.');
          return;
        }

        accountOnboarding.setOnExit?.(onExit);

        const container = containerRef.current;
        if (!container) {
          onError('Unable to render payouts setup. Please refresh and try again.');
          return;
        }

        container.innerHTML = '';
        container.appendChild(accountOnboarding);
      } catch (err) {
        console.error('Stripe embedded onboarding error', err);
        onError('Unable to load secure payout verification. Please try again.');
      } finally {
        if (!canceled) setIsInitializing(false);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [onError, onExit]);

  return (
    <div className='min-h-[520px]'>
      {isInitializing && (
        <div className='py-10 text-sm text-slate-600'>
          Loading secure payout verification…
        </div>
      )}
      <div ref={containerRef} id='stripe-connect-onboarding-container' />
    </div>
  );
}
