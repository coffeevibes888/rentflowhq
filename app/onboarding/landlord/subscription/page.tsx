import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import SubscriptionSelectionClient from './subscription-selection-client';

export const metadata: Metadata = {
  title: 'Choose Your Plan | Property Flow HQ',
  description: 'Select the perfect plan for your property management needs',
};

export default async function LandlordSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; skipOnboarding?: string; canceled?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const params = await searchParams;
  const skipOnboarding = params.skipOnboarding === 'true';
  const canceledCheckout = params.canceled === 'true';

  // If coming from pricing page flow, ensure landlord record exists and user is set up
  if (skipOnboarding) {
    // Update user role to landlord if not already
    if (session.user.role !== 'landlord' && session.user.role !== 'admin' && session.user.role !== 'property_manager') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          role: 'landlord',
          onboardingCompleted: true,
        },
      });
    }
    
    // Create landlord record
    await getOrCreateCurrentLandlord();
  }

  // Check if user already has an active subscription - redirect to dashboard
  // UNLESS they just canceled checkout (they need to select a plan)
  if (!canceledCheckout) {
    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
      select: {
        id: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        subscription: {
          select: {
            status: true,
            stripeSubscriptionId: true,
          },
        },
      },
    });

    if (landlord) {
      const hasActiveSubscription = 
        landlord.stripeSubscriptionId || 
        landlord.subscription?.stripeSubscriptionId ||
        landlord.subscriptionStatus === 'trialing' ||
        landlord.subscriptionStatus === 'active' ||
        landlord.subscription?.status === 'trialing' ||
        landlord.subscription?.status === 'active';

      if (hasActiveSubscription) {
        redirect('/admin/overview');
      }

      // If they have a Stripe customer ID but subscription is incomplete,
      // the webhook may still be processing - redirect to dashboard to let it sync
      if (landlord.stripeCustomerId && landlord.subscriptionStatus === 'incomplete') {
        // Give the webhook a chance to process by redirecting to admin
        // The admin layout will allow access for incomplete subscriptions with a customer ID
        redirect('/admin/onboarding?subscription=pending');
      }
    }
  }

  return <SubscriptionSelectionClient userName={session.user.name || 'there'} />;
}
