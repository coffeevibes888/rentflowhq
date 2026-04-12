'use client';

import { FormEvent, useState } from 'react';
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

interface CardPaymentFormProps {
  onSubmit: () => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function CardPaymentForm({
  onSubmit,
  isLoading = false,
  onCancel,
}: CardPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      await onSubmit();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'An error occurred'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='space-y-5'>
      {/* Card Details */}
      <div className='rounded-lg border border-slate-300 p-4 bg-white'>
        <label className='block text-sm font-medium text-slate-900 mb-3'>
          Card Details
        </label>
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
        />
      </div>

      {/* Contact info is not collected here — tenant is authenticated */}

      {/* Available Methods */}
      <div className='rounded-lg border border-blue-200 bg-blue-50 p-3.5 text-sm'>
        <div className='flex items-start gap-2'>
          <Smartphone className='h-4 w-4 text-blue-600 mt-0.5 shrink-0' />
          <div>
            <p className='text-blue-900 font-medium'>Available payment methods:</p>
            <ul className='mt-1 space-y-1 text-blue-800 text-xs'>
              <li>• Credit & Debit Cards</li>
              <li>• Apple Pay</li>
              <li>• Google Pay</li>
            </ul>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3'>
          {errorMessage}
        </div>
      )}

      {/* Submit Buttons */}
      <div className='flex gap-2 pt-2'>
        <Button
          type='button'
          onClick={handleSubmit}
          disabled={stripe == null || elements == null || isProcessing || isLoading}
          className='flex-1 bg-violet-600 hover:bg-violet-700 text-white'
        >
          {isProcessing || isLoading
            ? 'Processing payment...'
            : 'Continue with Card'}
        </Button>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isProcessing || isLoading}
            className='border-slate-300 text-slate-900 hover:bg-slate-50'
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
