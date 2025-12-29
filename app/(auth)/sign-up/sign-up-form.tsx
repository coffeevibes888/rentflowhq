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
import OAuthButtons from '@/components/auth/oauth-buttons';
import { Home, Building2, Wrench, User } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'homeowner', label: 'Homeowner', icon: Home, description: 'Hire contractors for your home' },
  { value: 'landlord', label: 'Landlord / PM', icon: Building2, description: 'Manage rental properties' },
  { value: 'contractor', label: 'Contractor', icon: Wrench, description: 'Offer your services' },
  { value: 'user', label: 'Just Browsing', icon: User, description: 'Looking for a rental' },
];

const SignUpForm = () => {
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/onboarding';
  const preselectedRole = searchParams.get('role') || '';

  const SignUpButton = () => {
    const { pending } = useFormStatus();

    return (
      <Button disabled={pending} className='w-full' variant='default'>
        {pending ? 'Creating account...' : 'Create Account'}
      </Button>
    );
  };

  return (
    <div className='space-y-4'>
      <OAuthButtons callbackUrl={callbackUrl} />
      
      <form action={action}>
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
        
        <div className='space-y-6'>
          {/* Role Selection - only show if role not preselected */}
          {!preselectedRole && (
            <div>
              <Label className="mb-3 block">I am a...</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className="relative flex flex-col items-center p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        defaultChecked={option.value === 'user'}
                        className="sr-only"
                      />
                      <Icon className="h-5 w-5 text-slate-600 mb-1" />
                      <span className="text-sm font-medium text-slate-900">{option.label}</span>
                      <span className="text-xs text-slate-500 text-center">{option.description}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Hidden role if preselected */}
          {preselectedRole && (
            <input type='hidden' name='role' value={preselectedRole} />
          )}
          
          <div>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              name='name'
              type='text'
              autoComplete='name'
              defaultValue={signUpDefaultValues.name}
              className='bg-white text-gray-900 border-gray-300'
              placeholder='Your full name'
            />
          </div>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              autoComplete='email'
              defaultValue={signUpDefaultValues.email}
              className='bg-white text-gray-900 border-gray-300'
              placeholder='you@example.com'
            />
          </div>
          <div>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              name='password'
              type='password'
              required
              autoComplete='new-password'
              defaultValue={signUpDefaultValues.password}
              className='bg-white text-gray-900 border-gray-300'
              placeholder='Create a password'
            />
          </div>
          <div>
            <Label htmlFor='confirmPassword'>Confirm Password</Label>
            <Input
              id='confirmPassword'
              name='confirmPassword'
              type='password'
              required
              autoComplete='new-password'
              defaultValue={signUpDefaultValues.confirmPassword}
              className='bg-white text-gray-900 border-gray-300'
              placeholder='Confirm your password'
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
    </div>
  );
};

export default SignUpForm;
