import { NextRequest, NextResponse } from 'next/server';
import { checkAndNotifyAllLandlords } from '@/lib/actions/subscription.actions';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await checkAndNotifyAllLandlords();
    
    return NextResponse.json({
      success: true,
      notifiedCount: results.length,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Failed to run cron job' }, { status: 500 });
  }
}
