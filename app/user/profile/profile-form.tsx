'use client';
import { useState, lazy, Suspense } from 'react';
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
import StripeProvider from './stripe-provider';

const SavedPaymentMethods = lazy(() => import('./saved-payment-methods'));

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
    <div className='space-y-8'>
      <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
          <div className='flex flex-col items-center'>
            <h3 className='text-xl font-semibold text-white mb-6'>Avatar</h3>
            <AvatarUpload
              currentImage={session?.user?.image}
              userName={session?.user?.name}
            />
          </div>

          <div className='lg:col-span-2'>
            <h3 className='text-xl font-semibold text-white mb-6'>Basic Information</h3>
            <Form {...form}>
              <form
                className='space-y-6'
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            disabled
                            placeholder='Email'
                            className='input-field bg-white/5 border-white/20 text-white placeholder:text-gray-400'
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
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder='Name'
                            className='input-field bg-white/5 border-white/20 text-white placeholder:text-gray-400'
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
                  className='w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white'
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Submitting...' : 'Update Profile'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'>
          <h3 className='text-xl font-semibold text-white mb-6'>Addresses</h3>
          <AddressForm 
            initialAddress={userAddress}
            initialShippingAddress={userShippingAddress}
            initialBillingAddress={userBillingAddress}
          />
        </div>

        <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'>
          <h3 className='text-xl font-semibold text-white mb-6'>Phone Number</h3>
          {session?.user?.phoneNumber ? (
            <div className='space-y-4'>
              <div className='p-4 bg-white/5 border border-white/20 rounded-lg'>
                <p className='text-sm text-gray-300'>Phone Number on File</p>
                <p className='text-lg font-semibold text-white mt-2'>{session.user.phoneNumber}</p>
                {session?.user?.phoneVerified && (
                  <div className='flex items-center gap-2 mt-3'>
                    <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                    <p className='text-xs font-medium text-green-300'>Verified</p>
                  </div>
                )}
              </div>
              <div className='flex gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  className='flex-1 border-white/20 text-white hover:bg-white/10'
                  onClick={() => setShowPhoneVerification(!showPhoneVerification)}
                >
                  {!session.user.phoneVerified ? 'Verify Number' : 'Update Number'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type='button'
              variant='outline'
              className='w-full border-white/20 text-white hover:bg-white/10'
              onClick={() => setShowPhoneVerification(!showPhoneVerification)}
            >
              {showPhoneVerification ? 'Cancel' : 'Add Phone Number'}
            </Button>
          )}

          {showPhoneVerification && (
            <div className='mt-6 p-4 bg-white/5 border border-white/20 rounded-lg'>
              <PhoneVerification
                mode={session?.user?.phoneNumber ? 'verify' : 'add'}
                onPhoneVerified={() => {
                  setShowPhoneVerification(false);
                  window.location.reload();
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'>
        <h3 className='text-xl font-semibold text-white mb-6'>Payment Methods</h3>
        <Suspense fallback={
          <div className='text-center text-gray-400 py-8'>
            <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500'></div>
            <p className='mt-3 text-sm'>Loading payment methods...</p>
          </div>
        }>
          <StripeProvider>
            <SavedPaymentMethods />
          </StripeProvider>
        </Suspense>
      </div>
    </div>
  );
};

export default ProfileForm;



