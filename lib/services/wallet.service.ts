/**
 * Wallet Service
 * Handles crediting landlord wallets when rent payments are received
 */

import { prisma } from '@/db/prisma';

interface CreditWalletParams {
  landlordId: string;
  amount: number;
  paymentMethod: string;
  description: string;
  referenceId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Credit a landlord's wallet when a rent payment is received
 * ACH payments go to pending balance (7-day hold)
 * Card payments are available immediately
 */
export async function creditLandlordWallet({
  landlordId,
  amount,
  paymentMethod,
  description,
  referenceId,
  metadata,
}: CreditWalletParams) {
  // Get or create wallet
  let wallet = await prisma.landlordWallet.findUnique({
    where: { landlordId },
  });

  if (!wallet) {
    wallet = await prisma.landlordWallet.create({
      data: {
        landlordId,
        availableBalance: 0,
        pendingBalance: 0,
      },
    });
  }

  // Determine if this is an ACH payment (needs 7-day hold)
  const isACH = paymentMethod === 'us_bank_account' || paymentMethod === 'ach_debit';

  if (isACH) {
    // ACH payments go to pending first (7-day hold)
    await prisma.landlordWallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: { increment: amount },
      },
    });
  } else {
    // Card payments are available immediately
    await prisma.landlordWallet.update({
      where: { id: wallet.id },
      data: {
        availableBalance: { increment: amount },
      },
    });
  }

  // Record wallet transaction
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'credit',
      amount,
      description,
      status: isACH ? 'pending' : 'completed',
      referenceId,
      metadata: metadata || {},
    },
  });

  return { success: true, isACH };
}

/**
 * Move pending balance to available balance
 * Called by a cron job after 7-day hold period
 */
export async function releasePendingBalance(transactionId: string) {
  const transaction = await prisma.walletTransaction.findUnique({
    where: { id: transactionId },
    include: { wallet: true },
  });

  if (!transaction || transaction.status !== 'pending') {
    return { success: false, message: 'Transaction not found or not pending' };
  }

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
      where: { id: transactionId },
      data: { status: 'completed' },
    }),
  ]);

  return { success: true };
}

/**
 * Get wallet balance for a landlord
 */
export async function getWalletBalance(landlordId: string) {
  const wallet = await prisma.landlordWallet.findUnique({
    where: { landlordId },
  });

  if (!wallet) {
    return {
      availableBalance: 0,
      pendingBalance: 0,
      totalBalance: 0,
    };
  }

  return {
    availableBalance: Number(wallet.availableBalance),
    pendingBalance: Number(wallet.pendingBalance),
    totalBalance: Number(wallet.availableBalance) + Number(wallet.pendingBalance),
  };
}
