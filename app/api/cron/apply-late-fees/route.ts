import { NextResponse } from 'next/server';
import { applyLateFees } from '@/lib/actions/cron.actions';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }

  try {
    const result = await applyLateFees();
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Cron job failed' }, { status: 500 });
  }
}
