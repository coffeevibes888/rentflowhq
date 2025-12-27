import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { normalizeTier } from '@/lib/config/subscription-tiers';
import { redirect } from 'next/navigation';
import TeamOperationsPage from '@/components/admin/team-operations-page';

export const metadata: Metadata = {
  title: 'Team Operations',
};

export default async function TeamOperationsRoute() {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();
  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const tier = normalizeTier(landlordResult.landlord.subscriptionTier);
  
  // Enterprise tier gate
  if (tier !== 'enterprise') {
    redirect('/admin/settings/subscription?upgrade=enterprise&feature=team-operations');
  }

  return <TeamOperationsPage />;
}
