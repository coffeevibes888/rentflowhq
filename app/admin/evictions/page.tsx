'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function EvictionsPage() {
  const searchParams = useSearchParams();
  const tenant = searchParams.get('tenant') ?? '';
  const unit = searchParams.get('unit') ?? '';
  const amountOwed = searchParams.get('amountOwed') ?? '';

  const [printable, setPrintable] = useState(false);

  const handlePrint = () => {
    setPrintable(true);
    setTimeout(() => {
      window.print();
      setPrintable(false);
    }, 50);
  };

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-4xl mx-auto space-y-6'>
        <header className='flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl md:text-4xl font-semibold text-slate-900 mb-1'>Evictions & notices</h1>
            <p className='text-sm text-slate-600'>Draft a notice you can download or print. Confirm with your local attorney for state-specific legal language.</p>
          </div>
          <Button variant='outline' onClick={handlePrint}>
            Print
          </Button>
        </header>

        <section className={`rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4 ${printable ? 'print:border-0 print:shadow-none' : ''}`}>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1 text-sm'>
              <label className='font-medium text-slate-800'>Landlord / Property manager</label>
              <Input placeholder='Your legal name or company' />
            </div>
            <div className='space-y-1 text-sm'>
              <label className='font-medium text-slate-800'>Property address</label>
              <Input placeholder='Street, city, state, ZIP' />
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1 text-sm'>
              <label className='font-medium text-slate-800'>Tenant name(s)</label>
              <Input placeholder='Full legal name(s)' defaultValue={tenant} />
            </div>
            <div className='space-y-1 text-sm'>
              <label className='font-medium text-slate-800'>Unit</label>
              <Input placeholder='Unit / apartment / suite' defaultValue={unit} />
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-3'>
            <div className='space-y-1 text-sm'>
              <label className='font-medium text-slate-800'>Amount of rent owed</label>
              <Input placeholder='$0.00' defaultValue={amountOwed ? `$${amountOwed}` : ''} />
            </div>
            <div className='space-y-1 text-sm'>
              <label className='font-medium text-slate-800'>Through (date)</label>
              <Input type='date' />
            </div>
            <div className='space-y-1 text-sm'>
              <label className='font-medium text-slate-800'>Deadline to pay or vacate</label>
              <Input type='date' />
            </div>
          </div>

          <div className='space-y-1 text-sm'>
            <label className='font-medium text-slate-800'>Reason for notice</label>
            <Textarea
              rows={3}
              placeholder='Non-payment of rent, repeated late payments, violation of lease terms, etc.'
            />
          </div>

          <div className='space-y-1 text-sm'>
            <label className='font-medium text-slate-800'>Additional terms / state-specific language</label>
            <Textarea
              rows={4}
              placeholder='Insert legally compliant text for your state or paste language provided by your attorney.'
            />
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1 text-sm'>
              <label className='font-medium text-slate-800'>Signature</label>
              <Input placeholder='Landlord / Property manager' />
            </div>
            <div className='space-y-1 text-sm'>
              <label className='font-medium text-slate-800'>Date</label>
              <Input type='date' />
            </div>
          </div>

          <p className='mt-4 text-[11px] text-slate-500 border-t border-slate-100 pt-3'>
            This template is for convenience only and does not constitute legal advice. Eviction and notice requirements vary by state and locality. Always have a qualified attorney review your final document before serving it to a tenant.
          </p>
        </section>
      </div>
    </main>
  );
}
