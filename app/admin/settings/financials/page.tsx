import { requireAdmin } from '@/lib/auth-guard';
import { getLateFeeSettings } from '@/lib/actions/settings.actions';
import { LateFeeSettingsForm } from '@/components/admin/settings/late-fee-settings';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export const metadata = {
  title: 'Financial Settings',
};

export default async function FinancialSettingsPage() {
  await requireAdmin();

  const settings = await getLateFeeSettings();

  return (
    <main className="w-full px-4 py-10 md:px-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Settings', href: '/admin/settings' },
            { label: 'Financial' },
          ]}
        />
        <h1 className="text-3xl font-semibold text-white mt-4">
          Financial Settings
        </h1>
        <p className="text-slate-400 mt-2">
          Manage late fees, payment methods, and other financial configurations.
        </p>

        <div className="mt-8">
          <LateFeeSettingsForm initialSettings={settings} />
        </div>
      </div>
    </main>
  );
}
