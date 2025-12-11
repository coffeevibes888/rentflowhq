'use client';

import { useState } from 'react';
import RentStripePayment from './rent-stripe-payment';
import { Button } from '@/components/ui/button';

export default function RentPayClient({
  rentPaymentIds,
  totalInCents,
}: {
  rentPaymentIds: string[];
  totalInCents: number;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    rentAmount: number;
    convenienceFee: number;
    totalAmount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
          rentPaymentIds,
          paymentMethodType: 'card' // Default to card to show max convenience fee
        }),
      });

      if (!res.ok) {
        setErrorMessage('Failed to start payment. Please try again.');
        return;
      }

      const data = (await res.json()) as { 
        clientSecret?: string;
        rentAmount?: number;
        convenienceFee?: number;
        totalAmount?: number;
      };

      if (!data.clientSecret) {
        setErrorMessage('Payment could not be initialized.');
        return;
      }

      setClientSecret(data.clientSecret);
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
          rentAmount={paymentData.rentAmount}
          initialConvenienceFee={paymentData.convenienceFee}
        />
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
        onClick={handleStartPayment}
        disabled={isLoading}
      >
        {isLoading ? 'Preparing payment...' : 'Pay Rent Now'}
      </Button>
      <div className='text-xs text-slate-400 space-y-1'>
        <p>✓ Multiple payment options available</p>
        <p>✓ Bank transfer (ACH) is FREE with no convenience fee</p>
        <p>✓ Card/wallet payments have a $2 convenience fee</p>
      </div>
    </div>
  );
}
