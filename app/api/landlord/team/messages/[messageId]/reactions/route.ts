import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await params;
    const body = await req.json();
    const { emoji, action } = body;

    if (!emoji || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    // For now, return success (you'll need to implement database storage)
    // This is a placeholder that works with the optimistic UI updates
    return NextResponse.json({
      success: true,
      message: 'Reaction updated',
    });
  } catch (error) {
    console.error('Reaction error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}
