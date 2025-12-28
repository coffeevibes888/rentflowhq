import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LandlordOnboardingClient from './landlord-onboarding-client';

export default async function LandlordOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect('/sign-in');
  }

  if (session.user.onboardingCompleted) {
    return redirect('/admin/dashboard');
  }

  return <LandlordOnboardingClient />;
}
