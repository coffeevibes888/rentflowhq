import { NextResponse } from 'next/server';
import { getAllPropertiesForSuperAdmin } from '@/lib/actions/super-admin.actions';

export async function GET() {
  try {
    const properties = await getAllPropertiesForSuperAdmin();
    return NextResponse.json(properties);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}
