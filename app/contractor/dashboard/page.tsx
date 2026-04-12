import { Metadata } from 'next';
import { requireContractor } from '@/lib/auth-guard';
import { auth } from '@/auth';
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
  const session = await requireContractor();
  const { id: userId } = session.user;

  // Get contractor profile
  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId },
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
    return null; // requireContractor already handles redirect to /onboarding/contractor
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
    <div className='w-full space-y-4 sm:space-y-6'>
      <div>
        <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-black mb-1'>Contractor Dashboard</h1>
        <p className='text-xs sm:text-sm text-muted-foreground'>Marketplace performance and business overview.</p>
      </div>

      {/* Main Stats Dashboard - Light Rose/Orange Theme */}
      <div className='relative rounded-2xl md:rounded-3xl border border-rose-200 shadow-2xl overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-r from-rose-100 via-orange-50 to-rose-100' />
        <div className='relative p-4 md:p-6 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-base md:text-xl font-bold text-slate-900'>Contractor Dashboard</h3>
            <span className='text-[10px] bg-gradient-to-r from-rose-500 to-orange-500 text-white px-2 py-1 rounded-full font-semibold shadow-md'>PRO</span>
          </div>

          {/* Top Stats Row */}
          <div className='grid grid-cols-3 gap-2'>
            <div className='rounded-xl bg-gradient-to-r from-rose-500 via-rose-300 to-rose-500 border border-white p-3 space-y-1 shadow-lg'>
              <div className='text-[9px] md:text-[11px] text-slate-900 font-bold'>Active Jobs</div>
              <div className='text-xl md:text-2xl font-bold text-slate-900'>{activeJobs}</div>
              <div className='text-[8px] md:text-[10px] text-rose-800 font-semibold'>{completedJobsThisMonth} done this month</div>
            </div>
            <div className='rounded-xl bg-gradient-to-r from-amber-500 via-orange-200 to-amber-500 border border-white p-3 space-y-1 shadow-lg'>
              <div className='text-[9px] md:text-[11px] text-slate-900 font-bold'>Open Leads</div>
              <div className='text-xl md:text-2xl font-bold text-slate-900'>{leadsThisWeek}</div>
              <div className='text-[8px] md:text-[10px] text-amber-800 font-semibold'>{hotLeads} hot leads</div>
            </div>
            <div className='rounded-xl bg-gradient-to-r from-violet-500 via-purple-200 to-violet-500 border border-white p-3 space-y-1 shadow-lg'>
              <div className='text-[9px] md:text-[11px] text-slate-900 font-bold'>Team Members</div>
              <div className='text-xl md:text-2xl font-bold text-slate-900'>{activeEmployees}</div>
              <div className='text-[8px] md:text-[10px] text-violet-800 font-semibold'>Active employees</div>
            </div>
          </div>

          {/* Revenue Row */}
          <div className='grid grid-cols-2 gap-2'>
            <div className='rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-200 to-emerald-500 border border-white p-3 space-y-1 shadow-lg'>
              <div className='text-[9px] md:text-[11px] text-slate-900 font-bold'>Revenue This Month</div>
              <div className='text-lg md:text-xl font-bold text-slate-900'>{formatCurrency(revenueMonth)}</div>
              <div className='text-[8px] md:text-[10px] text-emerald-800 font-semibold'>{formatCurrency(revenueYear)} YTD</div>
            </div>
            <div className='rounded-xl bg-gradient-to-r from-orange-500 via-orange-200 to-orange-500 border border-white p-3 space-y-1 shadow-lg'>
              <div className='text-[9px] md:text-[11px] text-slate-900 font-bold'>Pending Quotes</div>
              <div className='text-lg md:text-xl font-bold text-slate-900'>{pendingQuotes}</div>
              <div className='text-[8px] md:text-[10px] text-orange-800 font-semibold'>{quotesThisWeek} sent this week</div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className='rounded-xl bg-gradient-to-r from-blue-500 via-blue-200 to-blue-500 border border-white p-3 space-y-1 shadow-lg'>
            <div className='flex items-center justify-between'>
              <div className='text-[9px] md:text-[11px] text-slate-900 font-bold'>Conversion Rate</div>
              <CheckCircle className='h-4 w-4 text-blue-600' />
            </div>
            <div className='text-lg md:text-xl font-bold text-slate-900'>{conversionRate}%</div>
            <div className='text-[8px] md:text-[10px] text-blue-800 font-semibold'>Leads to jobs</div>
          </div>

          {/* Recent Jobs List */}
          <div className='rounded-xl bg-white/60 border border-rose-100 p-3 space-y-2 shadow-sm'>
            <div className='text-[10px] text-slate-600 font-bold uppercase tracking-wide'>Recent Jobs</div>
            {recentJobs.length === 0 ? (
              <p className='text-xs text-slate-500 text-center py-4'>No jobs yet</p>
            ) : (
              recentJobs.slice(0, 3).map((job) => (
                <Link key={job.id} href={`/contractor/jobs/${job.id}`}>
                  <div className='flex items-center justify-between py-2 border-b border-rose-100 last:border-0 hover:bg-white/80 rounded px-2 -mx-2 transition-colors'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-[10px] md:text-xs text-slate-900 font-semibold truncate'>{job.title}</p>
                      <p className='text-[9px] text-slate-600'>{job.customer?.name || 'No customer'}</p>
                    </div>
                    <span className={`text-[9px] font-bold ${
                      job.status === 'completed' ? 'text-emerald-600'
                      : job.status === 'in_progress' ? 'text-amber-600'
                      : 'text-blue-600'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Bottom Stats Bar */}
          <div className='rounded-xl bg-white/60 border border-rose-100 p-3 shadow-sm'>
            <div className='grid grid-cols-4 gap-2 text-center'>
              <div>
                <div className='text-[9px] text-slate-600 font-bold uppercase tracking-wide'>Rating</div>
                <div className='text-sm md:text-base font-bold text-slate-900'>{contractorProfile.avgRating.toFixed(1)}★</div>
              </div>
              <div>
                <div className='text-[9px] text-slate-600 font-bold uppercase tracking-wide'>Reviews</div>
                <div className='text-sm md:text-base font-bold text-slate-900'>{contractorProfile.totalReviews}</div>
              </div>
              <div>
                <div className='text-[9px] text-slate-600 font-bold uppercase tracking-wide'>Jobs YTD</div>
                <div className='text-sm md:text-base font-bold text-slate-900'>{contractorProfile.completedJobs}</div>
              </div>
              <div>
                <div className='text-[9px] text-slate-600 font-bold uppercase tracking-wide'>Leads</div>
                <div className='text-sm md:text-base font-bold text-slate-900'>{leadsThisMonth}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className='text-sm sm:text-base font-semibold text-black mb-3'>Quick Actions</h2>
        <DashboardQuickActions />
      </div>

      {/* Recent Activity */}
      <div className='grid gap-3 sm:gap-4 md:grid-cols-2'>
        {/* Recent Leads */}
        <div className='relative rounded-xl sm:rounded-2xl border border-rose-200 shadow-xl overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-r from-rose-100 via-orange-50 to-rose-100' />
          <div className='relative p-3 sm:p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm sm:text-base font-bold text-slate-900'>Recent Leads</h3>
              <Link href='/contractor/leads' className='text-[10px] sm:text-xs text-rose-600 font-semibold hover:underline'>
                View all →
              </Link>
            </div>
            <div className='space-y-2'>
              {recentLeads.length === 0 ? (
                <p className='text-xs text-slate-500 text-center py-6'>No leads yet</p>
              ) : (
                recentLeads.map((match) => (
                  <Link
                    key={match.id}
                    href={`/contractor/leads/${match.lead.id}`}
                    className='flex items-start justify-between p-2.5 rounded-xl bg-white border border-rose-100 hover:border-rose-300 hover:shadow-md transition-all'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs sm:text-sm font-semibold text-slate-900 truncate'>
                        {match.lead.projectTitle || match.lead.projectType}
                      </p>
                      <p className='text-[9px] sm:text-[10px] text-slate-600 mt-0.5'>
                        {match.lead.propertyCity}, {match.lead.propertyState}
                      </p>
                    </div>
                    <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 border ${
                      match.lead.priority === 'hot' ? 'bg-rose-100 text-rose-700 border-rose-300'
                      : match.lead.priority === 'warm' ? 'bg-amber-100 text-amber-700 border-amber-300'
                      : 'bg-blue-100 text-blue-700 border-blue-300'
                    }`}>
                      {match.lead.priority}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className='relative rounded-xl sm:rounded-2xl border border-rose-200 shadow-xl overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-r from-rose-100 via-orange-50 to-rose-100' />
          <div className='relative p-3 sm:p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm sm:text-base font-bold text-slate-900'>Recent Jobs</h3>
              <Link href='/contractor/jobs' className='text-[10px] sm:text-xs text-rose-600 font-semibold hover:underline'>
                View all →
              </Link>
            </div>
            <div className='space-y-2'>
              {recentJobs.length === 0 ? (
                <p className='text-xs text-slate-500 text-center py-6'>No jobs yet</p>
              ) : (
                recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/contractor/jobs/${job.id}`}
                    className='flex items-start justify-between p-2.5 rounded-xl bg-white border border-rose-100 hover:border-rose-300 hover:shadow-md transition-all'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs sm:text-sm font-semibold text-slate-900 truncate'>{job.title}</p>
                      <p className='text-[9px] sm:text-[10px] text-slate-600 mt-0.5'>
                        {job.customer?.name || 'No customer'}
                      </p>
                    </div>
                    <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 border ${
                      job.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : job.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-amber-100 text-amber-700 border-amber-300'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
