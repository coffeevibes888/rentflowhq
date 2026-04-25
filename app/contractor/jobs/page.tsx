import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { JobsMobileList, JobsDesktopTable } from '@/components/contractor/jobs-list';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Briefcase, Info } from 'lucide-react';
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
        <div className='flex gap-2'>
          <Link href='/contractors?view=jobs'>
            <Button 
              variant='outline'
              className='bg-white hover:bg-gray-50 text-gray-900 border-2 border-black shadow-lg'
            >
              <Briefcase className='h-4 w-4 mr-2' />
              Browse Jobs
            </Button>
          </Link>
          <Link href='/contractor/jobs/new'>
            <Button className='bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 border border-amber-600/50 shadow-lg font-semibold'>
              <Plus className='h-4 w-4 mr-2' />
              Create New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* How Jobs Work - Info Banner */}
      <div className='relative rounded-xl border border-slate-700 shadow-xl overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' />
        <div className='relative p-4'>
          <div className='flex items-start gap-3'>
            <div className='p-2 rounded-lg bg-amber-500/20 shrink-0'>
              <Info className='h-4 w-4 text-amber-400' />
            </div>
            <div className='space-y-1'>
              <h4 className='text-sm font-bold text-white'>How do jobs get created?</h4>
              <p className='text-xs text-slate-400 leading-relaxed'>
                Jobs are your own business projects. You can create them manually with the button above, or they get auto-created when a customer accepts one of your quotes from the marketplace. Jobs track everything — timeline, costs, photos, contracts, and payments. This is different from <Link href='/contractor/work-orders' className='text-amber-400 hover:text-amber-300 underline'>Work Orders</Link>, which come from property managers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className='relative rounded-xl border border-slate-700 shadow-xl overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' />
        <div className='relative p-3 sm:p-4'>
          <div className='flex items-center gap-2 mb-3'>
            <Filter className='h-4 w-4 text-amber-400' />
            <h3 className='text-sm font-bold text-white'>Filter by Status</h3>
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
                    variant='outline'
                    size='sm'
                    className={
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 border-amber-500 font-semibold shadow-md hover:from-amber-600 hover:to-yellow-600'
                        : 'bg-slate-800/60 text-slate-300 border-slate-600/60 hover:border-amber-500/50 hover:text-white hover:bg-slate-700/60'
                    }
                  >
                    {filter.label}
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-slate-900/30 text-slate-900' : 'bg-slate-700/60 text-slate-400'
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
      <div className='relative rounded-xl border border-slate-700 shadow-xl overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' />
        <div className='relative p-4'>
          <JobsMobileList jobs={jobs} />
          <JobsDesktopTable jobs={jobs} />
        </div>
      </div>

      {/* Empty State */}
      {jobs.length === 0 && (
        <div className='relative rounded-xl border border-slate-700 shadow-xl overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' />
          <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(251,191,36,0.07),_transparent_65%)]' />
          <div className='relative p-8 text-center'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 border-2 border-amber-500/40 flex items-center justify-center'>
              <Plus className='h-8 w-8 text-amber-400' />
            </div>
            <h3 className='text-lg font-bold text-white mb-2'>No jobs yet</h3>
            <p className='text-sm text-slate-400 mb-4'>
              Create a job manually for your own clients, or respond to leads from the marketplace.
            </p>
            <div className='flex items-center justify-center gap-3'>
              <Link href='/contractor/jobs/new'>
                <Button className='bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-900 font-semibold border-0 shadow-lg'>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Job
                </Button>
              </Link>
              <Link href='/contractor/leads'>
                <Button variant='outline' className='border-slate-600 text-slate-300 hover:text-white hover:border-amber-500/50'>
                  <Briefcase className='h-4 w-4 mr-2' />
                  View Leads
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
