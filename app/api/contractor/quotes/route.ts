import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId,
      leadId,
      title,
      description,
      basePrice,
      estimatedHours,
      startDate,
      validUntil
    } = body;

    // Verify contractor profile
    const contractor = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor profile required' }, { status: 403 });
    }

    // Create the quote
    const quote = await prisma.contractorQuote.create({
      data: {
        contractorId: contractor.id,
        customerId,
        leadId,
        title,
        description,
        basePrice,
        totalPrice: basePrice, // Assuming no tax/discount logic for simple MVP
        estimatedHours,
        startDate: startDate ? new Date(startDate) : null,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
        status: 'pending',
      }
    });

    // Create a message in the thread (if threadId provided, or we need to find/create it)
    // For now, we'll assume the client handles the notification message or we add it later
    
    return NextResponse.json({ success: true, quoteId: quote.id });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}
