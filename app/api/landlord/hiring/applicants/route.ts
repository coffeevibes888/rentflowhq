import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

// GET - List all applicants
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return NextResponse.json({ success: false, message: landlordResult.message }, { status: 400 });
    }

    const applicants = await (prisma as any).jobApplicant.findMany({
      where: { landlordId: landlordResult.landlord.id },
      include: {
        job: {
          select: { id: true, title: true },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json({ success: true, applicants });
  } catch (error) {
    console.error('Get applicants error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch applicants' }, { status: 500 });
  }
}
