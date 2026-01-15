import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ContractorInvoicingService } from '@/lib/services/contractor-invoicing';
import { prisma } from '@/db/prisma';

/**
 * POST /api/contractor/invoices/[id]/send
 * Send an invoice to the customer via email
 */
export async function POST(
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
    const invoice = await prisma.contractorInvoice.findUnique({
      where: { id: params.id },
      select: { contractorId: true, status: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.contractorId !== contractor.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If invoice is draft, update to sent status first
    if (invoice.status === 'draft') {
      await prisma.contractorInvoice.update({
        where: { id: params.id },
        data: { status: 'sent' },
      });
    }

    const result = await ContractorInvoicingService.sendInvoice(params.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send invoice' },
      { status: 500 }
    );
  }
}
