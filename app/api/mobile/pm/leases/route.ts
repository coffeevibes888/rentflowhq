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

    const leases = await prisma.lease.findMany({
      where: { unit: { property: landlordFilter } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        rentAmount: true,
        securityDeposit: true,
        tenantSignedAt: true,
        landlordSignedAt: true,
        tenant: { select: { id: true, name: true, email: true } },
        unit: {
          select: {
            name: true,
            property: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      leases: leases.map((l) => ({
        id: l.id,
        status: l.status,
        startDate: l.startDate?.toISOString() ?? null,
        endDate: l.endDate?.toISOString() ?? null,
        rentAmount: Number(l.rentAmount),
        securityDeposit: l.securityDeposit ? Number(l.securityDeposit) : null,
        tenantSigned: !!l.tenantSignedAt,
        landlordSigned: !!l.landlordSignedAt,
        tenantName: l.tenant?.name ?? 'Unknown',
        tenantEmail: l.tenant?.email ?? '',
        propertyName: l.unit.property?.name ?? 'Property',
        unitName: l.unit.name,
      })),
    });
  } catch (error) {
    console.error('[mobile/pm/leases]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
