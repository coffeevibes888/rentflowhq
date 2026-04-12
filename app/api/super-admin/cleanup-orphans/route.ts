import { NextResponse } from 'next/server';
import { cleanupOrphanedLandlords } from '@/lib/actions/super-admin.actions';

export async function POST() {
  try {
    const result = await cleanupOrphanedLandlords();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to cleanup orphaned landlords:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to cleanup orphaned data' },
      { status: 500 }
    );
  }
}
