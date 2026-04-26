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

    if (!landlord) {
      return NextResponse.json({ properties: [] });
    }

    const properties = await prisma.property.findMany({
      where: { landlordId: landlord.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        createdAt: true,
        units: {
          select: {
            id: true,
            name: true,
            rentAmount: true,
            isAvailable: true,
            images: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    return NextResponse.json({
      properties: properties.map((p) => {
        const totalUnits = p.units.length;
        const availableUnits = p.units.filter((u) => u.isAvailable).length;
        const occupiedUnits = totalUnits - availableUnits;
        const totalRent = p.units.reduce((sum, u) => sum + (u.rentAmount ? Number(u.rentAmount) : 0), 0);
        const coverImage = p.units.find((u) => u.images?.length)?.images?.[0] ?? null;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          type: p.type,
          address: p.address,
          createdAt: p.createdAt.toISOString(),
          totalUnits,
          availableUnits,
          occupiedUnits,
          totalRent,
          coverImage,
          units: p.units.map((u) => ({
            id: u.id,
            name: u.name,
            rentAmount: u.rentAmount ? Number(u.rentAmount) : 0,
            isAvailable: u.isAvailable,
          })),
        };
      }),
    });
  } catch (error) {
    console.error('[mobile/pm/properties]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
