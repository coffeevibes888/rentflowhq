import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { DocumentService } from '@/lib/services/document.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user is a landlord
    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Get the document and verify it belongs to this landlord
    const document = await prisma.verificationDocument.findUnique({
      where: { id },
      select: {
        id: true,
        landlordId: true,
        applicationId: true,
      },
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    if (document.landlordId !== landlord.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Get secure URL
    const url = await DocumentService.getSecureUrl(id, 600, session.user.id, 'admin_view');

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error getting document URL:', error);
    return NextResponse.json(
      { message: 'Failed to get document URL' },
      { status: 500 }
    );
  }
}
