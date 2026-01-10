import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // For now, return 0 unread messages
    // You can implement actual unread message tracking later
    return NextResponse.json({
      success: true,
      count: 0,
    });
  } catch (error) {
    console.error('Unread messages check error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check unread messages' },
      { status: 500 }
    );
  }
}
