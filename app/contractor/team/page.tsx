import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';
import { TeamHub } from '@/components/contractor/team-hub';

export const metadata: Metadata = {
  title: 'Team Hub',
};

export default async function TeamHubPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { 
      id: true, 
      businessName: true,
      subscriptionTier: true,
    },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  // Fetch team members (you'll need to implement this based on your contractor team structure)
  // For now, using empty array - replace with actual team fetch logic
  const teamMembers: any[] = [];

  // Determine subscription tier
  const tier = contractorProfile.subscriptionTier || 'starter';

  // Check if team feature is available
  const hasTeamAccess = tier === 'pro' || tier === 'enterprise';

  if (!hasTeamAccess) {
    return (
      <main className="w-full px-4 py-10 md:px-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 text-center">
            <Lock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white mb-2">Team Hub</h1>
            <p className="text-slate-300 mb-6">
              Team management is available on the Pro plan. Upgrade to invite team members, 
              communicate with your team, and collaborate on projects.
            </p>
            <Link
              href="/contractor/settings/subscription"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              <Zap className="h-5 w-5" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Get current user's team role (implement based on your contractor team structure)
  const currentUserRole = 'owner'; // Default to owner for contractor profile owner
  const canManageTeam = true; // Owner can always manage team

  return (
    <main className="w-full pb-8">
      <TeamHub
        currentUser={{
          id: session?.user?.id || '',
          name: session?.user?.name || 'User',
          email: session?.user?.email || '',
          image: session?.user?.image || undefined,
        }}
        contractorId={contractorProfile.id}
        teamMembers={teamMembers}
        subscriptionTier={tier as 'starter' | 'pro' | 'enterprise'}
        currentUserRole={currentUserRole}
        canManageTeam={canManageTeam}
        features={{
          teamManagement: hasTeamAccess,
          teamCommunications: hasTeamAccess,
          teamOperations: tier === 'enterprise',
        }}
      />
    </main>
  );
}
