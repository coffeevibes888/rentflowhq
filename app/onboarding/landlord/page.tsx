import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LandlordOnboardingClient from './landlord-onboarding-client';

export default async function LandlordOnboardingPage() {
  let session;
  try {
    session = await auth();
  } catch (error) {
    // JWT session error can happen during session establishment
    // Redirect to sign-in to re-establish the session
    console.error('Auth error in landlord onboarding:', error);
    return redirect('/sign-in?callbackUrl=/onboarding');
  }

  if (!session?.user) {
    return redirect('/sign-in?callbackUrl=/onboarding');
  }

  if (session.user.onboardingCompleted) {
    return redirect('/admin/dashboard');
  }

  return <LandlordOnboardingClient />;
}
