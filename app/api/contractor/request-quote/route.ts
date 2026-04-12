import { prisma } from '@/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      contractorId, 
      leadId, 
      customerId,
      title,
      description,
      basePrice,
      tax = 0,
      discount = 0,
      validUntil,
      paymentTerms,
      notes
    } = body;

    // Validate required fields
    if (!contractorId || !leadId || !customerId || !title || !basePrice || !validUntil) {
      return NextResponse.json(
        { error: 'Missing required fields: contractorId, leadId, customerId, title, basePrice, validUntil' },
        { status: 400 }
      );
    }

    // Calculate total price
    const totalPrice = basePrice - discount + tax;

    // Create a quote
    const quote = await prisma.contractorQuote.create({
      data: {
        contractorId,
        leadId,
        customerId,
        title,
        description,
        basePrice,
        discount,
        tax,
        totalPrice,
        validUntil: new Date(validUntil),
        paymentTerms,
        notes,
        status: 'pending',
      },
    });

    // TODO: Send email notification to customer about new quote
    // TODO: Send confirmation email to contractor

    return NextResponse.json(
      { success: true, quoteId: quote.id, quote },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}
