import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/document.service';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting expired document cleanup...');

    // Run cleanup
    const deletedCount = await DocumentService.cleanupExpiredDocuments();

    console.log(`[CRON] Cleanup complete. Deleted ${deletedCount} expired documents.`);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} expired documents`,
    });
  } catch (error: any) {
    console.error('[CRON] Cleanup failed:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error.message },
      { status: 500 }
    );
  }
}
