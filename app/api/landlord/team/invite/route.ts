import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { inviteTeamMember } from '@/lib/actions/team.actions';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const result = await inviteTeamMember(email, role || 'member');

    if (!result.success) {
      return NextResponse.json(result, { status: result.featureLocked ? 403 : 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Team invite error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send invitation' }, { status: 500 });
  }
}
