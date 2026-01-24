import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import {
  TrendingUp,
  FileText,
  Briefcase,
  DollarSign,
  Users,
  Star,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { DashboardQuickActions } from '@/components/contractor/dashboard-quick-actions';

export const metadata: Metadata = {
  title: 'Contractor Dashboard',
};

export default async function ContractorDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Get contractor profile
  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      businessName: true,
      displayName: true,
      subscriptionTier: true,
      avgRating: true,
      totalReviews: true,
      completedJobs: true,
    },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  const contractorId = contractorProfile.id;

  // Date ranges
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Fetch dashboard stats
  const [
    // Leads
    leadsThisWeek,
    leadsThisMonth,
    hotLeads,
    
    // Jobs
    activeJobs,
    completedJobsThisMonth,
    
    // Quotes
    pendingQuotes,
    quotesThisWeek,
    
    // Revenue
    revenueThisMonth,
    revenueThisYear,
    
    // Team
    activeEmployees,
    
    // Recent activity
    recentLeads,
    recentJobs,
  ] = await Promise.all([
    // Leads this week
    prisma.contractorLeadMatch.count({
      where: {
        contractorId,
        createdAt: { gte: startOfWeek },
        status: { in: ['pending', 'sent', 'viewed'] },
      },
    }),
    
    // Leads this month
    prisma.contractorLeadMatch.count({
      where: {
        contractorId,
        createdAt: { gte: startOfMonth },
      },
    }),
    
    // Hot leads (high priority, not responded)
    prisma.contractorLead.count({
      where: {
        priority: 'hot',
        matches: {
          some: {
            contractorId,
            status: { in: ['pending', 'sent', 'viewed'] },
          },
        },
      },
    }),
    
    // Active jobs
    prisma.contractorJob.count({
      where: {
        contractorId,
        status: { in: ['approved', 'scheduled', 'in_progress'] },
      },
    }),
    
    // Completed jobs this month
    prisma.contractorJob.count({
      where: {
        contractorId,
        status: 'completed',
        actualEndDate: { gte: startOfMonth },
      },
    }),
    
    // Pending quotes
    prisma.contractorQuote.count({
      where: {
        contractorId: contractorId,
        status: 'pending',
      },
    }),
    
    // Quotes sent this week
    prisma.contractorQuote.count({
      where: {
        contractorId: contractorId,
        createdAt: { gte: startOfWeek },
      },
    }),
    
    // Revenue this month
    prisma.contractorJob.aggregate({
      where: {
        contractorId,
        status: { in: ['completed', 'invoiced', 'paid'] },
        actualEndDate: { gte: startOfMonth },
      },
      _sum: { actualCost: true },
    }),
    
    // Revenue this year
    prisma.contractorJob.aggregate({
      where: {
        contractorId,
        status: { in: ['completed', 'invoiced', 'paid'] },
        actualEndDate: { gte: startOfYear },
      },
      _sum: { actualCost: true },
    }),
    
    // Active employees
    prisma.contractorEmployee.count({
      where: {
        contractorId,
        status: 'active',
      },
    }),
    
    // Recent leads (last 5)
    prisma.contractorLeadMatch.findMany({
      where: { contractorId },
      include: {
        lead: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    
    // Recent jobs (last 5)
    prisma.contractorJob.findMany({
      where: { contractorId },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const revenueMonth = Number(revenueThisMonth._sum.actualCost || 0);
  const revenueYear = Number(revenueThisYear._sum.actualCost || 0);

  // Calculate conversion rate
  const conversionRate = leadsThisMonth > 0 
    ? ((completedJobsThisMonth / leadsThisMonth) * 100).toFixed(1)
    : '0.0';

  return (
    <div className='w-full space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-blue-600 mb-1'>
          Contractor Dashboard
        </h1>
        <p className='text-sm text-gray-600'>
          Marketplace performance and business overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className='relative rounded-2xl border-2 border-black shadow-xl overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-400 to-blue-500' />
        <div className='relative p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-bold text-black'>Your Dashboard</h3>
            <span className='text-xs text-black bg-white/30 px-2 py-1 rounded-full font-semibold'>
              Live
            </span>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
            {/* Leads This Week */}
            <Link
              href='/contractor/leads'
              className='rounded-xl bg-cyan-500/40 backdrop-blur-sm border border-white/20 p-4 space-y-2 hover:bg-cyan-500/50 transition-all'
            >
              <div className='flex items-center justify-between'>
                <div className='text-xs text-black font-medium'>Leads This Week</div>
                <TrendingUp className='h-4 w-4 text-black' />
              </div>
              <div className='text-3xl font-bold text-black'>{leadsThisWeek}</div>
              <div className='text-xs text-black'>
                {hotLeads} hot leads
              </div>
            </Link>

            {/* Active Jobs */}
            <Link
              href='/contractor/jobs'
              className='rounded-xl bg-cyan-500/40 backdrop-blur-sm border border-white/20 p-4 space-y-2 hover:bg-cyan-500/50 transition-all'
            >
              <div className='flex items-center justify-between'>
                <div className='text-xs text-black font-medium'>Active Jobs</div>
                <Briefcase className='h-4 w-4 text-black' />
              </div>
              <div className='text-3xl font-bold text-black'>{activeJobs}</div>
              <div className='text-xs text-black'>
                {completedJobsThisMonth} completed this month
              </div>
            </Link>

            {/* Pending Quotes */}
            <Link
              href='/contractor/operations?tab=estimates'
              className='rounded-xl bg-cyan-500/40 backdrop-blur-sm border border-white/20 p-4 space-y-2 hover:bg-cyan-500/50 transition-all'
            >
              <div className='flex items-center justify-between'>
                <div className='text-xs text-black font-medium'>Pending Quotes</div>
                <FileText className='h-4 w-4 text-black' />
              </div>
              <div className='text-3xl font-bold text-black'>{pendingQuotes}</div>
              <div className='text-xs text-black'>
                {quotesThisWeek} sent this week
              </div>
            </Link>

            {/* Revenue This Month */}
            <Link
              href='/contractor/finance'
              className='rounded-xl bg-cyan-500/40 backdrop-blur-sm border border-white/20 p-4 space-y-2 hover:bg-cyan-500/50 transition-all'
            >
              <div className='flex items-center justify-between'>
                <div className='text-xs text-black font-medium'>Revenue (Month)</div>
                <DollarSign className='h-4 w-4 text-black' />
              </div>
              <div className='text-3xl font-bold text-black'>
                {formatCurrency(revenueMonth)}
              </div>
              <div className='text-xs text-black'>
                {formatCurrency(revenueYear)} YTD
              </div>
            </Link>

            {/* Team Members */}
            <Link
              href='/contractor/team'
              className='rounded-xl bg-cyan-500/40 backdrop-blur-sm border border-white/20 p-4 space-y-2 hover:bg-cyan-500/50 transition-all'
            >
              <div className='flex items-center justify-between'>
                <div className='text-xs text-black font-medium'>Team Members</div>
                <Users className='h-4 w-4 text-black' />
              </div>
              <div className='text-3xl font-bold text-black'>{activeEmployees}</div>
              <div className='text-xs text-black'>Active employees</div>
            </Link>

            {/* Conversion Rate */}
            <div className='rounded-xl bg-cyan-500/40 backdrop-blur-sm border border-white/20 p-4 space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='text-xs text-black font-medium'>Conversion Rate</div>
                <CheckCircle className='h-4 w-4 text-black' />
              </div>
              <div className='text-3xl font-bold text-black'>{conversionRate}%</div>
              <div className='text-xs text-black'>
                Leads to jobs
              </div>
            </div>

            {/* Rating */}
            <Link
              href='/contractor/profile'
              className='rounded-xl bg-cyan-500/40 backdrop-blur-sm border border-white/20 p-4 space-y-2 hover:bg-cyan-500/50 transition-all'
            >
              <div className='flex items-center justify-between'>
                <div className='text-xs text-black font-medium'>Your Rating</div>
                <Star className='h-4 w-4 text-yellow-500' />
              </div>
              <div className='text-3xl font-bold text-black'>
                {contractorProfile.avgRating.toFixed(1)} ⭐
              </div>
              <div className='text-xs text-black'>
                {contractorProfile.totalReviews} reviews
              </div>
            </Link>

            {/* Marketplace Link */}
            <Link
              href='/contractors?view=jobs'
              className='rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 border border-white/20 p-4 space-y-2 hover:from-orange-500 hover:to-amber-600 transition-all'
            >
              <div className='flex items-center justify-between'>
                <div className='text-xs text-black font-medium'>Browse Jobs</div>
                <Briefcase className='h-4 w-4 text-black' />
              </div>
              <div className='text-3xl font-bold text-black'>Marketplace</div>
              <div className='text-xs text-black'>Find new work</div>
            </Link>
          </div>

          {/* Summary Bar */}
          <div className='mt-4 rounded-xl bg-cyan-500/30 backdrop-blur-sm border border-white/20 p-4'>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              <div className='space-y-1'>
                <div className='text-xs text-black font-medium uppercase tracking-wide'>
                  Leads (Month)
                </div>
                <div className='text-lg font-bold text-black'>{leadsThisMonth}</div>
              </div>
              <div className='space-y-1'>
                <div className='text-xs text-black font-medium uppercase tracking-wide'>
                  Jobs Done
                </div>
                <div className='text-lg font-bold text-black'>
                  {contractorProfile.completedJobs}
                </div>
              </div>
              <div className='space-y-1'>
                <div className='text-xs text-black font-medium uppercase tracking-wide'>
                  Avg Rating
                </div>
                <div className='text-lg font-bold text-black'>
                  {contractorProfile.avgRating.toFixed(1)} / 5.0
                </div>
              </div>
              <div className='space-y-1'>
                <div className='text-xs text-black font-medium uppercase tracking-wide'>
                  Team Size
                </div>
                <div className='text-lg font-bold text-black'>{activeEmployees}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className='text-lg font-semibold text-gray-900 mb-3'>Quick Actions</h2>
        <DashboardQuickActions />
      </div>

      {/* Recent Activity */}
      <div className='grid gap-4 md:grid-cols-2'>
        {/* Recent Leads */}
        <div className='rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-semibold text-gray-900'>Recent Leads</h3>
            <Link href='/contractor/leads' className='text-sm text-blue-600 hover:text-blue-700 font-medium'>
              View all →
            </Link>
          </div>
          <div className='space-y-2'>
            {recentLeads.length === 0 ? (
              <p className='text-sm text-gray-500 text-center py-8'>No leads yet</p>
            ) : (
              recentLeads.map((match) => (
                <Link
                  key={match.id}
                  href={`/contractor/leads/${match.lead.id}`}
                  className='block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>
                        {match.lead.projectTitle || match.lead.projectType}
                      </p>
                      <p className='text-xs text-gray-500 mt-0.5'>
                        {match.lead.propertyCity}, {match.lead.propertyState}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${
                        match.lead.priority === 'hot'
                          ? 'bg-red-100 text-red-700'
                          : match.lead.priority === 'warm'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {match.lead.priority}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className='rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-semibold text-gray-900'>Recent Jobs</h3>
            <Link href='/contractor/jobs' className='text-sm text-blue-600 hover:text-blue-700 font-medium'>
              View all →
            </Link>
          </div>
          <div className='space-y-2'>
            {recentJobs.length === 0 ? (
              <p className='text-sm text-gray-500 text-center py-8'>No jobs yet</p>
            ) : (
              recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/contractor/jobs/${job.id}`}
                  className='block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>{job.title}</p>
                      <p className='text-xs text-gray-500 mt-0.5'>
                        {job.customer?.name || 'No customer'}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${
                        job.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : job.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
