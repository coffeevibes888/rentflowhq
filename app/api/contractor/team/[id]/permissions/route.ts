import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: memberId } = await params;
    const body = await req.json();
    const { permissions } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ success: false, message: 'Invalid permissions format' }, { status: 400 });
    }

    // Get contractor profile
    const contractor = await prisma.contractorProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!contractor) {
      return NextResponse.json({ success: false, message: 'Contractor profile not found' }, { status: 404 });
    }

    // Get the team member
    const member = await prisma.contractorTeamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.contractorId !== contractor.id) {
      return NextResponse.json({ success: false, message: 'Team member not found' }, { status: 404 });
    }

    // Update permissions
    await prisma.contractorTeamMember.update({
      where: { id: memberId },
      data: { permissions },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Permissions updated successfully',
      permissions 
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update permissions' }, { status: 500 });
  }
}
