import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import RoleSelectionClient from './role-selection-client';

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    return redirect('/sign-in');
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
      default:
        return redirect('/');
    }
  }

  return <RoleSelectionClient userName={session.user.name || 'there'} />;
}
