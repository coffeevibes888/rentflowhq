import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Release escrow to contractor (PM/Landlord action after job completion)
 * 
 * SECURITY: 
 * - Only releases the exact escrowed amount
 * - Contractor must have completed the work (status = completed)
 * - PM must approve the work before release
 * - Platform fee is deducted, rest goes to contractor
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

    // Get work order with all related data
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        landlord: {
          select: {
            id: true,
            ownerUserId: true,
            stripeConnectAccountId: true,
          },
        },
        contractor: {
          select: { 
            id: true, 
            name: true, 
            email: true,
            stripeConnectAccountId: true,
            isPaymentReady: true,
          },
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

    // Verify work is completed
    if (workOrder.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Work must be marked as completed before releasing payment' 
      }, { status: 400 });
    }

    // Verify escrow is funded
    if (workOrder.escrowStatus !== 'funded') {
      return NextResponse.json({ 
        error: 'Escrow must be funded before release' 
      }, { status: 400 });
    }

    // Verify contractor exists and has payment setup
    if (!workOrder.contractor) {
      return NextResponse.json({ error: 'No contractor assigned' }, { status: 400 });
    }

    const escrowAmount = Number(workOrder.escrowAmount);
    if (!escrowAmount || escrowAmount <= 0) {
      return NextResponse.json({ error: 'Invalid escrow amount' }, { status: 400 });
    }

    // Calculate platform fee (5%)
    const platformFeePercent = 0.05;
    const platformFee = escrowAmount * platformFeePercent;
    const netAmount = escrowAmount - platformFee;
    const netAmountCents = Math.round(netAmount * 100);

    // Check if contractor has Stripe Connect for direct payout
    if (workOrder.contractor.stripeConnectAccountId && workOrder.contractor.isPaymentReady) {
      // Transfer to contractor's connected account
      try {
        const transfer = await stripe.transfers.create({
          amount: netAmountCents,
          currency: 'usd',
          destination: workOrder.contractor.stripeConnectAccountId,
          metadata: {
            type: 'contractor_payout',
            workOrderId: workOrder.id,
            landlordId: workOrder.landlordId,
            contractorId: workOrder.contractor.id,
            grossAmount: escrowAmount.toString(),
            platformFee: platformFee.toString(),
            netAmount: netAmount.toString(),
          },
          description: `Payment for: ${workOrder.title}`,
        });

        // Record the payment
        await prisma.$transaction([
          // Create payment record
          prisma.contractorPayment.create({
            data: {
              landlordId: workOrder.landlordId,
              contractorId: workOrder.contractor.id,
              workOrderId: workOrder.id,
              amount: escrowAmount,
              platformFee: platformFee,
              netAmount: netAmount,
              status: 'completed',
              stripeTransferId: transfer.id,
              paidAt: new Date(),
            },
          }),
          // Update work order
          prisma.workOrder.update({
            where: { id: workOrderId },
            data: {
              status: 'paid',
              escrowStatus: 'released',
              escrowReleasedAt: new Date(),
            },
          }),
          // Record in work order history
          prisma.workOrderHistory.create({
            data: {
              workOrderId: workOrder.id,
              changedById: session.user.id,
              previousStatus: 'completed',
              newStatus: 'paid',
              notes: `Payment released: $${netAmount.toFixed(2)} (after $${platformFee.toFixed(2)} platform fee)`,
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          transferId: transfer.id,
          grossAmount: escrowAmount,
          platformFee: platformFee,
          netAmount: netAmount,
          message: `$${netAmount.toFixed(2)} released to contractor`,
        });
      } catch (stripeError: any) {
        console.error('Stripe transfer error:', stripeError);
        return NextResponse.json({ 
          error: `Payment transfer failed: ${stripeError.message}` 
        }, { status: 500 });
      }
    } else {
      // Contractor doesn't have Stripe Connect - record as pending manual payout
      await prisma.$transaction([
        prisma.contractorPayment.create({
          data: {
            landlordId: workOrder.landlordId,
            contractorId: workOrder.contractor.id,
            workOrderId: workOrder.id,
            amount: escrowAmount,
            platformFee: platformFee,
            netAmount: netAmount,
            status: 'pending', // Will need manual payout
          },
        }),
        prisma.workOrder.update({
          where: { id: workOrderId },
          data: {
            status: 'approved', // Approved but not paid yet
            escrowStatus: 'released',
            escrowReleasedAt: new Date(),
          },
        }),
        prisma.workOrderHistory.create({
          data: {
            workOrderId: workOrder.id,
            changedById: session.user.id,
            previousStatus: 'completed',
            newStatus: 'approved',
            notes: `Work approved. Payment pending - contractor needs to set up payout method.`,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        grossAmount: escrowAmount,
        platformFee: platformFee,
        netAmount: netAmount,
        pendingSetup: true,
        message: 'Work approved. Contractor needs to set up payout method to receive funds.',
      });
    }
  } catch (error) {
    console.error('Error releasing escrow:', error);
    return NextResponse.json({ error: 'Failed to release escrow' }, { status: 500 });
  }
}
