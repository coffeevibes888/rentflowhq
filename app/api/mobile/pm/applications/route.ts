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

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: payload.userId },
      select: { id: true },
    });

    const landlordFilter = landlord ? { landlordId: landlord.id } : {};

    const applications = await prisma.rentalApplication.findMany({
      where: { unit: { property: landlordFilter } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        employmentStatus: true,
        monthlyIncome: true,
        moveInDate: true,
        unit: {
          select: {
            name: true,
            rentAmount: true,
            property: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      applications: applications.map((a) => ({
        id: a.id,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        name: `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim() || 'Unknown',
        email: a.email ?? '',
        phone: a.phone ?? null,
        employmentStatus: a.employmentStatus ?? null,
        monthlyIncome: a.monthlyIncome ? Number(a.monthlyIncome) : null,
        moveInDate: a.moveInDate?.toISOString() ?? null,
        propertyName: a.unit?.property?.name ?? 'Property',
        unitName: a.unit?.name ?? 'Unit',
        unitRent: a.unit?.rentAmount ? Number(a.unit.rentAmount) : null,
      })),
    });
  } catch (error) {
    console.error('[mobile/pm/applications]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
