import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get contractor profile
    const contractor = await prisma.contractorProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!contractor) {
      return NextResponse.json({ success: false, message: 'Contractor profile not found' }, { status: 404 });
    }

    // Delete all pending invitations
    const result = await prisma.contractorTeamMember.deleteMany({
      where: {
        contractorId: contractor.id,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cleared ${result.count} pending invitation(s)`,
    });
  } catch (error) {
    console.error('Clear invites error:', error);
    return NextResponse.json({ success: false, message: 'Failed to clear invitations' }, { status: 500 });
  }
}
