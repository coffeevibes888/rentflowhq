'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Zap, Clock, Loader2 } from 'lucide-react';
import { cashOutToBank } from '@/lib/actions/landlord-wallet.actions';

interface PayoutFormProps {
  availableAmount: number;
}

const INSTANT_FEE = 2.00;

export default function PayoutForm({ availableAmount }: PayoutFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Standard payout is free
  const standardNet = availableAmount;
  
  // Instant payout has $2 fee
  const instantNet = availableAmount - INSTANT_FEE;

  const handleSubmit = async (instant: boolean) => {
    setLoading(true);
    try {
      const result = await cashOutToBank({ instant });

      if (!result.success) {
        toast({
          variant: 'destructive',
          description: result.message || 'Failed to process payout.',
        });
        return;
      }

      toast({
        description: instant 
          ? `$${result.netAmount?.toFixed(2)} sent instantly! Funds arriving within minutes.`
          : `$${result.netAmount?.toFixed(2)} sent to your bank. Arrives in 3-5 business days.`,
      });

      router.refresh();
    } catch (error) {
      console.error('Payout error:', error);
      toast({
        variant: 'destructive',
        description: 'Something went wrong while processing your payout.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='grid gap-3 md:grid-cols-2'>
      {/* Standard Payout - FREE */}
      <button
        onClick={() => handleSubmit(false)}
        disabled={availableAmount <= 0 || loading}
        className='group relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white p-5 text-left transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02]'
      >
        {loading && (
          <div className='absolute inset-0 bg-white/80 flex items-center justify-center z-10'>
            <Loader2 className='h-6 w-6 animate-spin text-emerald-600' />
          </div>
        )}
        <div className='space-y-3'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-2'>
              <div className='rounded-full bg-emerald-100 p-2'>
                <Clock className='h-5 w-5 text-emerald-600' />
              </div>
              <div>
                <p className='text-sm font-bold text-slate-900'>Standard Payout</p>
                <p className='text-xs text-slate-600'>3-5 business days</p>
              </div>
            </div>
            <div className='rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white'>
              FREE
            </div>
          </div>
          
          <div className='space-y-1'>
            <p className='text-2xl font-bold text-slate-900'>
              ${standardNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className='text-xs text-slate-500'>No fees for bank transfers</p>
          </div>

          <div className='rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800'>
            Best for regular payouts
          </div>
        </div>
      </button>

      {/* Instant Payout - $2 fee */}
      <button
        onClick={() => handleSubmit(true)}
        disabled={availableAmount <= INSTANT_FEE || loading}
        className='group relative overflow-hidden rounded-2xl border-2 border-violet-500 bg-gradient-to-br from-violet-50 to-white p-5 text-left transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02]'
      >
        {loading && (
          <div className='absolute inset-0 bg-white/80 flex items-center justify-center z-10'>
            <Loader2 className='h-6 w-6 animate-spin text-violet-600' />
          </div>
        )}
        <div className='absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -z-10' />
        
        <div className='space-y-3'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-2'>
              <div className='rounded-full bg-violet-100 p-2'>
                <Zap className='h-5 w-5 text-violet-600' />
              </div>
              <div>
                <p className='text-sm font-bold text-slate-900'>Instant Payout</p>
                <p className='text-xs text-slate-600'>Within minutes</p>
              </div>
            </div>
            <div className='rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white'>
              $2 FEE
            </div>
          </div>
          
          <div className='space-y-1'>
            <p className='text-2xl font-bold text-slate-900'>
              ${instantNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className='text-xs text-slate-500'>
              Fee: $2.00
            </p>
          </div>

          <div className='rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 text-xs text-violet-800'>
            Get paid now to debit card
          </div>
        </div>
      </button>
    </div>
  );
}
