import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from './analytics-dashboard';

export const metadata: Metadata = {
  title: 'Analytics - Super Admin',
};

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'superAdmin') {
    redirect('/unauthorized');
  }

  return <AnalyticsDashboard />;
}
