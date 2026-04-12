'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const TenantInviteForm = () => {
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      toast({
        variant: 'destructive',
        description: 'Please provide at least an email or phone number for the tenant.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/landlord/invite-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast({
          variant: 'destructive',
          description: data.message || 'Unable to send invite. Please try again.',
        });
        return;
      }

      toast({ description: data.message || 'Tenant invite sent.' });
      setName('');
      setEmail('');
      setPhone('');
      router.refresh();
    } catch (error) {
      console.error('Error sending tenant invite', error);
      toast({
        variant: 'destructive',
        description: 'Something went wrong sending the invite.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-1'>
          <label className='block text-xs font-medium text-slate-700'>Tenant full name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. Jane Doe'
          />
        </div>
        <div className='space-y-1'>
          <label className='block text-xs font-medium text-slate-700'>Tenant email</label>
          <Input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='tenant@example.com'
          />
        </div>
      </div>
      <div className='space-y-1'>
        <label className='block text-xs font-medium text-slate-700'>Tenant mobile number (optional)</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder='(555) 000-0000'
        />
      </div>
      <p className='text-[11px] text-slate-500'>
        We&apos;ll send invites using your preferences from Settings (email and/or text when available).
      </p>
      <div className='pt-2 flex gap-3'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Sending invite...' : 'Send invite'}
        </Button>
      </div>
    </form>
  );
};

export default TenantInviteForm;
