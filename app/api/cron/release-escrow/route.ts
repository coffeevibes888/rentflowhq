import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { MarketplaceNotifications } from '@/lib/services/marketplace-notifications';

/**
 * Auto-release escrow holds after 7 days
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
 * 
 * Security: Add authorization header check in production
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (add this to your .env)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all escrow holds that are past their release date and still held
    const now = new Date();
    const expiredHolds = await prisma.jobGuaranteeHold.findMany({
      where: {
        status: 'held',
        releaseAt: {
          lte: now,
        },
      },
      include: {
        // We'll need contractor info for stats update
      },
    });

    console.log(`Found ${expiredHolds.length} expired escrow holds to release`);

    const results = {
      released: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each hold
    for (const hold of expiredHolds) {
      try {
        await prisma.$transaction(async (tx) => {
          // Release the hold
          await tx.jobGuaranteeHold.update({
            where: { id: hold.id },
            data: {
              status: 'released',
              releasedAt: new Date(),
            },
          });

          // Auto-create a 5-star review (since no issues were reported)
          await tx.contractorReview.create({
            data: {
              contractorProfileId: hold.contractorId,
              reviewerId: hold.customerId,
              workOrderId: hold.jobId,
              overallRating: 5,
              qualityRating: 5,
              communicationRating: 5,
              timelinessRating: 5,
              valueRating: 5,
              content: 'Job completed successfully (auto-approved after 7 days)',
              isVerified: true,
              verificationMethod: 'work_order_completion',
              status: 'published',
            },
          });

          // Update contractor stats
          const contractor = await tx.contractorProfile.findUnique({
            where: { id: hold.contractorId },
            include: {
              reviews: true,
            },
          });

          if (contractor) {
            const allReviews = await tx.contractorReview.findMany({
              where: { contractorProfileId: hold.contractorId },
            });
            
            const totalReviews = allReviews.length + 1;
            const totalRating = allReviews.reduce((sum, r) => sum + r.overallRating, 0) + 5;
            const newAvgRating = totalRating / totalReviews;

            await tx.contractorProfile.update({
              where: { id: hold.contractorId },
              data: {
                avgRating: newAvgRating,
                completedJobs: { increment: 1 },
                onTimeRate: contractor.onTimeRate
                  ? (contractor.onTimeRate * (contractor.completedJobs || 1) + 100) / ((contractor.completedJobs || 1) + 1)
                  : 100,
              },
            });
          }
        });

        results.released++;
        console.log(`Released escrow hold ${hold.id} for job ${hold.jobId}`);

        // Send notifications
        try {
          const [contractor, homeowner, job] = await Promise.all([
            tx.contractorProfile.findUnique({
              where: { id: hold.contractorId },
              include: { user: true },
            }),
            tx.homeowner.findUnique({
              where: { id: hold.customerId },
              include: { user: true },
            }),
            tx.homeownerWorkOrder.findUnique({
              where: { id: hold.jobId },
            }),
          ]);

          if (contractor?.user && job) {
            // Notify contractor of payment release
            await MarketplaceNotifications.notifyPaymentReleased({
              contractorId: contractor.user.id,
              jobId: hold.jobId,
              jobTitle: job.title,
              amount: Number(hold.amount),
              rating: 5,
            });

            // Notify contractor of auto-review
            await MarketplaceNotifications.notifyReviewReceived({
              contractorId: contractor.user.id,
              jobId: hold.jobId,
              jobTitle: job.title,
              rating: 5,
              reviewText: 'Job completed successfully (auto-approved after 7 days)',
            });
          }

          if (homeowner?.user && job) {
            // Notify homeowner that payment was auto-released
            await MarketplaceNotifications.notifyPaymentAutoReleased({
              homeownerId: homeowner.user.id,
              jobId: hold.jobId,
              jobTitle: job.title,
              amount: Number(hold.amount),
            });
          }
        } catch (notifError) {
          console.error('Error sending notifications:', notifError);
        }

        // TODO: Transfer funds via Stripe (when Treasury is implemented)
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to release hold ${hold.id}: ${error.message}`);
        console.error(`Error releasing hold ${hold.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredHolds.length} escrow holds`,
      results,
    });
  } catch (error: any) {
    console.error('Error in escrow release cron:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process escrow releases' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
