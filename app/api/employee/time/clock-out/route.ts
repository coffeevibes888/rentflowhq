import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { timeEntryId } = body;

    if (!timeEntryId) {
      return NextResponse.json({ success: false, message: 'Time entry ID required' }, { status: 400 });
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

    // Find and verify the time entry belongs to this user
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId,
        teamMemberId: teamMember.id,
        clockOut: null,
      },
    });

    if (!timeEntry) {
      return NextResponse.json({ 
        success: false, 
        message: 'Time entry not found or already clocked out' 
      }, { status: 404 });
    }

    // Update with clock out time
    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        clockOut: new Date(),
      },
    });

    // Calculate hours worked
    const hoursWorked = (updatedEntry.clockOut!.getTime() - updatedEntry.clockIn.getTime()) / (1000 * 60 * 60);

    return NextResponse.json({ 
      success: true, 
      message: 'Clocked out successfully',
      timeEntry: {
        id: updatedEntry.id,
        clockIn: updatedEntry.clockIn.toISOString(),
        clockOut: updatedEntry.clockOut!.toISOString(),
        hoursWorked: hoursWorked.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Clock out error:', error);
    return NextResponse.json({ success: false, message: 'Failed to clock out' }, { status: 500 });
  }
}
