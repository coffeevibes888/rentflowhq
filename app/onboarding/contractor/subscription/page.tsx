import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import ContractorSubscriptionClient from './contractor-subscription-client';

export const metadata: Metadata = {
  title: 'Choose Your Plan | RentFlowHQ',
  description: 'Select the perfect plan for your contracting business',
};

export default async function ContractorSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; canceled?: string; subscription?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const params = await searchParams;
  const canceledCheckout = params.canceled === 'true';
  const subscriptionSuccess = params.subscription === 'success';

  // If already has active subscription / in trial, go straight to dashboard
  if (!canceledCheckout) {
    const profile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        trialStatus: true,
      },
    });

    if (profile) {
      // Check for active subscription or trial
      const hasActiveSubscription =
        !!profile.stripeSubscriptionId || 
        profile.subscriptionStatus === 'active' ||
        profile.subscriptionStatus === 'trialing' ||
        profile.trialStatus === 'trialing';

      if (hasActiveSubscription) {
        redirect('/contractor/dashboard');
      }

      // If subscription just completed checkout, also redirect
      if (subscriptionSuccess && profile.stripeSubscriptionId) {
        redirect('/contractor/dashboard');
      }
    }
  }

  return <ContractorSubscriptionClient userName={session.user.name || 'there'} />;
}
