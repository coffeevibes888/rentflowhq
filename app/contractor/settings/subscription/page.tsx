import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SubscriptionSettingsClient } from './subscription-settings-client';
import { prisma } from '@/db/prisma';

export const metadata: Metadata = {
  title: 'Subscription Settings | Contractor Dashboard',
  description: 'Manage your subscription, view usage, and billing information',
};

export default async function SubscriptionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'contractor') {
    redirect('/');
  }

  // Get contractor profile with subscription info
  const contractor = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      usageTracking: {
        select: {
          activeJobsCount: true,
          invoicesThisMonth: true,
          totalCustomers: true,
          teamMembersCount: true,
          inventoryCount: true,
          equipmentCount: true,
          activeLeadsCount: true,
          lastResetDate: true,
        },
      },
    },
  });

  if (!contractor) {
    redirect('/onboarding/contractor');
  }

  return (
    <SubscriptionSettingsClient
      currentTier={contractor.subscriptionTier || 'starter'}
      subscriptionStatus={contractor.subscriptionStatus || 'active'}
      currentPeriodStart={contractor.currentPeriodStart}
      currentPeriodEnd={contractor.currentPeriodEnd}
      stripeCustomerId={contractor.stripeCustomerId}
      stripeSubscriptionId={contractor.stripeSubscriptionId}
      usage={contractor.usageTracking || {
        activeJobsCount: 0,
        invoicesThisMonth: 0,
        totalCustomers: 0,
        teamMembersCount: 0,
        inventoryCount: 0,
        equipmentCount: 0,
        activeLeadsCount: 0,
      }}
    />
  );
}
