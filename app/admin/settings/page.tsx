import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { LandlordSettingsClient } from '@/components/admin/settings/landlord-settings-client';
import { getCurrentLandlordSubscription } from '@/lib/actions/subscription.actions';

export const metadata: Metadata = {
  title: 'Settings | Property Management',
};

const AdminSettingsPage = async () => {
  await requireAdmin();

  const [landlordResult, subscriptionResult] = await Promise.all([
    getOrCreateCurrentLandlord(),
    getCurrentLandlordSubscription(),
  ]);

  const landlord = landlordResult.success ? landlordResult.landlord : null;
  const isPro = subscriptionResult.success && 
    (subscriptionResult.currentTier === 'pro' || subscriptionResult.currentTier === 'enterprise');

  if (!landlord) {
    return (
      <main className="w-full space-y-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-slate-400">Unable to load settings. Please try again.</p>
      </main>
    );
  }

  return (
    <main className="w-full space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-white">Settings</h1>
        <p className="text-[10px] sm:text-xs text-slate-400">
          Manage your profile, notifications, fees, and get help
        </p>
      </div>

      <LandlordSettingsClient
        landlord={{
          id: landlord.id,
          name: landlord.name,
          companyName: landlord.companyName,
          companyEmail: landlord.companyEmail,
          companyPhone: landlord.companyPhone,
          companyAddress: landlord.companyAddress,
          logoUrl: landlord.logoUrl,
          aboutPhoto: landlord.aboutPhoto,
        }}
        isPro={isPro}
      />
    </main>
  );
};

export default AdminSettingsPage;
