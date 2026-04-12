import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function GET() {
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

    // Get team members
    const members = await prisma.contractorTeamMember.findMany({
      where: {
        contractorId: contractor.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
