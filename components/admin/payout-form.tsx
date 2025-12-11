'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Zap, Clock } from 'lucide-react';

interface PayoutFormProps {
  availableAmount: number;
}

export default function PayoutForm({ availableAmount }: PayoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'standard' | 'instant'>('standard');
  const router = useRouter();
  const { toast } = useToast();

  // Calculate instant payout fee (1.5% capped at $10)
  const instantFee = Math.min(availableAmount * 0.015, 10);
  const instantNet = availableAmount - instantFee;

  const handleSubmit = async (type: 'standard' | 'instant') => {
    setLoading(true);
    try {
      const res = await fetch('/api/landlord/payouts/cash-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          variant: 'destructive',
          description: data.message || 'Failed to process payout.',
        });
        return;
      }

      toast({
        description: type === 'instant' 
          ? 'Instant payout initiated! Funds arriving within minutes.'
          : 'Standard payout scheduled. Funds will arrive in 2-3 business days.',
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
      {/* Standard Payout */}
      <button
        onClick={() => handleSubmit('standard')}
        disabled={availableAmount <= 0 || loading}
        className='group relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white p-5 text-left transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02]'
      >
        <div className='space-y-3'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-2'>
              <div className='rounded-full bg-emerald-100 p-2'>
                <Clock className='h-5 w-5 text-emerald-600' />
              </div>
              <div>
                <p className='text-sm font-bold text-slate-900'>Standard Payout</p>
                <p className='text-xs text-slate-600'>2-3 business days</p>
              </div>
            </div>
            <div className='rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white'>
              FREE
            </div>
          </div>
          
          <div className='space-y-1'>
            <p className='text-2xl font-bold text-slate-900'>
              ${availableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className='text-xs text-slate-500'>No fees • Full amount</p>
          </div>

          <div className='rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800'>
            ✓ Best for regular payouts • No rush
          </div>
        </div>
      </button>

      {/* Instant Payout */}
      <button
        onClick={() => handleSubmit('instant')}
        disabled={availableAmount <= 0 || loading}
        className='group relative overflow-hidden rounded-2xl border-2 border-violet-500 bg-gradient-to-br from-violet-50 to-white p-5 text-left transition-all hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02]'
      >
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
              1.5%
            </div>
          </div>
          
          <div className='space-y-1'>
            <p className='text-2xl font-bold text-slate-900'>
              ${instantNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className='text-xs text-slate-500'>
              Fee: ${instantFee.toFixed(2)} (1.5%, max $10)
            </p>
          </div>

          <div className='rounded-lg bg-violet-50 border border-violet-200 px-3 py-2 text-xs text-violet-800'>
            ⚡ Get paid now • Requires debit card
          </div>
        </div>
      </button>
    </div>
  );
}

