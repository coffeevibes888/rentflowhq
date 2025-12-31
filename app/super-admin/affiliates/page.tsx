import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import AffiliatesClient from './affiliates-client';

export default async function AffiliatesPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/sign-in');
  }

  // Get affiliates with stats
  let affiliates: any[] = [];
  let totalReferrals = 0;
  let pendingCommissions = { _sum: { commissionAmount: null } };
  let approvedCommissions = { _sum: { commissionAmount: null } };
  let totalPaid = { _sum: { amount: null } };
  let recentReferrals: any[] = [];

  try {
    affiliates = await prisma.affiliate.findMany({
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

    totalReferrals = await prisma.affiliateReferral.count();
    pendingCommissions = await prisma.affiliateReferral.aggregate({
      where: { commissionStatus: 'pending' },
      _sum: { commissionAmount: true },
    });
    approvedCommissions = await prisma.affiliateReferral.aggregate({
      where: { commissionStatus: 'approved' },
      _sum: { commissionAmount: true },
    });
    totalPaid = await prisma.affiliatePayout.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true },
    });

    recentReferrals = await prisma.affiliateReferral.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        affiliate: { select: { name: true, code: true } },
        landlord: { select: { name: true, subdomain: true, subscriptionTier: true } },
      },
    });
  } catch (error) {
    // Tables might not exist yet - that's okay, show empty state
    console.log('Affiliate tables may not exist yet:', error);
  }

  const totalAffiliates = affiliates.length;
  const activeAffiliates = affiliates.filter(a => a.status === 'active').length;

  return (
    <AffiliatesClient
      initialAffiliates={affiliates.map((a: any) => ({
        ...a,
        totalEarnings: Number(a.totalEarnings || 0),
        pendingEarnings: Number(a.pendingEarnings || 0),
        paidEarnings: Number(a.paidEarnings || 0),
        commissionBasic: Number(a.commissionBasic || 5),
        commissionPro: Number(a.commissionPro || 10),
        commissionEnterprise: Number(a.commissionEnterprise || 25),
        minimumPayout: Number(a.minimumPayout || 25),
      }))}
      stats={{
        totalAffiliates,
        activeAffiliates,
        totalReferrals,
        pendingCommissions: Number(pendingCommissions._sum?.commissionAmount || 0),
        approvedCommissions: Number(approvedCommissions._sum?.commissionAmount || 0),
        totalPaid: Number(totalPaid._sum?.amount || 0),
      }}
      recentReferrals={recentReferrals.map((r: any) => ({
        ...r,
        subscriptionPrice: Number(r.subscriptionPrice || 0),
        commissionAmount: Number(r.commissionAmount || 0),
      }))}
    />
  );
}
