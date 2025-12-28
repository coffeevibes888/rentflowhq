import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ContractorOnboardingClient from './contractor-onboarding-client';

export default async function ContractorOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect('/sign-in');
  }

  if (session.user.onboardingCompleted && session.user.role === 'contractor') {
    return redirect('/contractor/dashboard');
  }

  return <ContractorOnboardingClient />;
}
