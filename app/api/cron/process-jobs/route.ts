/**
 * Vercel Cron Job - Process Background Jobs
 * 
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-jobs",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { jobQueue } from '@/lib/queue/redis-queue';
import { processJob } from '@/lib/queue/job-processors';

export const maxDuration = 60; // 60 seconds max
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const maxProcessingTime = 50000; // 50 seconds (leave buffer)
  let processedCount = 0;
  let failedCount = 0;

  try {
    // Process jobs until time limit
    while (Date.now() - startTime < maxProcessingTime) {
      const job = await jobQueue.dequeue();
      
      if (!job) {
        break; // No more jobs
      }

      try {
        await processJob(job);
        await jobQueue.complete(job.id);
        processedCount++;
      } catch (error: any) {
        await jobQueue.fail(job, error.message);
        failedCount++;
        console.error(`Job ${job.id} failed:`, error);
      }
    }

    const stats = await jobQueue.getStats();

    return NextResponse.json({
      success: true,
      processed: processedCount,
      failed: failedCount,
      duration: Date.now() - startTime,
      queueStats: stats,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error.message, processed: processedCount, failed: failedCount },
      { status: 500 }
    );
  }
}
