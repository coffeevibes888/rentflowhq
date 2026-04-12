import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find affiliate by email
    const affiliate = await prisma.affiliate.findUnique({
      where: { email: session.user.email },
      include: {
        referrals: {
          include: {
            landlord: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.propertyflowhq.com';
    const referralLink = `${baseUrl}?ref=${affiliate.code}`;

    // Format stats
    const stats = {
      code: affiliate.code,
      referralLink,
      totalClicks: affiliate.totalClicks,
      totalSignups: affiliate.totalSignups,
      totalEarnings: Number(affiliate.totalEarnings),
      pendingEarnings: Number(affiliate.pendingEarnings),
      paidEarnings: Number(affiliate.paidEarnings),
      tier: affiliate.tier,
      status: affiliate.status,
    };

    // Format referrals
    const referrals = affiliate.referrals.map((r: any) => ({
      id: r.id,
      landlordName: r.landlord?.name || 'Anonymous',
      subscriptionTier: r.subscriptionTier,
      commissionAmount: Number(r.commissionAmount),
      commissionStatus: r.commissionStatus,
      createdAt: r.createdAt.toISOString(),
      pendingUntil: r.pendingUntil.toISOString(),
    }));

    return NextResponse.json({
      stats,
      referrals,
    });
  } catch (error) {
    console.error('Error fetching affiliate dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
