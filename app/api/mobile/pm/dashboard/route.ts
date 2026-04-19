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

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: userId },
      select: { id: true, companyName: true },
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
      totalUnits,
      occupiedUnits,
      openMaintenanceTickets,
      urgentTickets,
      rentPaidThisMonth,
      pendingApplications,
    ] = await Promise.all([
      prisma.property.count({ where: { landlordId } }),
      prisma.user.count({
        where: {
          role: 'tenant',
          leasesAsTenant: { some: { unit: { property: { landlordId } } } },
        },
      }),
      prisma.unit.count({ where: { property: { landlordId } } }),
      prisma.lease.count({
        where: { status: 'active', unit: { property: { landlordId } } },
      }),
      prisma.maintenanceTicket.count({
        where: {
          status: { in: ['open', 'in_progress'] },
          unit: { property: { landlordId } },
        },
      }),
      prisma.maintenanceTicket.count({
        where: {
          status: { in: ['open', 'in_progress'] },
          priority: 'urgent',
          unit: { property: { landlordId } },
        },
      }),
      prisma.rentPayment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'paid',
          paidAt: { gte: startOfMonth },
          lease: { unit: { property: { landlordId } } },
        },
      }),
      prisma.rentalApplication.count({
        where: { unit: { property: { landlordId } } },
      }),
    ]);

    const monthlyRentCollected = Number(rentPaidThisMonth._sum?.amount || 0);

    return NextResponse.json({
      profile: { id: landlord.id, businessName: landlord.companyName },
      stats: {
        totalProperties,
        totalTenants,
        totalUnits,
        occupiedUnits,
        openMaintenanceTickets,
        urgentTickets,
        monthlyRentCollected,
        pendingApplications,
      },
    });
  } catch (error) {
    console.error('[mobile/pm/dashboard]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
