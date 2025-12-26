import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return NextResponse.json({ error: landlordResult.message }, { status: 400 });
    }

    const properties = await prisma.property.findMany({
      where: { landlordId: landlordResult.landlord.id },
      select: {
        id: true,
        name: true,
        slug: true,
        units: {
          select: {
            id: true,
            name: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
