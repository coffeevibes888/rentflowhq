import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateTeamMemberRole, removeTeamMember } from '@/lib/actions/team.actions';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { memberId } = await params;
    const body = await req.json();
    const { role } = body;

    if (!role || !['admin', 'member', 'manager', 'employee'].includes(role)) {
      return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });
    }

    const result = await updateTeamMemberRole(memberId, role);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update team member error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { memberId } = await params;
    const result = await removeTeamMember(memberId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json({ success: false, message: 'Failed to remove member' }, { status: 500 });
  }
}
