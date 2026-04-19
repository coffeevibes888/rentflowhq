import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/db/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyMobileToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    if (payload.role !== 'contractor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = payload.userId;

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        businessName: true,
        displayName: true,
        subscriptionTier: true,
        avgRating: true,
        totalReviews: true,
        completedJobs: true,
      },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    const contractorId = contractorProfile.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeJobs, pendingLeads, monthlyJobs, recentJobs, recentLeads] = await Promise.all([
      prisma.job.count({
        where: { contractorId, status: { in: ['in_progress', 'dispatched', 'accepted'] } },
      }),
      prisma.contractorLead.count({
        where: { contractorId, status: 'pending' },
      }),
      prisma.job.findMany({
        where: { contractorId, createdAt: { gte: startOfMonth } },
        select: { totalAmount: true, status: true },
      }),
      prisma.job.findMany({
        where: { contractorId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          property: { select: { address: true } },
        },
      }),
      prisma.contractorLead.findMany({
        where: { contractorId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          budget: true,
          createdAt: true,
        },
      }),
    ]);

    const monthlyRevenue = monthlyJobs
      .filter((j) => j.status === 'completed')
      .reduce((sum, j) => sum + (j.totalAmount || 0), 0);

    const completedThisMonth = monthlyJobs.filter((j) => j.status === 'completed').length;

    return NextResponse.json({
      profile: contractorProfile,
      stats: {
        activeJobs,
        pendingLeads,
        monthlyRevenue,
        completedThisMonth,
        totalCompleted: contractorProfile.completedJobs || 0,
        avgRating: contractorProfile.avgRating || 0,
        totalReviews: contractorProfile.totalReviews || 0,
      },
      recentJobs,
      recentLeads,
    });
  } catch (error) {
    console.error('[mobile/contractor/dashboard]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
