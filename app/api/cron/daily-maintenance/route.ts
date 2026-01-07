import { NextRequest, NextResponse } from 'next/server';

// Combined daily maintenance cron job
// Runs: cleanup expired documents, release pending balances, check verification expiration, process webhook retries
// Schedule: 3 AM UTC daily (off-peak hours)

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret is set
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results: Record<string, any> = {};
  const errors: string[] = [];

  // 1. Cleanup Expired Documents
  try {
    const { prisma } = await import('@/db/prisma');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old scanned documents
    const deletedScanned = await prisma.scannedDocument.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    results.cleanupDocuments = {
      scannedDeleted: deletedScanned.count,
    };
  } catch (error) {
    console.error('Cleanup documents error:', error);
    errors.push(`Cleanup documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 2. Release Pending Balances (for contractor payments after hold period)
  try {
    const { prisma } = await import('@/db/prisma');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find work orders with escrow that should be released
    const pendingReleases = await prisma.workOrder.findMany({
      where: {
        escrowStatus: 'funded',
        status: 'completed',
        completedAt: { lt: sevenDaysAgo },
      },
    });

    let released = 0;
    for (const wo of pendingReleases) {
      try {
        await prisma.workOrder.update({
          where: { id: wo.id },
          data: {
            escrowStatus: 'released',
            escrowReleasedAt: new Date(),
          },
        });
        released++;
      } catch (e) {
        console.error('Failed to release escrow for work order:', wo.id, e);
      }
    }

    results.releasePending = { found: pendingReleases.length, released };
  } catch (error) {
    console.error('Release pending error:', error);
    errors.push(`Release pending: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 3. Check Verification Document Expiration
  try {
    const { prisma } = await import('@/db/prisma');
    
    const now = new Date();

    // Mark expired verification documents
    const expiredResult = await prisma.verificationDocument.updateMany({
      where: {
        expiresAt: { lt: now },
        NOT: {
          expiresAt: null,
        },
      },
      data: {
        updatedAt: now,
      },
    });

    results.verificationExpiration = {
      checked: expiredResult.count,
    };
  } catch (error) {
    console.error('Verification expiration error:', error);
    errors.push(`Verification expiration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 4. Process Webhook Retries (Enterprise API)
  try {
    const { prisma } = await import('@/db/prisma');
    const { deliverWebhook } = await import('@/lib/services/webhook.service');
    
    const now = new Date();

    // Find webhooks due for retry
    const pendingDeliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: 'retrying',
        nextRetryAt: { lte: now },
      },
      take: 100,
      orderBy: { nextRetryAt: 'asc' },
    });

    let succeeded = 0;
    let failed = 0;

    for (const delivery of pendingDeliveries) {
      try {
        await deliverWebhook(delivery.id);
        succeeded++;
      } catch (e) {
        failed++;
        console.error('Webhook retry failed:', delivery.id, e);
      }
    }

    results.webhookRetries = {
      processed: pendingDeliveries.length,
      succeeded,
      failed,
    };
  } catch (error) {
    console.error('Webhook retries error:', error);
    errors.push(`Webhook retries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 5. Cleanup Old API Request Logs (keep 30 days)
  try {
    const { prisma } = await import('@/db/prisma');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedLogs = await prisma.apiRequestLog.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    results.cleanupApiLogs = {
      deleted: deletedLogs.count,
    };
  } catch (error) {
    console.error('Cleanup API logs error:', error);
    errors.push(`Cleanup API logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return NextResponse.json({
    success: errors.length === 0,
    timestamp: new Date().toISOString(),
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
