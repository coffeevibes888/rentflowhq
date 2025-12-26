'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInWithCredentials } from '@/lib/actions/user.actions';
import { useSearchParams } from 'next/navigation';
import OAuthButtons from '@/components/auth/oauth-buttons';

const CredentialsSignInForm = () => {
  const [data, action] = useActionState(signInWithCredentials, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const SignInButton = () => {
    const { pending } = useFormStatus();

    return (
      <Button disabled={pending} className='w-full' variant='default'>
        {pending ? 'Signing In...' : 'Sign In'}
      </Button>
    );
  };

  return (
    <div className='space-y-4'>
      <OAuthButtons callbackUrl={callbackUrl} />
      
      <form action={action}>
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        <div className='space-y-6'>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              required
              autoComplete='email'
              className='bg-white text-gray-900 border-gray-300'
            />
          </div>
          <div>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              name='password'
              type='password'
              required
              autoComplete='password'
              className='bg-white text-gray-900 border-gray-300'
            />
          </div>
          <div>
            <SignInButton />
          </div>

          {data && !data.success && (
            <div className='text-center text-destructive'>{data.message}</div>
          )}

          <div className='text-sm text-right'>
            <Link href='/forgot-password' className='link'>
              Forgot Password?
            </Link>
          </div>

          <div className='text-sm text-center text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <Link href='/sign-up' target='_self' className='link'>
              Sign Up
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CredentialsSignInForm;
