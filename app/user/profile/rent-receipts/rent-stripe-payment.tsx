'use client';

import { FormEvent, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PLATFORM_FEES } from '@/lib/config/platform-fees';
import { CreditCard, Building2, Smartphone, Zap, Clock } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

export default function RentStripePayment({
  totalInCents,
  clientSecret,
  rentAmount,
  initialConvenienceFee,
}: {
  totalInCents: number;
  clientSecret: string;
  rentAmount: number;
  initialConvenienceFee: number;
}) {
  const { theme, systemTheme } = useTheme();

  const StripeForm = () => {
    const stripe = useStripe();
    const elements = useElements();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [email, setEmail] = useState('');
    const [selectedPaymentType, setSelectedPaymentType] = useState<'card' | 'ach' | null>(null);
    const [convenienceFee, setConvenienceFee] = useState(initialConvenienceFee);

    // Listen for payment method changes
    useEffect(() => {
      if (!elements) return;

      const paymentElement = elements.getElement('payment');
      if (!paymentElement) return;

      paymentElement.on('change', (event) => {
        // Update convenience fee based on payment method type
        if (event.value.type === 'us_bank_account' || event.value.type === 'ach_debit') {
          setSelectedPaymentType('ach');
          setConvenienceFee(PLATFORM_FEES.CONVENIENCE_FEE_ACH);
        } else {
          setSelectedPaymentType('card');
          setConvenienceFee(PLATFORM_FEES.CONVENIENCE_FEE_INSTANT);
        }
      });
    }, [elements]);

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements || !email) return;

      setIsLoading(true);
      setErrorMessage('');

      try {
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {},
          redirect: 'if_required',
        });

        if (error) {
          if (error.type === 'card_error' || error.type === 'validation_error') {
            setErrorMessage(error.message ?? 'An unknown error occurred');
          } else {
            setErrorMessage('An unknown error occurred');
          }
          return;
        }

        const intentId = paymentIntent?.id;

        if (intentId) {
          await fetch('/api/rent/mark-paid', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentIntentId: intentId }),
          });
        }

        window.location.href = '/user/profile/rent-receipts';
      } catch (err) {
        setErrorMessage('Something went wrong while processing your payment.');
      } finally {
        setIsLoading(false);
      }
    };

    const displayTotal = rentAmount + convenienceFee;

    return (
      <form className='space-y-5' onSubmit={handleSubmit}>
        {/* Payment Method Info Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <div className='rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4'>
            <div className='flex items-start gap-3'>
              <div className='rounded-full bg-emerald-600 p-2'>
                <Building2 className='h-4 w-4 text-white' />
              </div>
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <h4 className='text-sm font-semibold text-emerald-900'>Bank Account (ACH)</h4>
                  <span className='text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-medium'>FREE</span>
                </div>
                <p className='text-xs text-emerald-700 mt-1'>No convenience fee • 5-7 days</p>
                <p className='text-xs text-emerald-600 mt-1'>✓ Can set up recurring payments</p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border-2 border-violet-200 bg-violet-50 p-4'>
            <div className='flex items-start gap-3'>
              <div className='rounded-full bg-violet-600 p-2'>
                <Zap className='h-4 w-4 text-white' />
              </div>
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <h4 className='text-sm font-semibold text-violet-900'>Card / Wallet</h4>
                  <span className='text-xs bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full font-medium'>+$2</span>
                </div>
                <p className='text-xs text-violet-700 mt-1'>Convenience fee • Instant</p>
                <div className='flex items-center gap-1 mt-1'>
                  <Smartphone className='h-3 w-3 text-violet-600' />
                  <p className='text-xs text-violet-600'>Apple Pay, Google Pay, Cards</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className='rounded-lg border border-slate-300 bg-slate-50 p-4 space-y-2.5'>
          <div className='text-sm font-semibold text-slate-900'>Payment Summary</div>
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-slate-600'>Rent Amount</span>
              <span className='font-semibold text-slate-900'>{formatCurrency(rentAmount)}</span>
            </div>
            {convenienceFee > 0 ? (
              <div className='flex justify-between text-sm'>
                <span className='text-slate-600'>Convenience Fee</span>
                <span className='text-violet-700 font-medium'>{formatCurrency(convenienceFee)}</span>
              </div>
            ) : (
              <div className='flex justify-between text-sm'>
                <span className='text-emerald-600 flex items-center gap-1'>
                  <span>✓</span> No convenience fee
                </span>
                <span className='text-emerald-700 font-semibold'>{formatCurrency(0)}</span>
              </div>
            )}
            <div className='border-t border-slate-300 pt-2 flex justify-between font-bold text-base'>
              <span className='text-slate-900'>Total Due</span>
              <span className='text-slate-900'>{formatCurrency(displayTotal)}</span>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-sm'>
          <div className='flex items-start gap-2'>
            <div className='rounded-full bg-blue-600 p-1 mt-0.5'>
              <Clock className='h-3 w-3 text-white' />
            </div>
            <div className='flex-1'>
              <p className='font-semibold text-blue-900 mb-1'>💡 Choose your payment method below</p>
              <ul className='space-y-1 text-xs text-blue-800'>
                <li className='flex items-start gap-1.5'>
                  <span className='text-emerald-600 font-bold mt-0.5'>•</span>
                  <span><strong>Bank Account:</strong> FREE - Best for recurring rent payments</span>
                </li>
                <li className='flex items-start gap-1.5'>
                  <span className='text-violet-600 font-bold mt-0.5'>•</span>
                  <span><strong>Card/Wallet:</strong> $2 fee - Instant payment confirmation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {errorMessage && <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3'>{errorMessage}</div>}
        
        {/* Stripe Payment Element with all payment methods */}
        <div className='rounded-lg border border-slate-300 p-4 bg-white'>
          <PaymentElement 
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
              wallets: {
                applePay: 'auto',
                googlePay: 'auto',
              },
            }}
          />
        </div>
        
        <div>
          <LinkAuthenticationElement onChange={(e) => setEmail(e.value.email)} />
        </div>
        
        <Button
          className='w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold'
          size='lg'
          disabled={stripe == null || elements == null || isLoading}
        >
          {isLoading
            ? 'Processing payment...'
            : `Pay ${formatCurrency(displayTotal)}`}
        </Button>

        <p className='text-xs text-center text-slate-500'>
          🔒 Secure payment processed by Stripe. Your information is encrypted and protected.
        </p>
      </form>
    );
  };

  return (
    <Elements
      options={{
        clientSecret,
        appearance: {
          theme:
            theme === 'dark'
              ? 'night'
              : theme === 'light'
              ? 'stripe'
              : systemTheme === 'light'
              ? 'stripe'
              : 'night',
          variables: {
            colorPrimary: '#7c3aed',
            borderRadius: '8px',
          },
        },
      }}
      stripe={stripePromise}
    >
      <StripeForm />
    </Elements>
  );
}
