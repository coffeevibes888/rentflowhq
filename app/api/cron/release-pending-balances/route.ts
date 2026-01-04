/**
 * Cron Job: Release Pending Balances
 * Moves funds from pending to available when Stripe has released them
 * Uses availableAt date instead of fixed 7-day hold
 * Should run daily (or more frequently)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find pending transactions where availableAt has passed
    const pendingTransactions = await prisma.walletTransaction.findMany({
      where: {
        status: 'pending',
        type: 'credit',
        availableAt: { lte: now },
      },
      include: { wallet: true },
    });

    let releasedCount = 0;
    let totalAmount = 0;

    for (const transaction of pendingTransactions) {
      const amount = Number(transaction.amount);

      await prisma.$transaction([
        // Move from pending to available
        prisma.landlordWallet.update({
          where: { id: transaction.walletId },
          data: {
            pendingBalance: { decrement: amount },
            availableBalance: { increment: amount },
          },
        }),
        // Update transaction status
        prisma.walletTransaction.update({
          where: { id: transaction.id },
          data: { status: 'completed' },
        }),
      ]);

      releasedCount++;
      totalAmount += amount;
    }

    return NextResponse.json({
      success: true,
      message: `Released ${releasedCount} pending transactions totaling $${totalAmount.toFixed(2)}`,
      releasedCount,
      totalAmount,
    });
  } catch (error) {
    console.error('Error releasing pending balances:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to release pending balances' },
      { status: 500 }
    );
  }
}
