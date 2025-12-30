import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ContractorOnboardingClient from './contractor-onboarding-client';

export const dynamic = 'force-dynamic';

export default async function ContractorOnboardingPage() {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error('Auth error in contractor onboarding:', error);
    return redirect('/sign-in?callbackUrl=/onboarding');
  }

  if (!session?.user) {
    return redirect('/sign-in?callbackUrl=/onboarding');
  }

  if (session.user.onboardingCompleted && session.user.role === 'contractor') {
    return redirect('/contractor/dashboard');
  }

  return <ContractorOnboardingClient />;
}
