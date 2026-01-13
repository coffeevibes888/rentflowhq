import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { LandlordSettingsClient } from '@/components/admin/settings/landlord-settings-client';
import { getCurrentLandlordSubscription } from '@/lib/actions/subscription.actions';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export const metadata: Metadata = {
  title: 'Settings | Property Management',
};

interface AdminSettingsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

const AdminSettingsPage = async ({ searchParams }: AdminSettingsPageProps) => {
  await requireAdmin();
  const session = await auth();
  const params = await searchParams;
  const initialTab = params.tab || 'profile';

  const [landlordResult, subscriptionResult] = await Promise.all([
    getOrCreateCurrentLandlord(),
    getCurrentLandlordSubscription(),
  ]);

  const landlord = landlordResult.success ? landlordResult.landlord : null;
  const isPro = subscriptionResult.success && 
    (subscriptionResult.currentTier === 'pro' || subscriptionResult.currentTier === 'enterprise');
  const isEnterprise = subscriptionResult.success && subscriptionResult.currentTier === 'enterprise';

  // Get user's 2FA status
  let twoFactorEnabled = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    });
    twoFactorEnabled = user?.twoFactorEnabled ?? false;
  }

  if (!landlord) {
    return (
      <main className="w-full space-y-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-black">Unable to load settings. Please try again.</p>
      </main>
    );
  }

  return (
    <main className="w-full space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-white">Settings</h1>
        <p className="text-[10px] sm:text-xs text-black">
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
        isEnterprise={isEnterprise}
        twoFactorEnabled={twoFactorEnabled}
        initialTab={initialTab}
      />
    </main>
  );
};

export default AdminSettingsPage;
