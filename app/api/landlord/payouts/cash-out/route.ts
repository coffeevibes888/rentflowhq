import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { success: false, message: 'Stripe configuration is missing on the server.' },
        { status: 500 }
      );
    }

    const landlordResult = await getOrCreateCurrentLandlord();

    if (!landlordResult.success) {
      return NextResponse.json(
        { success: false, message: landlordResult.message || 'Unable to determine landlord.' },
        { status: 400 }
      );
    }

    const landlord = landlordResult.landlord;

    if (!landlord.stripeConnectAccountId) {
      return NextResponse.json(
        { success: false, message: 'No payout details on file yet.' },
        { status: 400 }
      );
    }

    const unpaidRent = await prisma.rentPayment.findMany({
      where: {
        status: 'paid',
        payoutId: null,
        lease: {
          unit: {
            property: { landlordId: landlord.id },
          },
        },
      },
    });

    if (unpaidRent.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No available balance to cash out.' },
        { status: 400 }
      );
    }

    const totalAmount = unpaidRent.reduce((sum, p) => {
      const amt = Number(p.amount);
      return sum + (Number.isNaN(amt) ? 0 : amt);
    }, 0);

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payout amount.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const payoutType = body.type === 'instant' ? 'instant' : 'standard';
    
    // Calculate fees based on payout type
    // Instant: 1.5% (Stripe's instant payout fee, capped at $10)
    // Standard: Free (arrives in 2-3 business days)
    let fee = 0;
    if (payoutType === 'instant') {
      fee = Math.min(totalAmount * 0.015, 10); // 1.5% capped at $10
    }
    
    const netAmount = totalAmount - fee;

    if (!netAmount || netAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Payout amount is too low after fees.' },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const payoutRecord = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          landlordId: landlord.id,
          amount: netAmount,
          status: 'processing',
          metadata: {
            type: 'landlord_payout',
            landlordId: landlord.id,
            method: payoutType,
            fee,
            grossAmount: totalAmount,
          },
        },
      });

      await tx.rentPayment.updateMany({
        where: { id: { in: unpaidRent.map((p) => p.id) } },
        data: { payoutId: payout.id },
      });

      if (fee > 0) {
        await tx.platformFee.create({
          data: {
            payoutId: payout.id,
            landlordId: landlord.id,
            amount: fee,
            type: 'instant_payout_fee',
            metadata: {
              landlordId: landlord.id,
              payoutId: payout.id,
            },
          },
        });
      }

      return payout;
    });

    // Create Stripe payout to Connected Account
    // For instant payouts, Stripe will attempt instant transfer to debit card
    // For standard, it takes 2-3 business days
    const stripePayout = await stripe.payouts.create(
      {
        amount: Math.round(netAmount * 100),
        currency: 'usd',
        method: payoutType, // 'instant' or 'standard'
        metadata: {
          landlordId: landlord.id,
          payoutId: payoutRecord.id,
        },
      },
      {
        stripeAccount: landlord.stripeConnectAccountId!,
      }
    );

    await prisma.payout.update({
      where: { id: payoutRecord.id },
      data: {
        status: stripePayout.status === 'paid' ? 'paid' : 'processing',
        paidAt: stripePayout.status === 'paid' ? new Date() : null,
        stripeTransferId: stripePayout.id,
      },
    });

    return NextResponse.json({ success: true, payoutId: payoutRecord.id });
  } catch (error) {
    console.error('Landlord cash-out error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process payout.' },
      { status: 500 }
    );
  }
}
