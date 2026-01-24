import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { JobsMobileList, JobsDesktopTable } from '@/components/contractor/jobs-list';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Jobs | Contractor Dashboard',
};

export default async function ContractorJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Get contractor profile
  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, businessName: true },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  const params = await searchParams;
  const statusFilter = params.status;
  const searchQuery = params.search;

  // Build where clause
  const where: any = {
    contractorId: contractorProfile.id,
  };

  if (statusFilter && statusFilter !== 'all') {
    where.status = statusFilter;
  }

  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { jobNumber: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Fetch jobs
  const jobsRaw = await prisma.contractorJob.findMany({
    where,
    include: {
      customer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Serialize jobs to convert Decimal to number
  const jobs = jobsRaw.map((job) => ({
    ...job,
    estimatedCost: job.estimatedCost ? Number(job.estimatedCost) : null,
    actualCost: job.actualCost ? Number(job.actualCost) : null,
    laborCost: job.laborCost ? Number(job.laborCost) : null,
    materialCost: job.materialCost ? Number(job.materialCost) : null,
    profitMargin: job.profitMargin ? Number(job.profitMargin) : null,
  }));

  // Get status counts
  const [
    allCount,
    quotedCount,
    approvedCount,
    scheduledCount,
    inProgressCount,
    completedCount,
    onHoldCount,
  ] = await Promise.all([
    prisma.contractorJob.count({ where: { contractorId: contractorProfile.id } }),
    prisma.contractorJob.count({
      where: { contractorId: contractorProfile.id, status: 'quoted' },
    }),
    prisma.contractorJob.count({
      where: { contractorId: contractorProfile.id, status: 'approved' },
    }),
    prisma.contractorJob.count({
      where: { contractorId: contractorProfile.id, status: 'scheduled' },
    }),
    prisma.contractorJob.count({
      where: { contractorId: contractorProfile.id, status: 'in_progress' },
    }),
    prisma.contractorJob.count({
      where: { contractorId: contractorProfile.id, status: 'completed' },
    }),
    prisma.contractorJob.count({
      where: { contractorId: contractorProfile.id, status: 'on_hold' },
    }),
  ]);

  const statusFilters = [
    { label: 'All Jobs', value: 'all', count: allCount },
    { label: 'Quoted', value: 'quoted', count: quotedCount },
    { label: 'Approved', value: 'approved', count: approvedCount },
    { label: 'Scheduled', value: 'scheduled', count: scheduledCount },
    { label: 'In Progress', value: 'in_progress', count: inProgressCount },
    { label: 'Completed', value: 'completed', count: completedCount },
    { label: 'On Hold', value: 'on_hold', count: onHoldCount },
  ];

  return (
    <div className='w-full space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-black mb-1'>
            Jobs
          </h1>
          <p className='text-xs sm:text-sm text-black'>
            Manage your projects from quote to completion
          </p>
        </div>
        <Link href='/contractor/leads'>
          <Button className='bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-gray-900 border-2 border-black shadow-xl'>
            <Plus className='h-4 w-4 mr-2' />
            New Job from Lead
          </Button>
        </Link>
      </div>

      {/* Status Filters */}
      <div className='relative rounded-xl border-2 border-black shadow-xl overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-r from-violet-100 to-purple-100' />
        <div className='relative p-3 sm:p-4'>
          <div className='flex items-center gap-2 mb-3'>
            <Filter className='h-4 w-4 text-black' />
            <h3 className='text-sm font-bold text-black'>Filter by Status</h3>
          </div>
          <div className='flex flex-wrap gap-2'>
            {statusFilters.map((filter) => {
              const isActive = !statusFilter
                ? filter.value === 'all'
                : statusFilter === filter.value;

              return (
                <Link
                  key={filter.value}
                  href={`/contractor/jobs${filter.value !== 'all' ? `?status=${filter.value}` : ''}`}
                >
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    size='sm'
                    className={
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-gray-900 border-2 border-black'
                        : 'bg-white text-black border-2 border-black hover:bg-violet-50'
                    }
                  >
                    {filter.label}
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                        isActive ? 'bg-white/20' : 'bg-black/10'
                      }`}
                    >
                      {filter.count}
                    </span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className='relative rounded-xl border-2 border-black shadow-xl overflow-hidden bg-white'>
        <div className='p-4'>
          <JobsMobileList jobs={jobs} />
          <JobsDesktopTable jobs={jobs} />
        </div>
      </div>

      {/* Empty State */}
      {jobs.length === 0 && (
        <div className='relative rounded-xl border-2 border-black shadow-xl overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-r from-violet-100 to-purple-100' />
          <div className='relative p-8 text-center'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-white border-2 border-black flex items-center justify-center'>
              <Plus className='h-8 w-8 text-violet-600' />
            </div>
            <h3 className='text-lg font-bold text-black mb-2'>No jobs yet</h3>
            <p className='text-sm text-black/70 mb-4'>
              Start by responding to leads from the marketplace and converting them to jobs.
            </p>
            <Link href='/contractor/leads'>
              <Button className='bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-gray-900 border-2 border-black'>
                View Leads
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
