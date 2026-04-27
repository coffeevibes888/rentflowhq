import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/db/prisma';
import ContractorApiClient from './api-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'API & Webhooks | Contractor Dashboard',
};

export default async function ContractorApiPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  if (session.user.role !== 'contractor') redirect('/');

  const profile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      subscriptionTier: true,
      apiKeys: {
        where: { isActive: true },
        select: {
          id: true, name: true, keyPrefix: true, scopes: true,
          lastUsedAt: true, expiresAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      webhookEndpoints: {
        select: {
          id: true, url: true, description: true, events: true,
          isActive: true, failureCount: true, lastSuccessAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!profile) redirect('/onboarding/contractor');

  const isEnterprise = profile.subscriptionTier === 'enterprise';

  return (
    <ContractorApiClient
      isEnterprise={isEnterprise}
      apiKeys={profile.apiKeys}
      webhooks={profile.webhookEndpoints}
    />
  );
}
