import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import TenantOnboardingClient from './tenant-onboarding-client';

export default async function TenantOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect('/sign-in');
  }

  if (session.user.onboardingCompleted) {
    return redirect('/user/dashboard');
  }

  return <TenantOnboardingClient />;
}
