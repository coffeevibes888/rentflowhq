import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { Metadata } from 'next';
import AnalyticsDashboard from './analytics-dashboard';

export const metadata: Metadata = {
  title: 'Financial Analytics',
};

const AdminAnalyticsPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlord = landlordResult.landlord;

  return (
    <main className='w-full'>
      <div className='max-w-7xl space-y-6'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-50 mb-2'>Financial Analytics</h1>
          <p className='text-sm text-slate-300/80'>
            Track your property performance, ROI, and generate comprehensive financial reports.
          </p>
        </div>

        <AnalyticsDashboard landlordId={landlord.id} />
      </div>
    </main>
  );
};

export default AdminAnalyticsPage;
