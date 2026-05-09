import { redirect } from 'next/navigation';
import { auth } from '@/auth';

/**
 * Previously this page silently ran `setUserRoleAndLandlordIntake` on GET,
 * which minted a 14-day landlord trial (with dashboard access) for anyone
 * who navigated here — no email verification, no plan pick, no payment.
 *
 * The trial is now only created after the user explicitly confirms role +
 * picks a plan on the subscription selection page. This page just forwards
 * unauthenticated users to sign-in, and everyone else to the plan picker.
 */
export default async function LandlordOnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/onboarding/landlord/subscription');
  }

  redirect('/onboarding/landlord/subscription');
}
