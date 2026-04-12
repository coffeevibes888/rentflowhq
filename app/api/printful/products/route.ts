import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Printful integration is disabled',
    },
    { status: 503 },
  );
}
