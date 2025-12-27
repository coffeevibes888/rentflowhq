import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

// GET - Get a single job posting with applicants
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
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

    const { jobId } = await params;

    const job = await (prisma as any).jobPosting.findFirst({
      where: { 
        id: jobId,
        landlordId: landlordResult.landlord.id,
      },
      include: {
        applicants: {
          orderBy: { appliedAt: 'desc' },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Get job error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch job' }, { status: 500 });
  }
}

// PATCH - Update a job posting
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
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

    const { jobId } = await params;
    const body = await req.json();

    // Verify ownership
    const existingJob = await (prisma as any).jobPosting.findFirst({
      where: { 
        id: jobId,
        landlordId: landlordResult.landlord.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    const job = await (prisma as any).jobPosting.update({
      where: { id: jobId },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        location: body.location,
        salary: body.salary,
        requirements: body.requirements,
        benefits: body.benefits,
        status: body.status,
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update job' }, { status: 500 });
  }
}

// DELETE - Delete a job posting
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
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

    const { jobId } = await params;

    // Verify ownership
    const existingJob = await (prisma as any).jobPosting.findFirst({
      where: { 
        id: jobId,
        landlordId: landlordResult.landlord.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    await (prisma as any).jobPosting.delete({
      where: { id: jobId },
    });

    return NextResponse.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete job' }, { status: 500 });
  }
}
