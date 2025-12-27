import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getTeamMembers } from '@/lib/actions/team.actions';
import { getCurrentLandlordSubscription } from '@/lib/actions/subscription.actions';
import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';
import { auth } from '@/auth';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { TeamHub } from '@/components/admin/team-hub';
import { normalizeTier } from '@/lib/config/subscription-tiers';

export const metadata: Metadata = {
  title: 'Team Hub',
};

export default async function TeamPage() {
  await requireAdmin();

  const session = await auth();
  
  const [subscriptionData, teamData, landlordResult] = await Promise.all([
    getCurrentLandlordSubscription(),
    getTeamMembers(),
    getOrCreateCurrentLandlord(),
  ]);

  // Check if team feature is locked
  const hasTeamAccess = subscriptionData.success && 
    subscriptionData.features?.teamManagement === true;

  if (!hasTeamAccess) {
    return (
      <main className="w-full px-4 py-10 md:px-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 text-center">
            <Lock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white mb-2">Team Hub</h1>
            <p className="text-slate-300 mb-6">
              Team management is available on the Pro plan. Upgrade to invite team members, 
              communicate with your team, and collaborate on property management.
            </p>
            <Link
              href="/admin/settings/subscription"
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

  // Determine subscription tier
  const tier = landlordResult.success 
    ? normalizeTier(landlordResult.landlord.subscriptionTier)
    : 'free';

  return (
    <main className="w-full min-h-[600px] pb-8">
      <TeamHub
        currentUser={{
          id: session?.user?.id || '',
          name: session?.user?.name || 'User',
          email: session?.user?.email || '',
          image: session?.user?.image || undefined,
        }}
        landlordId={landlordResult.success ? landlordResult.landlord.id : ''}
        teamMembers={teamData.success && teamData.members ? teamData.members : []}
        subscriptionTier={tier as 'free' | 'pro' | 'enterprise'}
        features={{
          teamManagement: subscriptionData.features?.teamManagement,
          teamCommunications: subscriptionData.features?.teamCommunications,
          teamOperations: tier === 'enterprise',
        }}
      />
    </main>
  );
}
