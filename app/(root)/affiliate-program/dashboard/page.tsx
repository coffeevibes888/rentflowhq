import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import AffiliateDashboard from '../affiliate-dashboard';

export const metadata: Metadata = {
  title: 'Affiliate Dashboard | Property Flow HQ',
  description: 'Track your affiliate referrals and earnings',
};

export default async function AffiliateDashboardPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/sign-in?callbackUrl=/affiliate-program/dashboard');
  }

  // Check if user is an affiliate
  const affiliate = await prisma.affiliate.findUnique({
    where: { email: session.user.email },
  });

  if (!affiliate) {
    // User is signed in but not an affiliate - redirect to signup
    redirect('/affiliate-program?signup=required');
  }

  return <AffiliateDashboard />;
}
