import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

// PATCH - Update applicant status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return NextResponse.json({ success: false, message: landlordResult.message }, { status: 400 });
    }

    const { applicantId } = await params;
    const body = await req.json();

    // Verify ownership
    const existingApplicant = await (prisma as any).jobApplicant.findFirst({
      where: { 
        id: applicantId,
        landlordId: landlordResult.landlord.id,
      },
    });

    if (!existingApplicant) {
      return NextResponse.json({ success: false, message: 'Applicant not found' }, { status: 404 });
    }

    const validStatuses = ['new', 'reviewing', 'interview', 'offered', 'hired', 'rejected'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    const applicant = await (prisma as any).jobApplicant.update({
      where: { id: applicantId },
      data: {
        status: body.status,
        notes: body.notes,
      },
    });

    return NextResponse.json({ success: true, applicant });
  } catch (error) {
    console.error('Update applicant error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update applicant' }, { status: 500 });
  }
}

// DELETE - Delete an applicant
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ applicantId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return NextResponse.json({ success: false, message: landlordResult.message }, { status: 400 });
    }

    const { applicantId } = await params;

    // Verify ownership
    const existingApplicant = await (prisma as any).jobApplicant.findFirst({
      where: { 
        id: applicantId,
        landlordId: landlordResult.landlord.id,
      },
    });

    if (!existingApplicant) {
      return NextResponse.json({ success: false, message: 'Applicant not found' }, { status: 404 });
    }

    await (prisma as any).jobApplicant.delete({
      where: { id: applicantId },
    });

    return NextResponse.json({ success: true, message: 'Applicant deleted' });
  } catch (error) {
    console.error('Delete applicant error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete applicant' }, { status: 500 });
  }
}
