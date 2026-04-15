'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const ticketSchema = z.object({
  title: z.string().min(3, 'Please describe the issue briefly'),
  description: z.string().min(5, 'Please provide more details about the problem'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export default function CreateMaintenanceTicketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
  });

  const onSubmit = async (values: z.infer<typeof ticketSchema>) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/maintenance-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        toast({ title: 'Ticket submitted', description: 'Your maintenance request has been sent to your property manager.' });
        router.push('/user/profile?ticket=created');
      } else {
        const data = await res.json().catch(() => ({}));
        toast({
          title: 'Failed to submit ticket',
          description: data.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not reach the server. Check your connection.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className='w-full min-h-screen px-4 py-8 md:px-8'>
      <div className='max-w-2xl mx-auto space-y-6'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold text-white mb-1'>Create Maintenance Ticket</h1>
          <p className='text-sm text-slate-400'>Tell us what&apos;s wrong with your unit or property so our team can help.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 bg-slate-900/60 rounded-xl border border-white/10 p-6 shadow-lg'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue title</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Bathroom sink leaking' className='bg-slate-800/60 border-white/10 text-white placeholder:text-slate-500' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder='Describe the problem, when it started, and any access notes (pets, alarm, etc.)'
                      className='bg-slate-800/60 border-white/10 text-white placeholder:text-slate-500'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='priority'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <select
                      className='w-full rounded-md border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white'
                      {...field}
                    >
                      <option value='low'>Low</option>
                      <option value='medium'>Medium</option>
                      <option value='high'>High</option>
                      <option value='urgent'>Urgent</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' disabled={submitting} className='w-full bg-indigo-600 hover:bg-indigo-500'>
              {submitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {submitting ? 'Submitting...' : 'Submit ticket'}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
