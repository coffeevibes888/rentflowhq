import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    // Verify the document belongs to this landlord
    const document = await prisma.scannedDocument.findFirst({
      where: {
        id,
        landlordId: landlord.id,
      },
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // Delete the document
    await prisma.scannedDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { message: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

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

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    const document = await prisma.scannedDocument.findFirst({
      where: {
        id,
        landlordId: landlord.id,
      },
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { message: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
