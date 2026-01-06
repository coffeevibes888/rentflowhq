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
      case 'admin':
        return redirect('/admin/overview');
      case 'super_admin':
        return redirect('/super-admin');
      case 'tenant':
        return redirect('/user/dashboard');
      case 'agent':
        return redirect('/agent/dashboard');
      case 'contractor':
        return redirect('/contractor/dashboard');
      case 'homeowner':
        return redirect('/homeowner/dashboard');
      default:
        // All users go to user dashboard by default, never to homepage
        return redirect('/user/dashboard');
    }
  }

  return <RoleSelectionClient userName={session.user.name || 'there'} />;
}
