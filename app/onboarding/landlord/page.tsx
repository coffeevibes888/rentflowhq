import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { setUserRoleAndLandlordIntake } from '@/lib/actions/user.actions';

export default async function LandlordOnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Set the user role to landlord and create landlord record
  await setUserRoleAndLandlordIntake({
    role: 'landlord',
    useSubdomain: true,
  });

  // Redirect straight to subscription selection
  redirect('/onboarding/landlord/subscription');
}
