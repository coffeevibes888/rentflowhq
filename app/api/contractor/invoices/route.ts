import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ContractorInvoicingService } from '@/lib/services/contractor-invoicing';
import { prisma } from '@/db/prisma';

/**
 * GET /api/contractor/invoices
 * Get all invoices for the authenticated contractor
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contractor profile
    const contractor = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined;
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined;

    const invoices = await ContractorInvoicingService.getInvoices(contractor.id, {
      status,
      startDate,
      endDate,
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contractor/invoices
 * Create a new invoice
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get contractor profile
    const contractor = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      customerId,
      jobId,
      appointmentId,
      lineItems,
      taxRate,
      notes,
      terms,
      dueDate,
      depositPaid,
    } = body;

    // Validate required fields
    if (!customerId || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, lineItems' },
        { status: 400 }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        { error: 'Missing required field: dueDate' },
        { status: 400 }
      );
    }

    // Validate line items
    for (const item of lineItems) {
      if (!item.description || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
        return NextResponse.json(
          { error: 'Invalid line item format' },
          { status: 400 }
        );
      }
      if (!['labor', 'material', 'other'].includes(item.type)) {
        return NextResponse.json(
          { error: 'Invalid line item type. Must be: labor, material, or other' },
          { status: 400 }
        );
      }
    }

    // Verify customer belongs to contractor
    const customer = await prisma.contractorCustomer.findUnique({
      where: { id: customerId },
      select: { contractorId: true },
    });

    if (!customer || customer.contractorId !== contractor.id) {
      return NextResponse.json(
        { error: 'Customer not found or does not belong to contractor' },
        { status: 404 }
      );
    }

    const invoice = await ContractorInvoicingService.createInvoice({
      contractorId: contractor.id,
      customerId,
      jobId,
      appointmentId,
      lineItems,
      taxRate,
      notes,
      terms,
      dueDate: new Date(dueDate),
      depositPaid,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
