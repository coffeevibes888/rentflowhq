import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import SignUpForm from '@/app/(auth)/sign-up/sign-up-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

/**
 * Sign-up page for subdomains - primarily for rental applicants
 */
export default async function SubdomainSignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ fromProperty?: string; propertySlug?: string }>;
}) {
  const { subdomain } = await params;
  const { fromProperty, propertySlug } = await searchParams;
  
  const session = await auth();

  if (session?.user) {
    // If coming from property application and user is tenant, redirect to application
    if (fromProperty === 'true' && propertySlug && session.user?.role === 'tenant') {
      redirect(`/${subdomain}/application?property=${encodeURIComponent(propertySlug)}`);
    }
    // If onboarding not completed, go to onboarding
    if (!session.user.onboardingCompleted) {
      redirect('/onboarding');
    }
    // Otherwise redirect to home
    redirect('/');
  }

  // Get landlord information for branding
  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
  });

  const title = landlord ? `Apply at ${landlord.name}` : 'Create Account';
  const description = fromProperty === 'true'
    ? 'Create an account to complete your rental application.'
    : landlord
    ? `Create an account to apply for rentals at ${landlord.name}.`
    : 'Create your account to get started';

  return (
    <div className='w-full max-w-md mx-auto'>
      <Card>
        <CardHeader className='space-y-4'>
          <Link href={`/${subdomain}`} className='flex-center'>
            <Image
              src='/images/logo.svg'
              width={100}
              height={100}
              alt={`${APP_NAME} logo`}
              priority={true}
            />
          </Link>
          <CardTitle className='text-center'>{title}</CardTitle>
          <CardDescription className='text-center'>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <SignUpForm />
          
          <div className='text-sm text-center text-muted-foreground pt-2'>
            Already have an account?{' '}
            <Link 
              href={fromProperty === 'true' && propertySlug 
                ? `/${subdomain}/sign-in?fromProperty=true&propertySlug=${encodeURIComponent(propertySlug)}`
                : `/${subdomain}/sign-in`
              } 
              className='link'
            >
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
