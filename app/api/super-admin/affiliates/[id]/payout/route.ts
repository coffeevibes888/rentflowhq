import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// POST - Process payout for affiliate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, paymentMethod, paymentDetails, notes } = body;

    // Get affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        referrals: {
          where: { commissionStatus: 'approved' },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    // Validate amount
    const availableBalance = Number(affiliate.pendingEarnings);
    if (amount > availableBalance) {
      return NextResponse.json({ error: 'Amount exceeds available balance' }, { status: 400 });
    }

    // Create payout record
    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: id,
        amount,
        paymentMethod: paymentMethod || affiliate.paymentMethod || 'manual',
        paymentDetails: paymentDetails || affiliate.paymentEmail || affiliate.paymentPhone,
        notes,
        status: 'pending',
      },
    });

    // Update referrals to mark as paid
    const approvedReferrals = affiliate.referrals;
    let remainingAmount = amount;

    for (const referral of approvedReferrals) {
      if (remainingAmount <= 0) break;
      
      const commissionAmount = Number(referral.commissionAmount);
      if (commissionAmount <= remainingAmount) {
        await prisma.affiliateReferral.update({
          where: { id: referral.id },
          data: {
            commissionStatus: 'paid',
            paidAt: new Date(),
            payoutId: payout.id,
          },
        });
        remainingAmount -= commissionAmount;
      }
    }

    // Update affiliate stats
    await prisma.affiliate.update({
      where: { id },
      data: {
        pendingEarnings: { decrement: amount },
        paidEarnings: { increment: amount },
      },
    });

    return NextResponse.json({ payout, success: true });
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 });
  }
}
