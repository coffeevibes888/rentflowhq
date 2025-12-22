import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/db/prisma';

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

    console.log('[CRON] Checking for expired verifications...');

    const now = new Date();

    // Find expired verifications
    const expiredVerifications = await db.applicationVerification.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
        overallStatus: 'complete', // Only expire completed verifications
      },
      include: {
        application: {
          include: {
            applicant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    let expiredCount = 0;

    // Update each expired verification
    for (const verification of expiredVerifications) {
      await db.applicationVerification.update({
        where: { id: verification.id },
        data: {
          overallStatus: 'expired',
          identityStatus: 'pending',
          employmentStatus: 'pending',
        },
      });

      expiredCount++;

      // TODO: Send notification to tenant for re-verification (Task 23)
      console.log(`[CRON] Expired verification for application ${verification.applicationId}`);
    }

    console.log(`[CRON] Expired ${expiredCount} verifications`);

    return NextResponse.json({
      success: true,
      expiredCount,
      message: `Successfully expired ${expiredCount} verifications`,
    });
  } catch (error: any) {
    console.error('[CRON] Expiration check failed:', error);
    return NextResponse.json(
      { error: 'Expiration check failed', details: error.message },
      { status: 500 }
    );
  }
}
