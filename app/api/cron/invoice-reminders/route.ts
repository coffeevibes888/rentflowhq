import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { ContractorInvoicingService } from '@/lib/services/contractor-invoicing';

/**
 * POST /api/cron/invoice-reminders
 * Send reminders for invoices overdue by 7 days
 * 
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
 * Run daily to check for overdue invoices
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find invoices that are:
    // 1. Not paid (status != 'paid')
    // 2. Due date was 7 days ago
    // 3. Haven't been reminded in the last 7 days (to avoid spam)
    const overdueInvoices = await prisma.contractorInvoice.findMany({
      where: {
        status: {
          not: 'paid',
        },
        dueDate: {
          lte: sevenDaysAgo,
        },
        OR: [
          { sentAt: null },
          {
            sentAt: {
              lte: sevenDaysAgo,
            },
          },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        dueDate: true,
        amountDue: true,
      },
    });

    console.log(`Found ${overdueInvoices.length} overdue invoices to remind`);

    const results = {
      total: overdueInvoices.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send reminders
    for (const invoice of overdueInvoices) {
      try {
        await ContractorInvoicingService.sendReminder(invoice.id);
        results.sent++;
        
        // Update invoice status to overdue if not already
        await prisma.contractorInvoice.update({
          where: { id: invoice.id },
          data: { status: 'overdue' },
        });
      } catch (error: any) {
        console.error(`Failed to send reminder for invoice ${invoice.invoiceNumber}:`, error);
        results.failed++;
        results.errors.push(`${invoice.invoiceNumber}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent} reminders, ${results.failed} failed`,
      results,
    });
  } catch (error: any) {
    console.error('Error in invoice reminders cron:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process invoice reminders' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/invoice-reminders
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Invoice reminders cron endpoint is active',
  });
}
