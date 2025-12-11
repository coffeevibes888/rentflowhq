'use client';

import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bankAccountFormSchema } from '@/lib/validators';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

type BankAccountFormProps = {
  onSubmit: (data: {
    stripePaymentMethodId: string;
    type: 'bank_account';
    accountHolderName: string;
    last4: string;
    bankName?: string;
    accountType?: 'checking' | 'savings';
    routingNumber?: string;
    isDefault: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
  initialData?: {
    id: string;
    accountHolderName?: string;
    isDefault: boolean;
    last4: string;
    bankName?: string;
    accountType?: string;
  } | null;
};

export default function BankAccountForm({
  onSubmit,
  isLoading = false,
  onCancel,
  initialData,
}: BankAccountFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<z.infer<typeof bankAccountFormSchema>>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      accountHolderName: initialData?.accountHolderName || '',
      accountNumber: '',
      routingNumber: '',
      accountType: (initialData?.accountType as 'checking' | 'savings') || 'checking',
      isDefault: initialData?.isDefault || false,
    },
  });

  const handleSubmit = async (values: z.infer<typeof bankAccountFormSchema>) => {
    if (isEditing) {
      setIsProcessing(true);
      try {
        await onSubmit({
          stripePaymentMethodId: initialData?.id || '',
          type: 'bank_account',
          accountHolderName: values.accountHolderName,
          last4: initialData?.last4 || '',
          bankName: initialData?.bankName,
          accountType: values.accountType,
          routingNumber: values.routingNumber,
          isDefault: values.isDefault,
        });
      } catch (error) {
        console.error('Payout method update error:', error);
        toast({
          variant: 'destructive',
          description: error instanceof Error ? error.message : 'Failed to update payout method. Please try again.',
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (!stripe || !elements) {
      toast({
        variant: 'destructive',
        description: 'Stripe has not loaded yet. Please try again.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create bank account token using Stripe
      const { token, error } = await stripe.createToken('bank_account', {
        country: 'US',
        currency: 'usd',
        routing_number: values.routingNumber,
        account_number: values.accountNumber,
        account_holder_name: values.accountHolderName,
        account_holder_type: 'individual',
      });

      if (error) {
        toast({
          variant: 'destructive',
          description: error.message || 'Failed to validate bank account',
        });
        setIsProcessing(false);
        return;
      }

      if (!token) {
        toast({
          variant: 'destructive',
          description: 'Failed to create bank account token',
        });
        setIsProcessing(false);
        return;
      }

      // Get bank account details from token
      const bankAccount = token.bank_account;
      
      await onSubmit({
        stripePaymentMethodId: token.id,
        type: 'bank_account',
        accountHolderName: values.accountHolderName,
        last4: bankAccount?.last4 || '',
        bankName: bankAccount?.bank_name ?? undefined,
        accountType: values.accountType,
        routingNumber: values.routingNumber,
        isDefault: values.isDefault,
      });

      form.reset();
    } catch (error) {
      console.error('Bank account submission error:', error);
      toast({
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Failed to save bank account. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='accountHolderName'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-slate-900'>Account Holder Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder='John Doe'
                  className='bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  disabled={isProcessing || isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <>
            <FormField
              control={form.control}
              name='routingNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-slate-900'>Routing Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='110000000'
                      maxLength={9}
                      className='bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      disabled={isProcessing || isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='accountNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-slate-900'>Account Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='password'
                      placeholder='000123456789'
                      className='bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      disabled={isProcessing || isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name='accountType'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-slate-900'>Account Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className='bg-white border-slate-300 text-slate-900'>
                    <SelectValue placeholder='Select account type' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='checking'>Checking</SelectItem>
                  <SelectItem value='savings'>Savings</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='isDefault'
          render={({ field }) => (
            <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className='border-slate-300 data-[state=checked]:bg-emerald-600'
                />
              </FormControl>
              <div className='space-y-1 leading-none'>
                <FormLabel className='text-slate-900'>
                  Set as default payout method
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className='flex gap-2 pt-2'>
          <Button
            type='submit'
            disabled={isProcessing || isLoading || !stripe}
            className='bg-emerald-600 hover:bg-emerald-700 text-white'
          >
            {isProcessing || isLoading
              ? isEditing
                ? 'Updating...'
                : 'Adding...'
              : isEditing
              ? 'Update Bank Account'
              : 'Add Bank Account'}
          </Button>
          {onCancel && (
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isProcessing || isLoading}
              className='border-slate-300 text-slate-700 hover:bg-slate-100'
            >
              Cancel
            </Button>
          )}
        </div>

        {!isEditing && (
          <p className='text-xs text-slate-500 mt-4'>
            Your bank account information is securely encrypted and processed by Stripe. We never store your full account number.
          </p>
        )}
      </form>
    </Form>
  );
}

