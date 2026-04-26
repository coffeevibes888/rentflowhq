import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyMobileToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    if (payload.role !== 'admin' && payload.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: payload.userId },
      select: {
        id: true,
        stripeAccountId: true,
        payoutMethod: true,
        bankLast4: true,
        availableBalance: true,
        pendingBalance: true,
        totalPaidOut: true,
      },
    });

    if (!landlord) return NextResponse.json({ payout: null, history: [] });

    // Get payout history from cash payments
    const cashPayments = await prisma.cashPayment.findMany({
      where: { landlordId: landlord.id, type: 'payout' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        notes: true,
      },
    });

    return NextResponse.json({
      payout: {
        availableBalance: landlord.availableBalance ? Number(landlord.availableBalance) : 0,
        pendingBalance: landlord.pendingBalance ? Number(landlord.pendingBalance) : 0,
        totalPaidOut: landlord.totalPaidOut ? Number(landlord.totalPaidOut) : 0,
        hasStripeAccount: !!landlord.stripeAccountId,
        payoutMethod: landlord.payoutMethod ?? 'none',
        bankLast4: landlord.bankLast4 ?? null,
      },
      history: cashPayments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        notes: p.notes,
      })),
    });
  } catch (error) {
    console.error('[mobile/pm/payouts]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
