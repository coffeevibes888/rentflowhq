'use client';

import { useState } from 'react';
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
import { 
  updateShippingAddress, 
  updateBillingAddress 
} from '@/lib/actions/user.actions';
import { updateAddressSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type AddressFormProps = {
  initialAddress?: Partial<z.infer<typeof updateAddressSchema>> | null;
  initialShippingAddress?: Partial<z.infer<typeof updateAddressSchema>> | null;
  initialBillingAddress?: Partial<z.infer<typeof updateAddressSchema>> | null;
};

export default function AddressForm({ 
  initialAddress, 
  initialShippingAddress,
  initialBillingAddress 
}: AddressFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [addressType, setAddressType] = useState<'shipping' | 'billing'>('shipping');
  const { toast } = useToast();

  const shippingForm = useForm<z.infer<typeof updateAddressSchema>>({
    resolver: zodResolver(updateAddressSchema),
    defaultValues: initialShippingAddress || {
      fullName: '',
      streetAddress: '',
      city: '',
      postalCode: '',
      country: '',
    },
  });

  const billingForm = useForm<z.infer<typeof updateAddressSchema>>({
    resolver: zodResolver(updateAddressSchema),
    defaultValues: initialBillingAddress || {
      fullName: '',
      streetAddress: '',
      city: '',
      postalCode: '',
      country: '',
    },
  });

  const onShippingSubmit = async (values: z.infer<typeof updateAddressSchema>): Promise<void> => {
    const res = await updateShippingAddress(values);

    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      });
      return;
    }

    toast({
      description: res.message,
    });
  };

  const onBillingSubmit = async (values: z.infer<typeof updateAddressSchema>): Promise<void> => {
    const res = await updateBillingAddress(values);

    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      });
      return;
    }

    toast({
      description: res.message,
    });
  };

  const renderAddressDisplay = (address: Partial<z.infer<typeof updateAddressSchema>> | undefined | null, title: string) => {
    if (!address) return null;
    
    return (
      <div className='space-y-4'>
        <h4 className='font-semibold'>{title}</h4>
        <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
          <p className='text-sm text-gray-600'>
            <span className='font-medium'>{address.fullName}</span>
          </p>
          <p className='text-sm text-gray-600'>{address.streetAddress}</p>
          <p className='text-sm text-gray-600'>
            {address.city}, {address.postalCode}
          </p>
          <p className='text-sm text-gray-600'>{address.country}</p>
        </div>
      </div>
    );
  };

  const renderAddressForm = (
    form: ReturnType<typeof useForm<z.infer<typeof updateAddressSchema>>>,
    onSubmitFn: (values: z.infer<typeof updateAddressSchema>) => Promise<void>,
    title: string
  ) => {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitFn)} className='space-y-4'>
          <FormField
            control={form.control}
            name='fullName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder='Full Name' className='input-field' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='streetAddress'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Street Address'
                    className='input-field'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='city'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder='City' className='input-field' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='postalCode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Postal Code'
                      className='input-field'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name='country'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder='Country' className='input-field' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type='submit'
            className='w-full'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Saving...' : `Save ${title}`}
          </Button>
        </form>
      </Form>
    );
  };

  if (!isEditing && (initialAddress || initialShippingAddress || initialBillingAddress)) {
    return (
      <div className='space-y-4'>
        <div className='flex gap-2 mb-4'>
          <Button
            type='button'
            variant={addressType === 'shipping' ? 'default' : 'outline'}
            onClick={() => setAddressType('shipping')}
          >
            Shipping Address
          </Button>
          <Button
            type='button'
            variant={addressType === 'billing' ? 'default' : 'outline'}
            onClick={() => setAddressType('billing')}
          >
            Billing Address
          </Button>
        </div>

        <div className='space-y-4'>
          {addressType === 'shipping' && (
            <>
              {initialShippingAddress ? (
                renderAddressDisplay(initialShippingAddress, 'Shipping Address')
              ) : (
                <div className='p-4 text-center text-gray-500 border border-dashed rounded-lg'>
                  No shipping address saved
                </div>
              )}
              <Button
                type='button'
                variant='outline'
                className='w-full'
                onClick={() => {
                  setAddressType('shipping');
                  setIsEditing(true);
                }}
              >
                {initialShippingAddress ? 'Edit' : 'Add'} Shipping Address
              </Button>
            </>
          )}

          {addressType === 'billing' && (
            <>
              {initialBillingAddress ? (
                renderAddressDisplay(initialBillingAddress, 'Billing Address')
              ) : (
                <div className='p-4 text-center text-gray-500 border border-dashed rounded-lg'>
                  No billing address saved
                </div>
              )}
              <Button
                type='button'
                variant='outline'
                className='w-full'
                onClick={() => {
                  setAddressType('billing');
                  setIsEditing(true);
                }}
              >
                {initialBillingAddress ? 'Edit' : 'Add'} Billing Address
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className='space-y-4 border rounded-lg p-6 bg-card'>
        <h3 className='text-lg font-semibold'>
          {addressType === 'shipping' ? 'Shipping' : 'Billing'} Address
        </h3>
        {addressType === 'shipping'
          ? renderAddressForm(shippingForm, onShippingSubmit, 'Shipping Address')
          : renderAddressForm(billingForm, onBillingSubmit, 'Billing Address')}
        <Button
          type='button'
          variant='outline'
          className='w-full'
          onClick={() => {
            setIsEditing(false);
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-4 border rounded-lg p-6 bg-card'>
      <h3 className='text-lg font-semibold'>Add Addresses</h3>
      <Button
        type='button'
        variant='outline'
        onClick={() => {
          setAddressType('shipping');
          setIsEditing(true);
        }}
      >
        Add Shipping Address
      </Button>
      <Button
        type='button'
        variant='outline'
        onClick={() => {
          setAddressType('billing');
          setIsEditing(true);
        }}
      >
        Add Billing Address
      </Button>
    </div>
  );
}
