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
    if (payload.role !== 'admin' && payload.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = payload.userId;

    const landlord = await prisma.landlord.findUnique({
      where: { userId },
      select: { id: true, businessName: true },
    });

    if (!landlord) {
      return NextResponse.json({ error: 'Landlord profile not found' }, { status: 404 });
    }

    const landlordId = landlord.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProperties,
      totalTenants,
      openMaintenanceTickets,
      rentPaymentsThisMonth,
      pendingApplications,
      overdueRent,
    ] = await Promise.all([
      prisma.property.count({ where: { landlordId } }),
      prisma.tenant.count({ where: { landlordId, status: 'active' } }),
      prisma.maintenanceTicket.count({
        where: { landlordId, status: { in: ['open', 'in_progress'] } },
      }),
      prisma.rentPayment.findMany({
        where: { landlordId, createdAt: { gte: startOfMonth }, status: 'paid' },
        select: { amount: true },
      }),
      prisma.rentalApplication.count({
        where: { landlordId, status: 'pending' },
      }),
      prisma.rentPayment.count({
        where: { landlordId, status: 'overdue' },
      }),
    ]);

    const monthlyRentCollected = rentPaymentsThisMonth.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    return NextResponse.json({
      profile: landlord,
      stats: {
        totalProperties,
        totalTenants,
        openMaintenanceTickets,
        monthlyRentCollected,
        pendingApplications,
        overdueRent,
      },
    });
  } catch (error) {
    console.error('[mobile/pm/dashboard]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
