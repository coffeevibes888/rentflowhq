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
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  incrementPhoneOtpAttempts,
} from '@/lib/actions/auth.actions';
import {
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
} from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader } from 'lucide-react';

type PhoneVerificationProps = {
  onPhoneVerified?: () => void;
};

export default function PhoneVerification({
  onPhoneVerified,
}: PhoneVerificationProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneForm = useForm<z.infer<typeof sendPhoneOtpSchema>>({
    resolver: zodResolver(sendPhoneOtpSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  const otpForm = useForm<z.infer<typeof verifyPhoneOtpSchema>>({
    resolver: zodResolver(verifyPhoneOtpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onPhoneSubmit = async (
    values: z.infer<typeof sendPhoneOtpSchema>
  ) => {
    if (!session?.user?.id) {
      toast({
        variant: 'destructive',
        description: 'User session not found',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await sendPhoneOtp(session.user.id, values.phoneNumber);

      if (result.success) {
        setPhoneNumber(values.phoneNumber);
        setStep('otp');
        toast({
          description: 'Verification code sent to your phone',
        });
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (values: z.infer<typeof verifyPhoneOtpSchema>) => {
    if (!session?.user?.id) {
      toast({
        variant: 'destructive',
        description: 'User session not found',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyPhoneOtp(session.user.id, values.otp);

      if (result.success) {
        toast({
          description: 'Phone number verified successfully!',
        });
        setStep('phone');
        phoneForm.reset();
        otpForm.reset();
        onPhoneVerified?.();
      } else {
        await incrementPhoneOtpAttempts(session.user.id, values.otp);
        toast({
          variant: 'destructive',
          description: result.message,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <div className='space-y-4 border rounded-lg p-6 bg-card'>
        <h3 className='text-lg font-semibold'>Add Phone Number</h3>
        <Form {...phoneForm}>
          <form
            onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
            className='space-y-4'
          >
            <FormField
              control={phoneForm.control}
              name='phoneNumber'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder='Phone number (e.g., +1 (555) 123-4567)'
                      className='input-field'
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='submit'
              className='w-full'
              disabled={loading}
            >
              {loading ? (
                <Loader className='w-4 h-4 animate-spin' />
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <div className='space-y-4 border rounded-lg p-6 bg-card'>
      <h3 className='text-lg font-semibold'>Verify Phone Number</h3>
      <p className='text-sm text-gray-600'>
        Enter the 6-digit code sent to {phoneNumber}
      </p>
      <Form {...otpForm}>
        <form
          onSubmit={otpForm.handleSubmit(onOtpSubmit)}
          className='space-y-4'
        >
          <FormField
            control={otpForm.control}
            name='otp'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder='000000'
                    className='input-field text-center tracking-widest'
                    maxLength={6}
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex gap-2'>
            <Button
              type='submit'
              className='flex-1'
              disabled={loading}
            >
              {loading ? (
                <Loader className='w-4 h-4 animate-spin' />
              ) : (
                'Verify Code'
              )}
            </Button>
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={() => {
                setStep('phone');
                otpForm.reset();
              }}
              disabled={loading}
            >
              Back
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
