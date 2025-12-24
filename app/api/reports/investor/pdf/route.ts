import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateInvestorReportPdf, generateFinancialCSV } from '@/lib/services/report-pdf.service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reportData, format } = body;

    if (!reportData) {
      return NextResponse.json({ message: 'Report data required' }, { status: 400 });
    }

    if (format === 'csv') {
      const csv = generateFinancialCSV(reportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="investor-report-${reportData.periodLabel.replace(/\s+/g, '-')}.csv"`,
        },
      });
    }

    // Generate PDF
    const pdfBuffer = await generateInvestorReportPdf(reportData);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="investor-report-${reportData.periodLabel.replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ message: 'Failed to generate PDF' }, { status: 500 });
  }
}
