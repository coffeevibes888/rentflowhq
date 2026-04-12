import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { JobMarketplace } from '@/components/contractor/job-marketplace';
import { Briefcase, TrendingUp, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Marketplace',
};

export default async function ContractorMarketplacePage({
  searchParams,
}: {
  searchParams: { category?: string; budget?: string; location?: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Get contractor profile
  const contractor = await prisma.contractorProfile.findFirst({
    where: { userId: session.user.id },
  });

  if (!contractor) {
    redirect('/onboarding/contractor');
  }

  // Get open jobs (using WorkOrder model for now, can be adapted)
  const openJobs = await prisma.workOrder.findMany({
    where: {
      status: 'open',
      isOpenBid: true,
      bidDeadline: {
        gte: new Date(),
      },
    },
    include: {
      landlord: {
        select: {
          companyName: true,
          logoUrl: true,
        },
      },
      _count: {
        select: {
          contractorBids: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Get contractor's active bids
  const myBids = await prisma.contractorBid.findMany({
    where: {
      contractorId: contractor.id,
      status: 'active',
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  // Calculate stats
  const totalJobs = openJobs.length;
  const avgBidsPerJob =
    openJobs.length > 0
      ? openJobs.reduce((sum, job) => sum + job._count.contractorBids, 0) / openJobs.length
      : 0;
  const myActiveBids = myBids.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-600">Job Marketplace</h1>
        <p className="text-sm text-gray-600 mt-1">
          Browse open jobs and submit competitive bids
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Open Jobs</p>
              <p className="text-3xl font-bold text-blue-600">{totalJobs}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-100">
              <TrendingUp className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Competition</p>
              <p className="text-3xl font-bold text-violet-600">
                {avgBidsPerJob.toFixed(1)} bids
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-700 font-medium">My Active Bids</p>
              <p className="text-3xl font-bold text-amber-600">{myActiveBids}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {searchParams && 'success' in searchParams && (
        <div className="rounded-lg bg-emerald-50 border-2 border-emerald-200 p-4">
          <p className="text-sm text-emerald-700 font-medium">
            ✓ Bid submitted successfully! The customer will review your bid and may contact you.
          </p>
        </div>
      )}

      {/* Job Marketplace */}
      <JobMarketplace
        jobs={openJobs}
        contractorId={contractor.id}
        myBids={myBids}
        filters={searchParams}
      />
    </div>
  );
}
