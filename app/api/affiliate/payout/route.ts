import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find affiliate by email
    const affiliate = await prisma.affiliate.findUnique({
      where: { email: session.user.email },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    // Calculate available balance
    const availableBalance = Number(affiliate.totalEarnings) - Number(affiliate.pendingEarnings) - Number(affiliate.paidEarnings);

    // Check minimum payout
    const minimumPayout = Number(affiliate.minimumPayout);
    if (availableBalance < minimumPayout) {
      return NextResponse.json(
        { error: `Minimum payout amount is $${minimumPayout.toFixed(2)}. Your available balance is $${availableBalance.toFixed(2)}.` },
        { status: 400 }
      );
    }

    // Check if payment method is set
    if (!affiliate.paymentMethod) {
      return NextResponse.json(
        { error: 'Please set up a payment method before requesting a payout.' },
        { status: 400 }
      );
    }

    // Check for pending payout requests
    const pendingPayout = await prisma.affiliatePayout.findFirst({
      where: {
        affiliateId: affiliate.id,
        status: { in: ['pending', 'processing'] },
      },
    });

    if (pendingPayout) {
      return NextResponse.json(
        { error: 'You already have a pending payout request.' },
        { status: 400 }
      );
    }

    // Get approved referrals that haven't been paid yet
    const approvedReferrals = await prisma.affiliateReferral.findMany({
      where: {
        affiliateId: affiliate.id,
        commissionStatus: 'approved',
        payoutId: null,
      },
    });

    // Create payout request
    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount: availableBalance,
        paymentMethod: affiliate.paymentMethod,
        paymentDetails: affiliate.paymentEmail || affiliate.paymentPhone || `****${affiliate.bankAccountLast4}`,
        status: 'pending',
      },
    });

    // Link referrals to this payout
    if (approvedReferrals.length > 0) {
      await prisma.affiliateReferral.updateMany({
        where: {
          id: { in: approvedReferrals.map((r: any) => r.id) },
        },
        data: {
          payoutId: payout.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount: Number(payout.amount),
        status: payout.status,
        paymentMethod: payout.paymentMethod,
      },
      message: 'Payout request submitted successfully. You will receive payment within 5-7 business days.',
    });
  } catch (error) {
    console.error('Error requesting payout:', error);
    return NextResponse.json(
      { error: 'Failed to process payout request. Please try again.' },
      { status: 500 }
    );
  }
}

// GET - Get payout history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { email: session.user.email },
      include: {
        payouts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const payouts = affiliate.payouts.map((p: any) => ({
      id: p.id,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      completedAt: p.completedAt?.toISOString() || null,
    }));

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error('Error fetching payout history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout history' },
      { status: 500 }
    );
  }
}
