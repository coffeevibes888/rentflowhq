'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/lib/actions/user.actions';
import { updateProfileSchema } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import PhoneVerification from './phone-verification';
import AvatarUpload from './avatar-upload';
import AddressForm from './address-form';
import SavedPaymentMethods from './saved-payment-methods';
import StripeProvider from './stripe-provider';

const ProfileForm = () => {
  const { data: session, update } = useSession();
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  const form = useForm<z.infer<typeof updateProfileSchema>>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user?.name ?? '',
      email: session?.user?.email ?? '',
    },
  });

  const { toast } = useToast();

  const onSubmit = async (values: z.infer<typeof updateProfileSchema>) => {
    const res = await updateProfile(values);

    if (!res.success) {
      return toast({
        variant: 'destructive',
        description: res.message,
      });
    }

    const newSession = {
      ...session,
      user: {
        ...session?.user,
        name: values.name,
      },
    };

    await update(newSession);

    toast({
      description: res.message,
    });
  };

  interface Address {
    fullName?: string;
    streetAddress?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  }

  const userAddress = session?.user?.address as Address | undefined;
  const userShippingAddress = session?.user?.shippingAddress as Address | undefined;
  const userBillingAddress = session?.user?.billingAddress as Address | undefined;

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold mb-6'>Profile Settings</h2>
        
        <div className='border rounded-lg p-6 bg-card space-y-6'>
          <div>
            <h3 className='text-lg font-semibold mb-4'>Avatar</h3>
            <AvatarUpload
              currentImage={session?.user?.image}
              userName={session?.user?.name}
            />
          </div>

          <div className='border-t pt-6'>
            <h3 className='text-lg font-semibold mb-4'>Basic Information</h3>
            <Form {...form}>
              <form
                className='flex flex-col gap-5'
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className='flex flex-col gap-5'>
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormControl>
                          <Input
                            disabled
                            placeholder='Email'
                            className='input-field'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem className='w-full'>
                        <FormControl>
                          <Input
                            placeholder='Name'
                            className='input-field'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type='submit'
                  size='lg'
                  className='button col-span-2 w-full'
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Submitting...' : 'Update Profile'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='border rounded-lg p-6 bg-card'>
          <h3 className='text-lg font-semibold mb-4'>Addresses</h3>
          <AddressForm 
            initialAddress={userAddress}
            initialShippingAddress={userShippingAddress}
            initialBillingAddress={userBillingAddress}
          />
        </div>

        <div className='border rounded-lg p-6 bg-card'>
          <h3 className='text-lg font-semibold mb-4'>Phone Number</h3>
          {session?.user?.phoneVerified ? (
            <div className='space-y-4'>
              <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                <p className='text-sm font-medium text-green-800'>
                  ✓ Phone Verified: {session.user.phoneNumber}
                </p>
              </div>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowPhoneVerification(!showPhoneVerification)}
              >
                {showPhoneVerification ? 'Hide' : 'Update Phone Number'}
              </Button>
            </div>
          ) : (
            <Button
              type='button'
              variant='outline'
              onClick={() => setShowPhoneVerification(!showPhoneVerification)}
            >
              {showPhoneVerification ? 'Cancel' : 'Add Phone Number'}
            </Button>
          )}

          {showPhoneVerification && (
            <div className='mt-4'>
              <PhoneVerification
                onPhoneVerified={() => {
                  setShowPhoneVerification(false);
                  window.location.reload();
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className='border rounded-lg p-6 bg-card'>
        <StripeProvider>
          <SavedPaymentMethods />
        </StripeProvider>
      </div>
    </div>
  );
};

export default ProfileForm;
