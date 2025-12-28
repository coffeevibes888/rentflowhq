import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ExistingTenantOnboardingClient from './existing-tenant-onboarding-client';

export default async function ExistingTenantOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect('/sign-in');
  }

  if (session.user.onboardingCompleted) {
    return redirect('/user/dashboard');
  }

  return <ExistingTenantOnboardingClient />;
}
