/**
 * Cron Job: Release Pending Balances
 * Moves ACH payment funds from pending to available after 7-day hold
 * Should run daily
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
    // Find pending transactions older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pendingTransactions = await prisma.walletTransaction.findMany({
      where: {
        status: 'pending',
        type: 'credit',
        createdAt: { lte: sevenDaysAgo },
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
