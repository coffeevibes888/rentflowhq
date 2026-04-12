import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { NextResponse } from 'next/server';
import { eventBus } from '@/lib/event-system';
import { checkLimit } from '@/lib/services/contractor-feature-gate';
import { incrementJobCount } from '@/lib/services/contractor-usage-tracker';
import { runBackgroundOps } from '@/lib/middleware/contractor-background-ops';
import { 
  SubscriptionLimitError, 
  formatSubscriptionError, 
  logSubscriptionError 
} from '@/lib/errors/subscription-errors';

// GET - List all jobs for contractor
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'contractor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    // Run background operations (daily check, monthly reset)
    await runBackgroundOps(contractorProfile.id);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const jobs = await prisma.contractorJob.findMany({
      where: {
        contractorId: contractorProfile.id,
        ...(status && { status }),
        ...(customerId && { customerId }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
            expenses: true,
            changeOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// POST - Create new job
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'contractor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    // Run background operations (ensures monthly reset happens before checking limits)
    await runBackgroundOps(contractorProfile.id);

    // Check subscription limit for active jobs
    const limitCheck = await checkLimit(contractorProfile.id, 'activeJobs');
    if (!limitCheck.allowed) {
      const error = new SubscriptionLimitError(
        'active jobs',
        limitCheck.current,
        limitCheck.limit,
        contractorProfile.subscriptionTier || 'starter'
      );
      
      logSubscriptionError(error, {
        contractorId: contractorProfile.id,
        feature: 'activeJobs',
        action: 'create_job',
      });
      
      const formatted = formatSubscriptionError(error);
      return NextResponse.json(formatted.body, { status: formatted.status });
    }

    const body = await request.json();

    // Generate job number
    const year = new Date().getFullYear();
    const lastJob = await prisma.contractorJob.findFirst({
      where: {
        contractorId: contractorProfile.id,
        jobNumber: { startsWith: `JOB-${year}-` },
      },
      orderBy: { jobNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastJob) {
      const lastNumber = parseInt(lastJob.jobNumber.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    const jobNumber = `JOB-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Create job
    const job = await prisma.contractorJob.create({
      data: {
        contractorId: contractorProfile.id,
        jobNumber,
        title: body.title,
        description: body.description,
        jobType: body.jobType,
        status: body.status || 'quoted',
        customerId: body.customerId,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        estimatedCost: body.estimatedCost,
        laborCost: body.laborCost,
        materialCost: body.materialCost,
        estimatedStartDate: body.estimatedStartDate,
        estimatedEndDate: body.estimatedEndDate,
        estimatedHours: body.estimatedHours,
        assignedEmployeeIds: body.assignedEmployeeIds || [],
        notes: body.notes,
        tags: body.tags || [],
        priority: body.priority || 'normal',
      },
      include: {
        customer: true,
      },
    });

    // Increment job count after successful creation
    await incrementJobCount(contractorProfile.id);

    // Emit event for job creation
    await eventBus.emit('contractor.job.created', {
      jobId: job.id,
      contractorId: contractorProfile.id,
      customerId: job.customerId,
      jobNumber: job.jobNumber,
      title: job.title,
      status: job.status,
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    // Handle subscription errors
    if (error instanceof SubscriptionLimitError) {
      const formatted = formatSubscriptionError(error);
      return NextResponse.json(formatted.body, { status: formatted.status });
    }
    
    console.error('Error creating job:', error);
    logSubscriptionError(error, {
      action: 'create_job',
      error: 'unexpected_error',
    });
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
