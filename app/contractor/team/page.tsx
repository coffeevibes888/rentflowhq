import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { TeamHub } from '@/components/contractor/team-hub';

export const metadata: Metadata = {
  title: 'Team Hub',
};

export default async function ContractorTeamPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'contractor') {
    return redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      teamMembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!contractorProfile) {
    return redirect('/contractor/profile');
  }

  // Get subscription tier (contractors use same subscription system)
  const tier = contractorProfile.subscriptionTier || 'starter';

  return (
    <main className="w-full pb-8">
      <TeamHub
        currentUser={{
          id: session.user.id,
          name: session.user.name || 'User',
          email: session.user.email || '',
          image: session.user.image || undefined,
        }}
        contractorId={contractorProfile.id}
        teamMembers={contractorProfile.teamMembers}
        subscriptionTier={tier as 'starter' | 'pro' | 'enterprise'}
      />
    </main>
  );
}
