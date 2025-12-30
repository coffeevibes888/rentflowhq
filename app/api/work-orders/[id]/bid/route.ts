import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

// POST - Submit a bid on an open work order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id: workOrderId } = await params;
    const body = await req.json();
    const { amount, estimatedHours, proposedStartDate, message } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid bid amount is required' },
        { status: 400 }
      );
    }

    // Find contractor profile for this user
    const contractor = await prisma.contractor.findFirst({
      where: { userId: session.user.id },
    });

    if (!contractor) {
      return NextResponse.json(
        { success: false, error: 'You must have a contractor profile to submit bids' },
        { status: 403 }
      );
    }

    // Verify work order exists and is open for bids
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: 'Work order not found' },
        { status: 404 }
      );
    }

    if (!workOrder.isOpenBid || workOrder.status !== 'open') {
      return NextResponse.json(
        { success: false, error: 'This job is not open for bidding' },
        { status: 400 }
      );
    }

    // Check if bid deadline has passed
    if (workOrder.bidDeadline && new Date(workOrder.bidDeadline) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Bidding deadline has passed' },
        { status: 400 }
      );
    }

    // Check if contractor already submitted a bid
    const existingBid = await prisma.workOrderBid.findUnique({
      where: {
        workOrderId_contractorId: {
          workOrderId,
          contractorId: contractor.id,
        },
      },
    });

    if (existingBid) {
      // Update existing bid
      const updatedBid = await prisma.workOrderBid.update({
        where: { id: existingBid.id },
        data: {
          amount: parseFloat(amount),
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
          proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : null,
          message: message || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Bid updated successfully',
        bid: updatedBid,
      });
    }

    // Create new bid
    const bid = await prisma.workOrderBid.create({
      data: {
        workOrderId,
        contractorId: contractor.id,
        amount: parseFloat(amount),
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : null,
        message: message || null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bid submitted successfully',
      bid,
    });
  } catch (error) {
    console.error('Error submitting bid:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit bid' },
      { status: 500 }
    );
  }
}

// GET - Get bids for a work order (for landlords) or contractor's bid
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id: workOrderId } = await params;

    // Check if user is a contractor
    const contractor = await prisma.contractor.findFirst({
      where: { userId: session.user.id },
    });

    if (contractor) {
      // Return contractor's own bid
      const bid = await prisma.workOrderBid.findUnique({
        where: {
          workOrderId_contractorId: {
            workOrderId,
            contractorId: contractor.id,
          },
        },
      });

      return NextResponse.json({
        success: true,
        myBid: bid,
      });
    }

    // Check if user is the landlord who owns this work order
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        landlord: { select: { ownerUserId: true } },
        bids: {
          include: {
            contractor: {
              select: {
                id: true,
                name: true,
                email: true,
                specialties: true,
                isPaymentReady: true,
                user: {
                  select: { image: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: 'Work order not found' },
        { status: 404 }
      );
    }

    if (workOrder.landlord.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view bids' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      bids: workOrder.bids.map((b) => ({
        id: b.id,
        amount: b.amount.toString(),
        estimatedHours: b.estimatedHours?.toString() || null,
        proposedStartDate: b.proposedStartDate,
        message: b.message,
        status: b.status,
        createdAt: b.createdAt,
        contractor: {
          id: b.contractor.id,
          name: b.contractor.name,
          email: b.contractor.email,
          specialties: b.contractor.specialties,
          isPaymentReady: b.contractor.isPaymentReady,
          image: b.contractor.user?.image,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}
