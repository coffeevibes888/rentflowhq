import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quoteId = params.id;

    // Get the quote
    const quote = await prisma.contractorQuote.findUnique({
      where: { id: quoteId },
      include: {
        customer: {
          select: { userId: true },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Verify ownership
    if (quote.customer.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already accepted/rejected
    if (quote.status !== 'pending') {
      return NextResponse.json(
        { error: 'Quote has already been responded to' },
        { status: 400 }
      );
    }

    // Update quote status
    const updatedQuote = await prisma.contractorQuote.update({
      where: { id: quoteId },
      data: {
        status: 'accepted',
        respondedAt: new Date(),
      },
    });

    // Create a job from the accepted quote
    await prisma.contractorJob.create({
      data: {
        title: quote.title,
        description: quote.description,
        contractorId: quote.contractorId,
        customerId: quote.customerId,
        status: 'approved',
        estimatedCost: quote.estimatedCost,
        priority: 'medium',
        category: 'general',
      },
    });

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
    });
  } catch (error) {
    console.error('Error accepting quote:', error);
    return NextResponse.json(
      { error: 'Failed to accept quote' },
      { status: 500 }
    );
  }
}
