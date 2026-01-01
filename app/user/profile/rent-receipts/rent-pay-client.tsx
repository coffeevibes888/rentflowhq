'use client';

import { useState } from 'react';
import RentStripePayment from './rent-stripe-payment';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';

export default function RentPayClient({
  rentPaymentIds,
  totalInCents,
}: {
  rentPaymentIds: string[];
  totalInCents: number;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    rentAmount: number;
    convenienceFee: number;
    totalAmount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const handleStartPayment = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const res = await fetch('/api/rent/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          rentPaymentIds
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as { message?: string };
        setErrorMessage(errorData.message || 'Failed to start payment. Please try again.');
        return;
      }

      const data = (await res.json()) as { 
        clientSecret?: string;
        paymentIntentId?: string;
        rentAmount?: number;
        convenienceFee?: number;
        totalAmount?: number;
      };

      if (!data.clientSecret) {
        setErrorMessage('Payment could not be initialized.');
        return;
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId || null);
      setPaymentData({
        rentAmount: data.rentAmount || 0,
        convenienceFee: data.convenienceFee || 0,
        totalAmount: data.totalAmount || 0,
      });
    } catch (err) {
      setErrorMessage('Something went wrong starting the payment.');
    } finally {
      setIsLoading(false);
    }
  };

  if (clientSecret && paymentData) {
    return (
      <div className='space-y-4'>
        <RentStripePayment 
          totalInCents={Math.round(paymentData.totalAmount * 100)}
          clientSecret={clientSecret}
          paymentIntentId={paymentIntentId}
          rentAmount={paymentData.rentAmount}
          initialConvenienceFee={paymentData.convenienceFee}
        />
      </div>
    );
  }

  // Show payment method selection
  if (showPaymentOptions) {
    return (
      <div className='space-y-3'>
        {errorMessage && (
          <div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg'>
            {errorMessage}
          </div>
        )}
        
        <p className='text-xs text-slate-300 font-medium'>Choose payment method:</p>
        
        {/* Card/Bank Payment */}
        <Button
          className='w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all'
          onClick={handleStartPayment}
          disabled={isLoading}
        >
          <CreditCard className='w-4 h-4 mr-2' />
          {isLoading ? 'Preparing payment...' : 'Pay with Card or Bank'}
        </Button>

        <Button
          variant='ghost'
          size='sm'
          onClick={() => setShowPaymentOptions(false)}
          className='w-full text-slate-400 hover:text-white'
        >
          Back
        </Button>

        <div className='text-xs text-slate-400 space-y-1 pt-2 border-t border-white/10'>
          <p>✓ Bank transfer (ACH) is FREE with no convenience fee</p>
          <p>✓ Card/wallet payments have a $2 convenience fee</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {errorMessage && (
        <div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg'>
          {errorMessage}
        </div>
      )}
      <Button
        className='inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all'
        size='lg'
        onClick={() => setShowPaymentOptions(true)}
      >
        Pay Rent Now
      </Button>
      <div className='text-xs text-slate-400 space-y-1'>
        <p>✓ Multiple payment options available</p>
        <p>✓ Bank transfer (ACH) is FREE with no convenience fee</p>
        <p>✓ Card and wallet payments accepted</p>
      </div>
    </div>
  );
}
