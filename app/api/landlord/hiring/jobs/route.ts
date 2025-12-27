import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { checkFeatureAccess } from '@/lib/actions/subscription.actions';

// GET - List all job postings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return NextResponse.json({ success: false, message: landlordResult.message }, { status: 400 });
    }

    // Check enterprise access (hiring requires team management)
    const featureCheck = await checkFeatureAccess(landlordResult.landlord.id, 'teamManagement');
    if (!featureCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        message: 'Hiring features require Pro or Enterprise subscription',
        featureLocked: true,
      }, { status: 403 });
    }

    const jobs = await (prisma as any).jobPosting.findMany({
      where: { landlordId: landlordResult.landlord.id },
      include: {
        _count: { select: { applicants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      success: true, 
      jobs: jobs.map((j: any) => ({
        ...j,
        applicantCount: j._count.applicants,
      })),
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// POST - Create a new job posting
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return NextResponse.json({ success: false, message: landlordResult.message }, { status: 400 });
    }

    // Check enterprise access (hiring requires team management)
    const featureCheck = await checkFeatureAccess(landlordResult.landlord.id, 'teamManagement');
    if (!featureCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        message: 'Hiring features require Pro or Enterprise subscription',
        featureLocked: true,
      }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, type, location, salary, requirements, benefits, status } = body;

    if (!title || !description || !location) {
      return NextResponse.json({ success: false, message: 'Title, description, and location are required' }, { status: 400 });
    }

    const job = await (prisma as any).jobPosting.create({
      data: {
        landlordId: landlordResult.landlord.id,
        title,
        description,
        type: type || 'full-time',
        location,
        salary,
        requirements,
        benefits,
        status: status || 'draft',
      },
    });

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create job' }, { status: 500 });
  }
}
