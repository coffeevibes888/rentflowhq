'use server';

import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import crypto from 'crypto';

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Get or create referral code for a landlord
 */
export async function getOrCreateReferralCode(landlordId: string): Promise<string> {
  const existing = await prisma.referralCode.findFirst({
    where: { landlordId },
  });

  if (existing) {
    return existing.code;
  }

  // Generate unique code
  let code = generateReferralCode();
  let attempts = 0;
  while (attempts < 10) {
    const exists = await prisma.referralCode.findUnique({ where: { code } });
    if (!exists) break;
    code = generateReferralCode();
    attempts++;
  }

  const referralCode = await prisma.referralCode.create({
    data: {
      code,
      landlordId,
    },
  });

  return referralCode.code;
}

/**
 * Track a referral when a new landlord signs up
 */
export async function trackReferral(
  referralCode: string,
  newLandlordId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const referrer = await prisma.referralCode.findUnique({
      where: { code: referralCode.toUpperCase() },
      include: { landlord: true },
    });

    if (!referrer) {
      return { success: false, message: 'Invalid referral code' };
    }

    // Check if this landlord was already referred
    const existingReferral = await prisma.referral.findFirst({
      where: { referredLandlordId: newLandlordId },
    });

    if (existingReferral) {
      return { success: false, message: 'Already referred' };
    }

    // Create referral record
    await prisma.referral.create({
      data: {
        referrerLandlordId: referrer.landlordId,
        referredLandlordId: newLandlordId,
        referralCodeId: referrer.id,
        status: 'pending',
      },
    });

    return { success: true, message: 'Referral tracked successfully' };
  } catch (error) {
    console.error('Error tracking referral:', error);
    return { success: false, message: 'Failed to track referral' };
  }
}

/**
 * Complete a referral (when referred landlord makes first payment or reaches milestone)
 */
export async function completeReferral(
  referredLandlordId: string
): Promise<{ success: boolean; rewardAmount?: number }> {
  try {
    const referral = await prisma.referral.findFirst({
      where: {
        referredLandlordId,
        status: 'pending',
      },
    });

    if (!referral) {
      return { success: false };
    }

    const rewardAmount = 50; // $50 credit for referrer

    // Update referral status and add reward
    await prisma.$transaction([
      prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          rewardAmount,
        },
      }),
      // Add credit to referrer's account
      prisma.referralCredit.create({
        data: {
          landlordId: referral.referrerLandlordId,
          amount: rewardAmount,
          referralId: referral.id,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      }),
    ]);

    return { success: true, rewardAmount };
  } catch (error) {
    console.error('Error completing referral:', error);
    return { success: false };
  }
}

/**
 * Get referral stats for a landlord
 */
export async function getReferralStats(landlordId: string) {
  const [referralCode, referrals, credits] = await Promise.all([
    prisma.referralCode.findFirst({ where: { landlordId } }),
    prisma.referral.findMany({
      where: { referrerLandlordId: landlordId },
      include: {
        referredLandlord: {
          select: { name: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.referralCredit.findMany({
      where: {
        landlordId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    }),
  ]);

  const totalReferrals = referrals.length;
  const completedReferrals = referrals.filter(r => r.status === 'completed').length;
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
  const availableCredits = credits.reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    code: referralCode?.code || null,
    totalReferrals,
    completedReferrals,
    pendingReferrals,
    availableCredits,
    referrals: referrals.map(r => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      rewardAmount: r.rewardAmount,
      referredName: r.referredLandlord?.name || 'Unknown',
    })),
  };
}

/**
 * Get referral link for sharing
 */
export async function getReferralLink(landlordId: string): Promise<string> {
  const code = await getOrCreateReferralCode(landlordId);
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.propertyflowhq.com';
  return `${baseUrl}/sign-up?ref=${code}`;
}
