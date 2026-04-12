import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getCurrentLandlordSubscription } from '@/lib/actions/subscription.actions';
import { SubscriptionDashboard } from './subscription-dashboard';

export const metadata: Metadata = {
  title: 'Subscription Settings',
};

export default async function SubscriptionPage() {
  await requireAdmin();
  
  const subscriptionData = await getCurrentLandlordSubscription();

  return (
    <main className="w-full px-4 py-10 md:px-0">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-white">Subscription</h1>
          <p className="text-sm text-slate-300/80">
            Manage your subscription plan and view your usage.
          </p>
        </div>

        {subscriptionData.success && subscriptionData.currentTier && subscriptionData.tierConfig ? (
          <SubscriptionDashboard
            currentTier={subscriptionData.currentTier}
            tierConfig={subscriptionData.tierConfig}
            unitCount={subscriptionData.unitCount ?? 0}
            unitLimit={subscriptionData.unitLimit ?? 24}
            nearLimit={subscriptionData.nearLimit ?? false}
            atLimit={subscriptionData.atLimit ?? false}
            features={subscriptionData.features!}
          />
        ) : (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="text-red-400">{subscriptionData.message || 'Unable to load subscription data'}</p>
          </div>
        )}
      </div>
    </main>
  );
}
