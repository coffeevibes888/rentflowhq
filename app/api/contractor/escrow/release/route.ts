import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Release escrow to contractor (PM/Landlord action after job completion)
 * 
 * PRICING:
 * - Contractor receives: Escrow Amount - $1 Platform Fee
 * - Platform fee is clearly shown before release
 * 
 * SECURITY: 
 * - Only releases the exact escrowed amount minus $1 fee
 * - Contractor must have completed the work (status = completed)
 * - PM must approve the work before release
 */

// Platform fee constants
const CONTRACTOR_PLATFORM_FEE = 1.00; // $1 flat fee for contractors on cashout

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

    // Verify contractor exists
    if (!workOrder.contractor) {
      return NextResponse.json({ error: 'No contractor assigned' }, { status: 400 });
    }

    const escrowAmount = Number(workOrder.escrowAmount);
    if (!escrowAmount || escrowAmount <= 0) {
      return NextResponse.json({ error: 'Invalid escrow amount' }, { status: 400 });
    }

    // Calculate amounts with $1 flat fee
    const platformFee = CONTRACTOR_PLATFORM_FEE;
    const netAmount = escrowAmount - platformFee;
    const netAmountCents = Math.round(netAmount * 100);

    // Ensure net amount is positive
    if (netAmount <= 0) {
      return NextResponse.json({ 
        error: 'Job amount too small to cover platform fee' 
      }, { status: 400 });
    }

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
          description: `Payment for: ${workOrder.title} (after $${platformFee.toFixed(2)} platform fee)`,
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
              notes: `Payment released to contractor: $${netAmount.toFixed(2)} (Job: $${escrowAmount.toFixed(2)} - Platform Fee: $${platformFee.toFixed(2)})`,
            },
          }),
        ]);

        return NextResponse.json({
          success: true,
          transferId: transfer.id,
          breakdown: {
            grossAmount: escrowAmount,
            platformFee: platformFee,
            netAmount: netAmount,
          },
          message: `$${netAmount.toFixed(2)} released to ${workOrder.contractor.name} (after $${platformFee.toFixed(2)} platform fee)`,
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
            notes: `Work approved. Payment pending ($${netAmount.toFixed(2)} after $${platformFee.toFixed(2)} fee) - contractor needs to set up payout method.`,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        breakdown: {
          grossAmount: escrowAmount,
          platformFee: platformFee,
          netAmount: netAmount,
        },
        pendingSetup: true,
        message: `Work approved. $${netAmount.toFixed(2)} pending - contractor needs to set up payout method.`,
      });
    }
  } catch (error) {
    console.error('Error releasing escrow:', error);
    return NextResponse.json({ error: 'Failed to release escrow' }, { status: 500 });
  }
}

// GET - Preview release (show breakdown before releasing)
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
        escrowAmount: true,
        escrowStatus: true,
        status: true,
        contractor: {
          select: { name: true },
        },
        landlord: {
          select: { ownerUserId: true },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (workOrder.landlord.ownerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const escrowAmount = Number(workOrder.escrowAmount) || 0;
    const platformFee = CONTRACTOR_PLATFORM_FEE;
    const netAmount = escrowAmount - platformFee;

    return NextResponse.json({
      workOrderId: workOrder.id,
      title: workOrder.title,
      contractorName: workOrder.contractor?.name,
      escrowStatus: workOrder.escrowStatus,
      workOrderStatus: workOrder.status,
      breakdown: {
        grossAmount: escrowAmount,
        platformFee: platformFee,
        netAmount: netAmount,
        platformFeeLabel: 'Platform Fee (deducted from contractor)',
      },
    });
  } catch (error) {
    console.error('Error getting release preview:', error);
    return NextResponse.json({ error: 'Failed to get release preview' }, { status: 500 });
  }
}
