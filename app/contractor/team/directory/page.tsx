import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';
import { ContractorTeamDirectoryPage } from '@/components/contractor/team-pages/team-directory-page';

export const metadata: Metadata = { title: 'Team Directory' };

export default async function DirectoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const profile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, subscriptionTier: true },
  });
  if (!profile) redirect('/onboarding/contractor');

  const tier = profile.subscriptionTier || 'starter';
  const hasAccess = tier === 'pro' || tier === 'enterprise';

  if (!hasAccess) {
    return (
      <main className="w-full px-4 py-10 md:px-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 text-center">
            <Lock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white mb-2">Team Directory</h1>
            <p className="text-slate-300 mb-6">Team management is available on the Pro plan.</p>
            <Link href="/contractor/settings/subscription" className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-full font-semibold transition-colors">
              <Zap className="h-5 w-5" /> Upgrade to Pro
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Fetch team members
  const teamMembers: any[] = [];

  return (
    <main className="w-full pb-8">
      <ContractorTeamDirectoryPage
        members={teamMembers}
        isEnterprise={tier === 'enterprise'}
        canManageTeam={true}
        currentUserRole="owner"
      />
    </main>
  );
}
