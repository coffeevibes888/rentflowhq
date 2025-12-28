import { NextRequest, NextResponse } from 'next/server';
import { updatePropertyStatus } from '@/lib/actions/super-admin.actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, status } = body;

    const result = await updatePropertyStatus(propertyId, status);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}
