import { NextRequest, NextResponse } from 'next/server';
import { getWorkOrder } from '@/lib/actions/contractor.actions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getWorkOrder(id);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }

  return NextResponse.json({ workOrder: result.workOrder });
}
