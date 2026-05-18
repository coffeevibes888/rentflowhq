'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpDefaultValues } from '@/lib/constants';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signUpUser } from '@/lib/actions/user.actions';
import { useSearchParams, usePathname } from 'next/navigation';
import OAuthButtons from '@/components/auth/oauth-buttons';
import { Sparkles } from 'lucide-react';

// Reserved top-level routes that are NOT landlord subdomains. Kept in sync with
// `middleware.ts` so that `/sign-up` at the root domain resolves subdomain=""
// rather than thinking "sign-up" is a landlord slug.
const RESERVED_ROUTES = new Set([
  'admin', 'user', 'super-admin', 'onboarding', 'sign-in', 'sign-up',
  'verify-email', 'forgot-password', 'reset-password', 'unauthorized',
  'about', 'blog', 'contact', 'cart', 'checkout', 'products', 'product',
  'search', 'order', 'shipping-address', 'place-order', 'payment-method',
  'verify-payment-method', 'application', 'chat', 'agent', 'contractor',
  'employee', 'team', 'listings', 'marketplace', 'contractors', 'homeowner',
  'dispute-center', 'faq', 'docs',
]);

const SignUpForm = () => {
  const [data, action] = useActionState(signUpUser, {
    success: false,
    message: '',
  });

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const callbackUrl = searchParams.get('callbackUrl') || '/onboarding';

  // Derive subdomain from pathname when the sign-up page is mounted under
  // /[subdomain]/sign-up. Empty string means "root domain".
  const firstSegment = pathname?.split('/').filter(Boolean)[0] || '';
  const subdomain = firstSegment && !RESERVED_ROUTES.has(firstSegment) ? firstSegment : '';
  const subdomainPrefix = subdomain ? `/${subdomain}` : '';

  // Check if user is coming from a property application
  const fromProperty = searchParams.get('fromProperty') === 'true';
  const propertySlug = searchParams.get('propertySlug') || '';
  const applicationCallback = `${subdomainPrefix}/application?property=${encodeURIComponent(propertySlug)}`;
  
  // Check if user is coming from pricing page (skip onboarding flow)
  const plan = searchParams.get('plan') || '';
  const role = searchParams.get('role') || '';
  const skipOnboarding = searchParams.get('skipOnboarding') === 'true';

  // If the user is coming from a pricing/ad flow with role + plan, we can build
  // a subscription URL directly and skip the generic onboarding role picker.
  // skipOnboarding=true is forwarded so the subscription page finalizes role setup.
  const pricingCallback =
    plan || skipOnboarding
      ? (role === 'contractor'
          ? `/onboarding/contractor/subscription?plan=${plan || 'starter'}${skipOnboarding ? '&skipOnboarding=true' : ''}`
          : `/onboarding/landlord/subscription?plan=${plan || 'starter'}${skipOnboarding ? '&skipOnboarding=true' : ''}`)
      : null;
  
  // Referral tracking
  const referralCode = searchParams.get('ref') || '';

  // Beta code — pulled from `?code=` URL param. Auto-validates the code and
  // shows a green banner so the user never has to type or remember it.
  const urlBetaCode = (searchParams.get('code') || '').trim().toUpperCase();
  const [betaInfo, setBetaInfo] = useState<{
    code: string;
    audience: 'pm' | 'contractor';
    freeMonths: number;
    postFreeDiscountPercent: number;
    postFreeDiscountMonths: number;
    spotsRemaining: number;
  } | null>(null);
  const [betaError, setBetaError] = useState<string | null>(null);

  useEffect(() => {
    if (!urlBetaCode) return;
    (async () => {
      try {
        const res = await fetch(`/api/beta/validate?code=${encodeURIComponent(urlBetaCode)}`);
        const json = await res.json();
        if (!res.ok || !json.valid) {
          setBetaError(json.message ?? 'Invalid beta code');
          return;
        }
        setBetaInfo(json.program);
      } catch {
        setBetaError('Could not validate code. Try again.');
      }
    })();
  }, [urlBetaCode]);

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
      {/* Show beta code banner — supersedes other context messages */}
      {betaInfo && (
        <div className='rounded-lg bg-emerald-500/10 border border-emerald-400/40 p-4 mb-4'>
          <div className='flex items-start gap-3'>
            <Sparkles className='h-5 w-5 text-emerald-300 shrink-0 mt-0.5' />
            <div className='space-y-1'>
              <p className='text-sm font-bold text-emerald-50'>
                ✓ {betaInfo.code} unlocked
              </p>
              <p className='text-xs text-emerald-100/90'>
                {betaInfo.freeMonths} months free Enterprise · then{' '}
                {betaInfo.postFreeDiscountPercent}% off for{' '}
                {betaInfo.postFreeDiscountMonths} months. No credit card required.
              </p>
              <p className='text-[11px] text-emerald-200/80'>
                {betaInfo.spotsRemaining} spots left
              </p>
            </div>
          </div>
        </div>
      )}
      {betaError && !betaInfo && (
        <div className='rounded-lg bg-red-500/10 border border-red-400/40 p-4 mb-4'>
          <p className='text-sm text-red-100'>
            <strong>Invalid code:</strong> {betaError}
          </p>
        </div>
      )}

      {/* Show referral message if coming from referral link */}
      {referralCode && (
        <div className='rounded-lg bg-violet-500/10 border border-violet-400/30 p-4 mb-4'>
          <p className='text-sm text-violet-100'>
            🎉 <strong className='text-white'>Welcome!</strong> You were referred by a friend. You&apos;ll both get $50 credit after your first rent collection!
          </p>
        </div>
      )}

      {/* Show context message if coming from property application */}
      {fromProperty && (
        <div className='rounded-lg bg-violet-500/10 border border-violet-400/30 p-4 mb-4'>
          <p className='text-sm text-violet-100'>
            <strong className='text-white'>Almost there!</strong> Create an account to complete your rental application.
          </p>
        </div>
      )}

      {/* Show context message if coming from pricing page */}
      {plan && (
        <div className='rounded-lg bg-violet-500/10 border border-violet-400/30 p-4 mb-4'>
          <p className='text-sm text-violet-100'>
            <strong className='text-white'>Great choice!</strong> Create your account to review your plan selection.
          </p>
        </div>
      )}
      
      <OAuthButtons callbackUrl={
        fromProperty 
          ? applicationCallback
          : pricingCallback || callbackUrl
      } />
      
      <form action={action}>
        <input type='hidden' name='callbackUrl' value={
          fromProperty 
            ? applicationCallback
            : pricingCallback || callbackUrl
        } />
        {/* Pass property application params to the server action */}
        {fromProperty && (
          <>
            <input type='hidden' name='fromProperty' value='true' />
            <input type='hidden' name='propertySlug' value={propertySlug} />
            <input type='hidden' name='role' value='tenant' />
          </>
        )}
        {/* Pass role if coming from pricing page or ad landing page */}
        {(plan || skipOnboarding) && (
          <input type='hidden' name='role' value={role || 'landlord'} />
        )}
        {/* Pass referral code to the server action */}
        {referralCode && (
          <input type='hidden' name='referralCode' value={referralCode} />
        )}

        {/* Pass beta code to the server action when URL param was present
             and validated. We never let the user paste in an arbitrary code
             on this form — that's the /redeem flow for existing users. */}
        {betaInfo && (
          <input type='hidden' name='betaCode' value={betaInfo.code} />
        )}
        
        <div className='space-y-6'>
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
            <Label htmlFor='phoneNumber'>Phone number</Label>
            <Input
              id='phoneNumber'
              name='phoneNumber'
              type='tel'
              autoComplete='tel'
              defaultValue={signUpDefaultValues.phoneNumber}
              className='bg-white text-gray-900 border-gray-300'
              placeholder='(555) 123-4567'
              required
            />
            <p className='text-[11px] text-gray-400 mt-1'>
              For rent reminders, security alerts, and verification codes. Never sold.
            </p>
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
            <Link
              href={
                fromProperty && propertySlug
                  ? `${subdomainPrefix}/sign-in?fromProperty=true&propertySlug=${encodeURIComponent(propertySlug)}`
                  : `${subdomainPrefix}/sign-in`
              }
              target='_self'
              className='link'
            >
              Sign In
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;
