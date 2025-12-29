import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Fund escrow for a work order (PM/Landlord action)
 * 
 * SECURITY: Only charges the exact agreed price - no hidden fees, no overcharges
 * The amount is locked when the work order is created/accepted
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workOrderId } = await req.json();

    if (!workOrderId) {
      return NextResponse.json({ error: 'Work order ID required' }, { status: 400 });
    }

    // Get work order with landlord info
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        landlord: {
          select: {
            id: true,
            ownerUserId: true,
            stripeCustomerId: true,
            wallet: true,
          },
        },
        contractor: {
          select: { id: true, name: true, stripeConnectAccountId: true },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Verify the user owns this landlord account
    if (workOrder.landlord.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check work order status - must be assigned (accepted by contractor)
    if (!['assigned', 'in_progress'].includes(workOrder.status)) {
      return NextResponse.json({ 
        error: 'Work order must be assigned before funding escrow' 
      }, { status: 400 });
    }

    // Check escrow isn't already funded
    if (workOrder.escrowStatus === 'funded') {
      return NextResponse.json({ error: 'Escrow already funded' }, { status: 400 });
    }

    // CRITICAL: Use the agreed price - this is locked and cannot be changed
    const agreedPrice = workOrder.agreedPrice;
    if (!agreedPrice || Number(agreedPrice) <= 0) {
      return NextResponse.json({ error: 'Invalid agreed price' }, { status: 400 });
    }

    const escrowAmount = Number(agreedPrice);
    const escrowAmountCents = Math.round(escrowAmount * 100);

    // Platform fee (e.g., 5% - adjust as needed)
    const platformFeePercent = 0.05;
    const platformFeeCents = Math.round(escrowAmountCents * platformFeePercent);

    // Check if landlord has sufficient wallet balance first
    const walletBalance = workOrder.landlord.wallet 
      ? Number(workOrder.landlord.wallet.availableBalance) 
      : 0;

    let paymentMethod: 'wallet' | 'card' = 'card';
    let stripePaymentIntentId: string | null = null;

    if (walletBalance >= escrowAmount) {
      // Deduct from wallet
      paymentMethod = 'wallet';
      
      await prisma.$transaction([
        // Deduct from wallet
        prisma.landlordWallet.update({
          where: { landlordId: workOrder.landlordId },
          data: {
            availableBalance: { decrement: escrowAmount },
          },
        }),
        // Record transaction
        prisma.walletTransaction.create({
          data: {
            walletId: workOrder.landlord.wallet!.id,
            type: 'escrow_hold',
            amount: -escrowAmount,
            description: `Escrow for work order: ${workOrder.title}`,
            referenceId: workOrder.id,
            status: 'completed',
          },
        }),
        // Update work order escrow status
        prisma.workOrder.update({
          where: { id: workOrderId },
          data: {
            escrowStatus: 'funded',
            escrowAmount: escrowAmount,
            escrowFundedAt: new Date(),
          },
        }),
      ]);
    } else {
      // Charge card via Stripe
      if (!workOrder.landlord.stripeCustomerId) {
        return NextResponse.json({ 
          error: 'No payment method on file. Please add a payment method first.' 
        }, { status: 400 });
      }

      // Create payment intent - amount is EXACTLY the agreed price
      const paymentIntent = await stripe.paymentIntents.create({
        amount: escrowAmountCents,
        currency: 'usd',
        customer: workOrder.landlord.stripeCustomerId,
        // Don't transfer yet - hold in platform account (escrow)
        capture_method: 'automatic',
        metadata: {
          type: 'contractor_escrow',
          workOrderId: workOrder.id,
          landlordId: workOrder.landlordId,
          contractorId: workOrder.contractorId || '',
          agreedPrice: escrowAmount.toString(),
          platformFee: (platformFeeCents / 100).toString(),
        },
        description: `Escrow for work order: ${workOrder.title}`,
      });

      stripePaymentIntentId = paymentIntent.id;

      // Update work order with payment intent (will be marked funded via webhook)
      await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          escrowAmount: escrowAmount,
          // Status will be updated to 'funded' when payment succeeds via webhook
          escrowStatus: 'pending',
        },
      });

      return NextResponse.json({
        success: true,
        requiresPayment: true,
        clientSecret: paymentIntent.client_secret,
        amount: escrowAmount,
        message: 'Complete payment to fund escrow',
      });
    }

    return NextResponse.json({
      success: true,
      requiresPayment: false,
      paymentMethod,
      amount: escrowAmount,
      message: 'Escrow funded from wallet balance',
    });
  } catch (error) {
    console.error('Error funding escrow:', error);
    return NextResponse.json({ error: 'Failed to fund escrow' }, { status: 500 });
  }
}
