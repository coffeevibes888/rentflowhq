import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// POST - Send invoice via email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, businessName: true },
    });

    if (!contractorProfile) {
      return NextResponse.json(
        { error: 'Contractor profile not found' },
        { status: 404 }
      );
    }

    // Get invoice
    const invoice = await prisma.contractorInvoice.findFirst({
      where: {
        id: params.id,
        contractorId: contractorProfile.id,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Update invoice status to sent
    await prisma.contractorInvoice.update({
      where: { id: params.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });

    // TODO: Implement actual email sending
    // For now, just update the status
    // In production, integrate with SendGrid, Resend, or similar

    return NextResponse.json({ 
      success: true,
      message: 'Invoice sent successfully' 
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    );
  }
}
