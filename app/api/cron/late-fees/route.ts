import { NextRequest, NextResponse } from 'next/server';
import { processLateFees } from '@/lib/actions/rent-automation.actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Verify cron secret in production
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await processLateFees();

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Late fees cron job error:', error);
    return NextResponse.json({ error: 'Failed to process late fees' }, { status: 500 });
  }
}
