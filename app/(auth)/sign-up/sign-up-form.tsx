'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpDefaultValues } from '@/lib/constants';
import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signUpUser } from '@/lib/actions/user.actions';
import { useSearchParams } from 'next/navigation';

const SignUpForm = () => {
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';

  const SignUpButton = () => {
    const { pending } = useFormStatus();

    return (
      <Button disabled={pending} className='w-full' variant='default'>
        {pending ? 'Submitting...' : 'Sign Up'}
      </Button>
    );
  };

  return (
    <form action={action}>
      <input type='hidden' name='callbackUrl' value={callbackUrl} />
      <div className='space-y-6'>
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>
            Tell us who you are
          </p>
          <div className='grid gap-3 sm:grid-cols-3 text-xs'>
            <label className='cursor-pointer'>
              <input
                type='radio'
                name='role'
                value='tenant'
                defaultChecked
                className='sr-only peer'
              />
              <div className='rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-center font-medium text-slate-900 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-900 transition-colors'>
                Tenant
              </div>
            </label>

            <label className='cursor-pointer'>
              <input
                type='radio'
                name='role'
                value='landlord'
                className='sr-only peer'
              />
              <div className='rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-center font-medium text-slate-900 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-900 transition-colors'>
                Landlord
              </div>
            </label>

            <label className='cursor-pointer'>
              <input
                type='radio'
                name='role'
                value='property_manager'
                className='sr-only peer'
              />
              <div className='rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-center font-medium text-slate-900 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-900 transition-colors'>
                Property manager
              </div>
            </label>
          </div>
        </div>

        <div>
          <Label htmlFor='email'>Name</Label>
          <Input
            id='name'
            name='name'
            type='text'
            autoComplete='name'
            defaultValue={signUpDefaultValues.name}
          />
        </div>
        <div>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            name='email'
            type='text'
            autoComplete='email'
            defaultValue={signUpDefaultValues.email}
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
            defaultValue={signUpDefaultValues.password}
          />
        </div>
        <div>
          <Label htmlFor='confirmPassword'>Confirm Password</Label>
          <Input
            id='confirmPassword'
            name='confirmPassword'
            type='password'
            required
            autoComplete='confirmPassword'
            defaultValue={signUpDefaultValues.confirmPassword}
          />
        </div>
        <div>
          <SignUpButton />
        </div>

        {data && !data.success && (
          <div className='text-center text-destructive'>{data.message}</div>
        )}

        <div className='text-sm text-center text-muted-foreground'>
          Already have an account?{' '}
          <Link href='/sign-in' target='_self' className='link'>
            Sign In
          </Link>
        </div>
      </div>
    </form>
  );
};

export default SignUpForm;
