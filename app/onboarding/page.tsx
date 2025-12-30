import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import RoleSelectionClient from './role-selection-client';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error('Auth error in onboarding:', error);
    return redirect('/sign-in?callbackUrl=/onboarding');
  }

  if (!session?.user) {
    return redirect('/sign-in?callbackUrl=/onboarding');
  }

  // If onboarding is already completed, redirect to appropriate dashboard
  if (session.user.onboardingCompleted) {
    switch (session.user.role) {
      case 'landlord':
      case 'property_manager':
        return redirect('/admin/dashboard');
      case 'tenant':
        return redirect('/user/dashboard');
      case 'agent':
        return redirect('/agent/dashboard');
      case 'contractor':
        return redirect('/contractor/dashboard');
      case 'homeowner':
        return redirect('/homeowner/dashboard');
      default:
        return redirect('/');
    }
  }

  return <RoleSelectionClient userName={session.user.name || 'there'} />;
}
