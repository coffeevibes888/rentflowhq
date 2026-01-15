import { NextRequest, NextResponse } from 'next/server';
import { jobGuaranteeService } from '@/lib/services/job-guarantee';
import { prisma } from '@/db/prisma';

/**
 * Cron Job: Auto-release job guarantee funds
 * 
 * Runs periodically to release held funds after 7 days if no dispute was filed.
 * 
 * Requirements: 6.1
 * 
 * Schedule: Run every hour
 * Vercel Cron: 0 * * * * (every hour at minute 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Guarantee Release Cron] Starting fund release check...');

    // Get all holds ready for release
    const holdIds = await jobGuaranteeService.getHoldsReadyForRelease();

    console.log(`[Guarantee Release Cron] Found ${holdIds.length} holds ready for release`);

    const results = {
      total: holdIds.length,
      released: 0,
      failed: 0,
      errors: [] as Array<{ holdId: string; error: string }>,
    };

    // Process each hold
    for (const holdId of holdIds) {
      try {
        // Get hold details
        const hold = await jobGuaranteeService.getHold(holdId);

        if (!hold) {
          console.error(`[Guarantee Release Cron] Hold ${holdId} not found`);
          results.failed++;
          results.errors.push({
            holdId,
            error: 'Hold not found',
          });
          continue;
        }

        // Get contractor's Stripe account ID
        const contractor = await prisma.contractorProfile.findUnique({
          where: { id: hold.contractorId },
          select: { stripeConnectAccountId: true },
        });

        if (!contractor?.stripeConnectAccountId) {
          console.warn(
            `[Guarantee Release Cron] Contractor ${hold.contractorId} has no Stripe account, marking as released without transfer`
          );
          
          // Mark as released even without Stripe transfer
          await prisma.jobGuaranteeHold.update({
            where: { id: holdId },
            data: {
              status: 'released',
              releasedAt: new Date(),
            },
          });
          
          results.released++;
          continue;
        }

        // Release funds to contractor
        await jobGuaranteeService.releaseFunds({
          holdId,
          contractorStripeAccountId: contractor.stripeConnectAccountId,
        });

        console.log(`[Guarantee Release Cron] Successfully released hold ${holdId}`);
        results.released++;
      } catch (error) {
        console.error(`[Guarantee Release Cron] Error releasing hold ${holdId}:`, error);
        results.failed++;
        results.errors.push({
          holdId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('[Guarantee Release Cron] Completed:', results);

    return NextResponse.json({
      success: true,
      message: `Released ${results.released} of ${results.total} holds`,
      results,
    });
  } catch (error) {
    console.error('[Guarantee Release Cron] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
