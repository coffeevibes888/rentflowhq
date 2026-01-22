import { prisma } from '@/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractorId, name, email, phone, serviceType, description } = body;

    if (!contractorId || !name || !email || !phone || !serviceType || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a quote request record
    const quote = await prisma.contractorQuote.create({
      data: {
        contractorId,
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        serviceType,
        description,
        status: 'pending',
      },
    });

    // TODO: Send email notification to contractor about new quote request
    // TODO: Send confirmation email to client

    return NextResponse.json(
      { success: true, quoteId: quote.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quote request:', error);
    return NextResponse.json(
      { error: 'Failed to create quote request' },
      { status: 500 }
    );
  }
}
