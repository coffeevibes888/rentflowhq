import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Fund escrow for a work order (PM/Landlord action)
 * 
 * PRICING:
 * - Landlord pays: Agreed Price + $1 Platform Fee
 * - Platform fee is clearly shown before payment
 * 
 * SECURITY: Only charges the exact agreed price + $1 fee - no hidden charges
 * 
 * NOTE: Run `npx prisma db push` to add escrow fields to WorkOrder model
 */

// Platform fee constants
const LANDLORD_PLATFORM_FEE = 1.00; // $1 flat fee for landlords

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
    }) as any; // Type assertion for new fields

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

    const jobAmount = Number(agreedPrice);
    const platformFee = LANDLORD_PLATFORM_FEE;
    const totalAmount = jobAmount + platformFee;
    const totalAmountCents = Math.round(totalAmount * 100);

    // Check if landlord has sufficient wallet balance first
    const walletBalance = workOrder.landlord.wallet 
      ? Number(workOrder.landlord.wallet.availableBalance) 
      : 0;

    let paymentMethod: 'wallet' | 'card' = 'card';

    if (walletBalance >= totalAmount) {
      // Deduct from wallet (job amount + platform fee)
      paymentMethod = 'wallet';
      
      await prisma.$transaction([
        // Deduct total from wallet
        prisma.landlordWallet.update({
          where: { landlordId: workOrder.landlordId },
          data: {
            availableBalance: { decrement: totalAmount },
          },
        }),
        // Record escrow transaction
        prisma.walletTransaction.create({
          data: {
            walletId: workOrder.landlord.wallet!.id,
            type: 'escrow_hold',
            amount: -jobAmount,
            description: `Escrow for work order: ${workOrder.title}`,
            referenceId: workOrder.id,
            status: 'completed',
          },
        }),
        // Record platform fee transaction
        prisma.walletTransaction.create({
          data: {
            walletId: workOrder.landlord.wallet!.id,
            type: 'fee',
            amount: -platformFee,
            description: `Platform fee for work order: ${workOrder.title}`,
            referenceId: workOrder.id,
            status: 'completed',
          },
        }),
        // Update work order escrow status
        (prisma.workOrder.update as any)({
          where: { id: workOrderId },
          data: {
            escrowStatus: 'funded',
            escrowAmount: jobAmount,
            escrowFundedAt: new Date(),
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        requiresPayment: false,
        paymentMethod,
        breakdown: {
          jobAmount,
          platformFee,
          totalAmount,
        },
        message: `Escrow funded from wallet. Job: $${jobAmount.toFixed(2)} + Platform Fee: $${platformFee.toFixed(2)} = Total: $${totalAmount.toFixed(2)}`,
      });
    } else {
      // Charge card via Stripe
      if (!workOrder.landlord.stripeCustomerId) {
        return NextResponse.json({ 
          error: 'No payment method on file. Please add a payment method first.' 
        }, { status: 400 });
      }

      // Create payment intent - total amount includes platform fee
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: 'usd',
        customer: workOrder.landlord.stripeCustomerId,
        capture_method: 'automatic',
        metadata: {
          type: 'contractor_escrow',
          workOrderId: workOrder.id,
          landlordId: workOrder.landlordId,
          contractorId: workOrder.contractorId || '',
          jobAmount: jobAmount.toString(),
          platformFee: platformFee.toString(),
          totalAmount: totalAmount.toString(),
        },
        description: `Escrow for: ${workOrder.title} ($${jobAmount.toFixed(2)} + $${platformFee.toFixed(2)} platform fee)`,
      });

      // Update work order with payment intent
      await (prisma.workOrder.update as any)({
        where: { id: workOrderId },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          escrowAmount: jobAmount,
          escrowStatus: 'pending',
        },
      });

      return NextResponse.json({
        success: true,
        requiresPayment: true,
        clientSecret: paymentIntent.client_secret,
        breakdown: {
          jobAmount,
          platformFee,
          totalAmount,
        },
        message: `Complete payment: Job $${jobAmount.toFixed(2)} + Platform Fee $${platformFee.toFixed(2)} = Total $${totalAmount.toFixed(2)}`,
      });
    }
  } catch (error) {
    console.error('Error funding escrow:', error);
    return NextResponse.json({ error: 'Failed to fund escrow' }, { status: 500 });
  }
}

// GET - Preview escrow funding (show breakdown before payment)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workOrderId = searchParams.get('workOrderId');

    if (!workOrderId) {
      return NextResponse.json({ error: 'Work order ID required' }, { status: 400 });
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        id: true,
        title: true,
        agreedPrice: true,
        landlord: {
          select: { ownerUserId: true },
        },
      },
    }) as any;

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (workOrder.landlord.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const jobAmount = Number(workOrder.agreedPrice) || 0;
    const platformFee = LANDLORD_PLATFORM_FEE;
    const totalAmount = jobAmount + platformFee;

    return NextResponse.json({
      workOrderId: workOrder.id,
      title: workOrder.title,
      escrowStatus: workOrder.escrowStatus || 'none',
      breakdown: {
        jobAmount,
        platformFee,
        totalAmount,
        platformFeeLabel: 'Platform Fee',
      },
    });
  } catch (error) {
    console.error('Error getting escrow preview:', error);
    return NextResponse.json({ error: 'Failed to get escrow preview' }, { status: 500 });
  }
}
