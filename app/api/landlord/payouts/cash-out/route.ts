import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

const PLATFORM_CASHOUT_FEE = 2.00;

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
    const payoutType: Stripe.PayoutCreateParams.Method =
      body.type === 'instant' ? 'instant' : 'standard';
    
    let stripeFee = 0;
    if (payoutType === 'instant') {
      stripeFee = Math.min(totalAmount * 0.015, 10);
    }
    
    const platformFee = PLATFORM_CASHOUT_FEE;
    const totalFees = stripeFee + platformFee;
    const netAmount = totalAmount - totalFees;

    if (!netAmount || netAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Payout amount is too low after fees.' },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const stripeAccountId = landlord.stripeConnectAccountId!;
    const connectedAccount = await stripe.accounts.retrieve(stripeAccountId);

    if (!connectedAccount.payouts_enabled) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payouts are not enabled yet. Please complete payout verification first.',
          needsOnboarding: true,
        },
        { status: 409 }
      );
    }

    let externalAccounts = await stripe.accounts.listExternalAccounts(stripeAccountId, {
      object: payoutType === 'instant' ? 'card' : 'bank_account',
      limit: 1,
    });

    let actualPayoutMethod: Stripe.PayoutCreateParams.Method = payoutType;
    
    if (payoutType === 'instant' && !externalAccounts.data.length) {
      externalAccounts = await stripe.accounts.listExternalAccounts(stripeAccountId, {
        object: 'bank_account',
        limit: 1,
      });
      
      if (externalAccounts.data.length) {
        actualPayoutMethod = 'standard';
      } else {
        return NextResponse.json(
          {
            success: false,
            message: 'No debit card or bank account on file. Please add a payment method to receive payouts.',
            needsOnboarding: true,
          },
          { status: 409 }
        );
      }
    }

    if (!externalAccounts.data.length) {
      return NextResponse.json(
        {
          success: false,
          message: 'No bank account on file for payouts. Please add one to cash out.',
          needsOnboarding: true,
        },
        { status: 409 }
      );
    }

    const payoutRecord = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          landlordId: landlord.id,
          amount: netAmount,
          status: 'processing',
          metadata: {
            type: 'landlord_payout',
            landlordId: landlord.id,
            method: actualPayoutMethod,
            stripeFee,
            platformFee,
            totalFees,
            grossAmount: totalAmount,
          },
        },
      });

      await tx.rentPayment.updateMany({
        where: { id: { in: unpaidRent.map((p) => p.id) } },
        data: { payoutId: payout.id },
      });

      await tx.platformFee.create({
        data: {
          payoutId: payout.id,
          landlordId: landlord.id,
          amount: platformFee,
          type: 'cashout_platform_fee',
          metadata: {
            landlordId: landlord.id,
            payoutId: payout.id,
            stripeFee,
            grossAmount: totalAmount,
          },
        },
      });

      if (stripeFee > 0) {
        await tx.platformFee.create({
          data: {
            payoutId: payout.id,
            landlordId: landlord.id,
            amount: stripeFee,
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

    const stripePayout = await stripe.payouts.create(
      {
        amount: Math.round(netAmount * 100),
        currency: 'usd',
        method: actualPayoutMethod,
        metadata: {
          landlordId: landlord.id,
          payoutId: payoutRecord.id,
        },
      },
      {
        stripeAccount: stripeAccountId,
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

    return NextResponse.json({ 
      success: true, 
      payoutId: payoutRecord.id,
      method: actualPayoutMethod,
      fees: {
        platform: platformFee,
        stripe: stripeFee,
        total: totalFees,
      },
      netAmount,
    });
  } catch (error) {
    console.error('Landlord cash-out error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process payout.' },
      { status: 500 }
    );
  }
}
