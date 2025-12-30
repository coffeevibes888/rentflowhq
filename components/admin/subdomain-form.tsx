'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateCurrentLandlordSubdomain } from '@/lib/actions/landlord.actions';

interface SubdomainFormProps {
  currentSubdomain: string;
  baseUrl: string;
}

export default function SubdomainForm({ currentSubdomain, baseUrl }: SubdomainFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [slugValue, setSlugValue] = useState(currentSubdomain);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(false);
    
    startTransition(async () => {
      const result = await updateCurrentLandlordSubdomain(formData);
      
      if (!result.success) {
        setError(result.message || 'Failed to update portal slug');
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  };

  return (
    <form action={handleSubmit} className='space-y-3' data-tour="subdomain">
      {error && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800'>
          {error}
        </div>
      )}
      {success && (
        <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800'>
          Portal slug updated successfully!
        </div>
      )}
      <div>
        <label className='block text-sm font-medium text-slate-200/90 mb-2'>Portal URL Slug</label>
        <div className='flex items-center gap-2'>
          <span className='text-sm text-slate-400'>{baseUrl}/</span>
          <input
            type='text'
            name='subdomain'
            value={slugValue}
            onChange={(e) => setSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className='flex-1 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100'
            placeholder='your-company'
            required
            minLength={3}
            maxLength={50}
          />
        </div>
        <p className='text-xs text-slate-400 mt-1'>3-50 characters, lowercase letters, numbers, and hyphens only</p>
        {slugValue && (
          <p className='text-xs text-violet-300 mt-2'>
            Preview: {baseUrl}/{slugValue}
          </p>
        )}
      </div>

      <button
        type='submit'
        disabled={isPending}
        className='inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {isPending ? 'Saving...' : 'Save portal slug'}
      </button>
    </form>
  );
}

