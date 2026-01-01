import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prismaBase } from '@/db/prisma-base';
import ReferralsClient from './referrals-client';

export const metadata = {
  title: 'Referrals | Super Admin',
  description: 'Manage referral program',
};

export default async function ReferralsPage() {
  const session = await auth();
  
  if (!session?.user?.id || session.user.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch referrals with related data
  const referrals = await prismaBase.referral.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      referralCode: {
        select: { code: true, landlordId: true },
      },
    },
  });

  // Get referral codes with landlord info
  const referralCodes = await prismaBase.referralCode.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  // Get stats
  const [totalReferrals, completedReferrals, pendingReferrals, totalCreditsIssued] = await Promise.all([
    prismaBase.referral.count(),
    prismaBase.referral.count({ where: { status: 'completed' } }),
    prismaBase.referral.count({ where: { status: 'pending' } }),
    prismaBase.referralCredit.aggregate({
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className='container mx-auto py-8 px-4'>
      <ReferralsClient 
        initialReferrals={referrals.map((ref) => ({
          id: ref.id,
          referrerLandlordId: ref.referrerLandlordId,
          referredLandlordId: ref.referredLandlordId,
          status: ref.status,
          rewardAmount: ref.rewardAmount ? Number(ref.rewardAmount) : null,
          createdAt: ref.createdAt.toISOString(),
          completedAt: ref.completedAt?.toISOString() || null,
          referralCode: ref.referralCode.code,
        }))}
        referralCodes={referralCodes.map((code) => ({
          id: code.id,
          code: code.code,
          landlordId: code.landlordId,
          isActive: code.isActive,
          createdAt: code.createdAt.toISOString(),
        }))}
        stats={{
          totalReferrals,
          completedReferrals,
          pendingReferrals,
          totalCreditsIssued: Number(totalCreditsIssued._sum.amount || 0),
        }}
      />
    </div>
  );
}
