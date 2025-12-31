import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import AffiliatesClient from './affiliates-client';

export default async function AffiliatesPage() {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  // Get affiliates with stats
  const affiliates = await prisma.affiliate.findMany({
    include: {
      _count: {
        select: {
          referrals: true,
          payouts: true,
          clicks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get summary stats
  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter(a => a.status === 'active').length;
  const totalReferrals = await prisma.affiliateReferral.count();
  const pendingCommissions = await prisma.affiliateReferral.aggregate({
    where: { commissionStatus: 'pending' },
    _sum: { commissionAmount: true },
  });
  const approvedCommissions = await prisma.affiliateReferral.aggregate({
    where: { commissionStatus: 'approved' },
    _sum: { commissionAmount: true },
  });
  const totalPaid = await prisma.affiliatePayout.aggregate({
    where: { status: 'completed' },
    _sum: { amount: true },
  });

  // Recent referrals
  const recentReferrals = await prisma.affiliateReferral.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      affiliate: { select: { name: true, code: true } },
      landlord: { select: { name: true, subdomain: true, subscriptionTier: true } },
    },
  });

  return (
    <AffiliatesClient
      initialAffiliates={affiliates.map(a => ({
        ...a,
        totalEarnings: Number(a.totalEarnings),
        pendingEarnings: Number(a.pendingEarnings),
        paidEarnings: Number(a.paidEarnings),
        commissionBasic: Number(a.commissionBasic),
        commissionPro: Number(a.commissionPro),
        commissionEnterprise: Number(a.commissionEnterprise),
        minimumPayout: Number(a.minimumPayout),
      }))}
      stats={{
        totalAffiliates,
        activeAffiliates,
        totalReferrals,
        pendingCommissions: Number(pendingCommissions._sum.commissionAmount || 0),
        approvedCommissions: Number(approvedCommissions._sum.commissionAmount || 0),
        totalPaid: Number(totalPaid._sum?.amount || 0),
      }}
      recentReferrals={recentReferrals.map(r => ({
        ...r,
        subscriptionPrice: Number(r.subscriptionPrice),
        commissionAmount: Number(r.commissionAmount),
      }))}
    />
  );
}
