import { NextRequest, NextResponse } from 'next/server';
import { runAllRentReminders } from '@/lib/services/rent-reminder.service';

/**
 * Cron job endpoint for sending rent reminders
 * Should be called daily (e.g., via Vercel Cron or external scheduler)
 * 
 * Security: Verify cron secret to prevent unauthorized access
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting rent reminder cron job...');
    
    const result = await runAllRentReminders();
    
    console.log(`Rent reminders completed: ${result.sent} sent, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${result.total} reminders`,
      sent: result.sent,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Rent reminder cron job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process rent reminders',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
