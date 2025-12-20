import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getTeamMembers } from '@/lib/actions/team.actions';
import { getCurrentLandlordSubscription } from '@/lib/actions/subscription.actions';
import { TeamDashboard } from './team-dashboard';
import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';
import { auth } from '@/auth';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { TeamChat } from '@/components/team/team-chat';

export const metadata: Metadata = {
  title: 'Team Management',
};

export default async function TeamPage() {
  await requireAdmin();

  const session = await auth();
  
  const subscriptionData = await getCurrentLandlordSubscription();
  const teamData = await getTeamMembers();
  const landlordResult = await getOrCreateCurrentLandlord();

  // Check if team feature is locked
  const hasTeamAccess = subscriptionData.success && 
    subscriptionData.features?.teamManagement === true;

  if (!hasTeamAccess) {
    return (
      <main className="w-full px-4 py-10 md:px-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 text-center">
            <Lock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white mb-2">Team Management</h1>
            <p className="text-slate-300 mb-6">
              Team management is available on the Pro plan. Upgrade to invite team members, 
              assign roles, and collaborate on property management.
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

  return (
    <main className="w-full px-4 py-10 md:px-0">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-semibold text-white">Team</h1>
            <p className="text-sm text-slate-300/80">
              Invite team members to help manage your properties.
            </p>
          </div>
        </div>

        <TeamDashboard 
          members={teamData.success && teamData.members ? teamData.members : []} 
        />

        {subscriptionData.features?.teamCommunications && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Team Chat</h2>
              <p className="text-sm text-slate-400">Communicate with your team in real-time</p>
            </div>
            <TeamChat
              currentUser={{
                id: session?.user?.id || '',
                name: session?.user?.name || 'User',
                email: session?.user?.email || '',
                image: session?.user?.image || undefined,
              }}
              landlordId={landlordResult.success ? landlordResult.landlord.id : ''}
              isFullPage={false}
            />
          </div>
        )}
      </div>
    </main>
  );
}
