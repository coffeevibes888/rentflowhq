import { NextRequest, NextResponse } from 'next/server';
import { deletePropertyPermanently } from '@/lib/actions/super-admin.actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId } = body;

    const result = await deletePropertyPermanently(propertyId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete property' },
      { status: 500 }
    );
  }
}
