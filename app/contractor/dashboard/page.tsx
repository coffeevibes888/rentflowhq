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

      {/* Main Stats Dashboard - Dark Slate + Amber Gold Theme */}
      <div className='relative rounded-2xl md:rounded-3xl border border-slate-700 shadow-2xl overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' />
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.12),_transparent_60%)]' />
        <div className='relative p-4 md:p-6 flex flex-col gap-3'>

          <div className='flex items-center justify-between mb-1'>
            <h3 className='text-base md:text-lg font-bold text-white tracking-tight'>Business Overview</h3>
            <span className='text-[10px] bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 px-2.5 py-1 rounded-full font-bold shadow'>{(contractorProfile.subscriptionTier ?? 'starter').toUpperCase()}</span>
          </div>

          {/* Top Stats Row */}
          <div className='grid grid-cols-3 gap-2'>
            <div className='rounded-xl bg-slate-800/80 border border-slate-600/60 p-3 space-y-1 shadow-lg hover:border-amber-500/40 transition-colors'>
              <div className='flex items-center gap-1.5'>
                <Briefcase className='h-3 w-3 text-amber-400' />
                <div className='text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase tracking-wide'>Active Jobs</div>
              </div>
              <div className='text-xl md:text-2xl font-bold text-white'>{activeJobs}</div>
              <div className='text-[8px] md:text-[9px] text-amber-400/80 font-medium'>{completedJobsThisMonth} done this month</div>
            </div>
            <div className='rounded-xl bg-slate-800/80 border border-slate-600/60 p-3 space-y-1 shadow-lg hover:border-amber-500/40 transition-colors'>
              <div className='flex items-center gap-1.5'>
                <TrendingUp className='h-3 w-3 text-amber-400' />
                <div className='text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase tracking-wide'>Open Leads</div>
              </div>
              <div className='text-xl md:text-2xl font-bold text-white'>{leadsThisWeek}</div>
              <div className='text-[8px] md:text-[9px] text-amber-400/80 font-medium'>{hotLeads} hot leads</div>
            </div>
            <div className='rounded-xl bg-slate-800/80 border border-slate-600/60 p-3 space-y-1 shadow-lg hover:border-amber-500/40 transition-colors'>
              <div className='flex items-center gap-1.5'>
                <Users className='h-3 w-3 text-amber-400' />
                <div className='text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase tracking-wide'>Team</div>
              </div>
              <div className='text-xl md:text-2xl font-bold text-white'>{activeEmployees}</div>
              <div className='text-[8px] md:text-[9px] text-amber-400/80 font-medium'>Active employees</div>
            </div>
          </div>

          {/* Revenue Row */}
          <div className='grid grid-cols-2 gap-2'>
            <div className='rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/30 p-3 space-y-1 shadow-lg'>
              <div className='flex items-center gap-1.5'>
                <DollarSign className='h-3 w-3 text-amber-400' />
                <div className='text-[9px] md:text-[10px] text-amber-300/80 font-semibold uppercase tracking-wide'>Revenue This Month</div>
              </div>
              <div className='text-lg md:text-xl font-bold text-white'>{formatCurrency(revenueMonth)}</div>
              <div className='text-[8px] md:text-[9px] text-amber-400/70 font-medium'>{formatCurrency(revenueYear)} YTD</div>
            </div>
            <div className='rounded-xl bg-slate-800/80 border border-slate-600/60 p-3 space-y-1 shadow-lg hover:border-amber-500/40 transition-colors'>
              <div className='flex items-center gap-1.5'>
                <FileText className='h-3 w-3 text-slate-400' />
                <div className='text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase tracking-wide'>Pending Quotes</div>
              </div>
              <div className='text-lg md:text-xl font-bold text-white'>{pendingQuotes}</div>
              <div className='text-[8px] md:text-[9px] text-slate-500 font-medium'>{quotesThisWeek} sent this week</div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className='rounded-xl bg-slate-800/60 border border-slate-600/60 p-3 shadow-lg'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <CheckCircle className='h-3 w-3 text-emerald-400' />
                <div className='text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase tracking-wide'>Conversion Rate</div>
              </div>
              <div className='text-lg md:text-xl font-bold text-white'>{conversionRate}%</div>
            </div>
            <div className='mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden'>
              <div className='h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all' style={{ width: `${Math.min(Number(conversionRate), 100)}%` }} />
            </div>
            <div className='text-[8px] text-slate-500 mt-1'>Leads converted to jobs</div>
          </div>

          {/* Recent Jobs List */}
          <div className='rounded-xl bg-slate-800/40 border border-slate-700/60 p-3 space-y-2'>
            <div className='text-[10px] text-slate-400 font-bold uppercase tracking-widest'>Recent Jobs</div>
            {recentJobs.length === 0 ? (
              <p className='text-xs text-slate-500 text-center py-4'>No jobs yet</p>
            ) : (
              recentJobs.slice(0, 3).map((job) => (
                <Link key={job.id} href={`/contractor/jobs/${job.id}`}>
                  <div className='flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 rounded px-2 -mx-2 transition-colors'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-[10px] md:text-xs text-white font-semibold truncate'>{job.title}</p>
                      <p className='text-[9px] text-slate-500'>{job.customer?.name || 'No customer'}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400'
                      : job.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-600/60 text-slate-300'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Bottom Stats Bar */}
          <div className='rounded-xl bg-slate-800/40 border border-slate-700/60 p-3'>
            <div className='grid grid-cols-4 gap-2 text-center'>
              <div>
                <div className='text-[9px] text-slate-500 font-bold uppercase tracking-wide'>Rating</div>
                <div className='text-sm md:text-base font-bold text-amber-400'>{contractorProfile.avgRating.toFixed(1)}★</div>
              </div>
              <div>
                <div className='text-[9px] text-slate-500 font-bold uppercase tracking-wide'>Reviews</div>
                <div className='text-sm md:text-base font-bold text-white'>{contractorProfile.totalReviews}</div>
              </div>
              <div>
                <div className='text-[9px] text-slate-500 font-bold uppercase tracking-wide'>Jobs YTD</div>
                <div className='text-sm md:text-base font-bold text-white'>{contractorProfile.completedJobs}</div>
              </div>
              <div>
                <div className='text-[9px] text-slate-500 font-bold uppercase tracking-wide'>Leads</div>
                <div className='text-sm md:text-base font-bold text-white'>{leadsThisMonth}</div>
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
        <div className='relative rounded-xl sm:rounded-2xl border border-slate-700 shadow-xl overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' />
          <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(251,191,36,0.08),_transparent_60%)]' />
          <div className='relative p-3 sm:p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm sm:text-base font-bold text-white'>Recent Leads</h3>
              <Link href='/contractor/leads' className='text-[10px] sm:text-xs text-amber-400 font-semibold hover:text-amber-300 transition-colors'>
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
                    className='flex items-start justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/40 hover:bg-slate-700/60 transition-all'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs sm:text-sm font-semibold text-white truncate'>
                        {match.lead.projectTitle || match.lead.projectType}
                      </p>
                      <p className='text-[9px] sm:text-[10px] text-slate-400 mt-0.5'>
                        {match.lead.propertyCity}, {match.lead.propertyState}
                      </p>
                    </div>
                    <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 ${
                      match.lead.priority === 'hot' ? 'bg-amber-500/20 text-amber-400'
                      : match.lead.priority === 'warm' ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-slate-600/60 text-slate-300'
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
        <div className='relative rounded-xl sm:rounded-2xl border border-slate-700 shadow-xl overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' />
          <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.08),_transparent_60%)]' />
          <div className='relative p-3 sm:p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm sm:text-base font-bold text-white'>Recent Jobs</h3>
              <Link href='/contractor/jobs' className='text-[10px] sm:text-xs text-amber-400 font-semibold hover:text-amber-300 transition-colors'>
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
                    className='flex items-start justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/40 hover:bg-slate-700/60 transition-all'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs sm:text-sm font-semibold text-white truncate'>{job.title}</p>
                      <p className='text-[9px] sm:text-[10px] text-slate-400 mt-0.5'>
                        {job.customer?.name || 'No customer'}
                      </p>
                    </div>
                    <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 ${
                      job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400'
                      : job.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-600/60 text-slate-300'
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
