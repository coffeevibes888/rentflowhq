import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ContractorInvoicingService } from '@/lib/services/contractor-invoicing';
import { prisma } from '@/db/prisma';

/**
 * GET /api/contractor/invoices/[id]
 * Get a specific invoice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const invoice = await ContractorInvoicingService.getInvoice(params.id);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify invoice belongs to contractor
    if (invoice.contractorId !== contractor.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contractor/invoices/[id]
 * Update an invoice (only drafts)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify invoice belongs to contractor
    const existingInvoice = await prisma.contractorInvoice.findUnique({
      where: { id: params.id },
      select: { contractorId: true, status: true },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (existingInvoice.contractorId !== contractor.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { lineItems, taxRate, notes, terms, dueDate, depositPaid } = body;

    // Validate line items if provided
    if (lineItems) {
      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        return NextResponse.json(
          { error: 'lineItems must be a non-empty array' },
          { status: 400 }
        );
      }

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
    }

    const invoice = await ContractorInvoicingService.updateInvoice(params.id, {
      lineItems,
      taxRate,
      notes,
      terms,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      depositPaid,
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contractor/invoices/[id]
 * Delete an invoice (only drafts)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify invoice belongs to contractor
    const existingInvoice = await prisma.contractorInvoice.findUnique({
      where: { id: params.id },
      select: { contractorId: true },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (existingInvoice.contractorId !== contractor.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ContractorInvoicingService.deleteInvoice(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
