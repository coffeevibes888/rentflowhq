import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import CredentialsSignInForm from '@/app/(auth)/sign-in/credentials-signin-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';

/**
 * Sign-in page for subdomains
 */
export default async function SubdomainSignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ fromProperty?: string; propertySlug?: string }>;
}) {
  const { subdomain } = await params;
  const { fromProperty, propertySlug } = await searchParams;
  
  const session = await auth();

  if (session) {
    // If coming from property application and user is tenant, redirect to application
    if (fromProperty === 'true' && propertySlug && session.user?.role === 'tenant') {
      redirect(`/${subdomain}/application?property=${encodeURIComponent(propertySlug)}`);
    }
    redirect('/');
  }

  // Get landlord information for branding
  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
  });

  const title = landlord ? `Sign in to ${landlord.name}` : 'Sign In';
  const description = fromProperty === 'true'
    ? 'Sign in or create an account to complete your rental application.'
    : landlord
    ? `Access your ${landlord.name} resident or landlord account.`
    : 'Sign in to your account';

  // Build callback URL for after sign-in
  const callbackUrl = fromProperty === 'true' && propertySlug
    ? `/${subdomain}/application?property=${encodeURIComponent(propertySlug)}`
    : '/';

  return (
    <div className='w-full max-w-md mx-auto'>
      <Card>
        <CardHeader className='space-y-4'>
          <Link href='/' className='flex-center'>
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
          {fromProperty === 'true' && (
            <div className='rounded-lg bg-blue-50 border border-blue-200 p-4 mb-4'>
              <p className='text-sm text-blue-800'>
                <strong>Applying for a rental?</strong> Sign in to continue your application, or create a new account below.
              </p>
            </div>
          )}
          <CredentialsSignInForm 
            callbackUrl={callbackUrl}
            fromProperty={fromProperty === 'true'}
            propertySlug={propertySlug}
            subdomain={subdomain}
          />
        </CardContent>
      </Card>
    </div>
  );
}
