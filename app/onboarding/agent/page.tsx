import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AgentOnboardingClient from './agent-onboarding-client';

export default async function AgentOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect('/sign-in');
  }

  if (session.user.onboardingCompleted && session.user.role === 'agent') {
    return redirect('/agent/dashboard');
  }

  return <AgentOnboardingClient />;
}
