import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Find the user's team membership
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        status: 'active',
      },
    });

    if (!teamMember) {
      return NextResponse.json({ success: false, message: 'Not a team member' }, { status: 403 });
    }

    // Check if already clocked in
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        teamMemberId: teamMember.id,
        clockIn: { gte: today },
        clockOut: null,
      },
    });

    if (existingEntry) {
      return NextResponse.json({ 
        success: false, 
        message: 'Already clocked in. Please clock out first.' 
      }, { status: 400 });
    }

    // Get location from request body
    const body = await req.json().catch(() => ({}));
    const location = body.location;

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        teamMemberId: teamMember.id,
        clockIn: new Date(),
        clockInLatitude: location?.latitude ? String(location.latitude) : null,
        clockInLongitude: location?.longitude ? String(location.longitude) : null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Clocked in successfully',
      timeEntry: {
        id: timeEntry.id,
        clockIn: timeEntry.clockIn.toISOString(),
      },
    });
  } catch (error) {
    console.error('Clock in error:', error);
    return NextResponse.json({ success: false, message: 'Failed to clock in' }, { status: 500 });
  }
}
