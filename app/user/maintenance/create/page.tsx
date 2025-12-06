'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const ticketSchema = z.object({
  title: z.string().min(3, 'Please describe the issue briefly'),
  description: z.string().min(5, 'Please provide more details about the problem'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export default function CreateMaintenanceTicketPage() {
  const router = useRouter();

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
  });

  const onSubmit = async (values: z.infer<typeof ticketSchema>) => {
    const res = await fetch('/api/maintenance-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      router.push('/user/profile?ticket=created');
    }
  };

  return (
    <main className='w-full min-h-screen px-4 py-8 md:px-8'>
      <div className='max-w-2xl mx-auto space-y-6'>
        <div>
          <h1 className='text-2xl md:text-3xl font-semibold text-slate-900 mb-1'>Create maintenance ticket</h1>
          <p className='text-sm text-slate-600'>Tell us what&apos;s wrong with your unit or property so our team can help.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue title</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Bathroom sink leaking' {...field} />
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
                      className='w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm'
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

            <Button type='submit' className='w-full'>
              Submit ticket
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
