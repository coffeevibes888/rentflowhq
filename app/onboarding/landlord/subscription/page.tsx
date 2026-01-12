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
  searchParams: Promise<{ plan?: string; skipOnboarding?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const params = await searchParams;
  const skipOnboarding = params.skipOnboarding === 'true';

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

  return <SubscriptionSelectionClient userName={session.user.name || 'there'} />;
}
