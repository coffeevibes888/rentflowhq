import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractorId, date } = await req.json();

    // Verify user owns this contractor profile
    const contractor = await prisma.contractorProfile.findUnique({
      where: { id: contractorId },
      select: { userId: true },
    });

    if (!contractor || contractor.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get current availability
    const availability = await prisma.contractorAvailability.findUnique({
      where: { contractorId },
    });

    if (!availability) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
    }

    // Add date to blocked dates
    const blockedDate = new Date(date);
    const updatedBlockedDates = [...availability.blockedDates, blockedDate];

    await prisma.contractorAvailability.update({
      where: { contractorId },
      data: {
        blockedDates: updatedBlockedDates,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to block date:', error);
    return NextResponse.json({ error: 'Failed to block date' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contractorId = searchParams.get('contractorId');
    const date = searchParams.get('date');

    if (!contractorId || !date) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify user owns this contractor profile
    const contractor = await prisma.contractorProfile.findUnique({
      where: { id: contractorId },
      select: { userId: true },
    });

    if (!contractor || contractor.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get current availability
    const availability = await prisma.contractorAvailability.findUnique({
      where: { contractorId },
    });

    if (!availability) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
    }

    // Remove date from blocked dates
    const dateToRemove = new Date(date);
    const updatedBlockedDates = availability.blockedDates.filter(
      (d) => d.getTime() !== dateToRemove.getTime()
    );

    await prisma.contractorAvailability.update({
      where: { contractorId },
      data: {
        blockedDates: updatedBlockedDates,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unblock date:', error);
    return NextResponse.json({ error: 'Failed to unblock date' }, { status: 500 });
  }
}
