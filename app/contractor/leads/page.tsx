import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { LeadsKanban } from '@/components/contractor/leads-kanban';

export const metadata: Metadata = {
  title: 'Leads | Contractor Dashboard',
};

export default async function ContractorLeadsPage() {
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
      subscriptionTier: true,
    },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  // Fetch all lead matches for this contractor
  const leadMatches = await prisma.contractorLeadMatch.findMany({
    where: {
      contractorId: contractorProfile.id,
    },
    include: {
      lead: {
        select: {
          id: true,
          projectType: true,
          projectTitle: true,
          projectDescription: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          propertyAddress: true,
          propertyCity: true,
          propertyState: true,
          propertyZip: true,
          budgetMin: true,
          budgetMax: true,
          timeline: true,
          urgency: true,
          priority: true,
          stage: true,
          status: true,
          leadScore: true,
          assignedToId: true,
          lastContactDate: true,
          nextFollowUpDate: true,
          emailOpens: true,
          emailClicks: true,
          estimateViews: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get employees for assignment
  const employees = await prisma.contractorEmployee.findMany({
    where: {
      contractorId: contractorProfile.id,
      status: 'active',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });

  // Serialize dates
  const serializedLeadMatches = leadMatches.map((match) => ({
    ...match,
    createdAt: match.createdAt.toISOString(),
    sentAt: match.sentAt?.toISOString() || null,
    viewedAt: match.viewedAt?.toISOString() || null,
    respondedAt: match.respondedAt?.toISOString() || null,
    quotedAt: match.quotedAt?.toISOString() || null,
    lead: {
      ...match.lead,
      lastContactDate: match.lead.lastContactDate?.toISOString() || null,
      nextFollowUpDate: match.lead.nextFollowUpDate?.toISOString() || null,
      createdAt: match.lead.createdAt.toISOString(),
    },
  }));

  // Calculate stats
  const stats = {
    total: leadMatches.length,
    new: leadMatches.filter((m) => m.lead.stage === 'new').length,
    contacted: leadMatches.filter((m) => m.lead.stage === 'contacted').length,
    qualified: leadMatches.filter((m) => m.lead.stage === 'qualified').length,
    quoted: leadMatches.filter((m) => m.lead.stage === 'quoted').length,
    won: leadMatches.filter((m) => m.lead.stage === 'won').length,
    lost: leadMatches.filter((m) => m.lead.stage === 'lost').length,
    hot: leadMatches.filter((m) => m.lead.priority === 'hot').length,
  };

  return (
    <div className='w-full space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-black mb-1'>
            Leads Pipeline
          </h1>
          <p className='text-xs sm:text-sm text-black'>
            Manage leads from marketplace to conversion
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className='relative rounded-xl border-2 border-black shadow-xl overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600' />
        <div className='relative p-3 sm:p-4'>
          <div className='grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-4'>
            <div className='text-center'>
              <p className='text-lg sm:text-2xl font-bold text-gray-900'>{stats.total}</p>
              <p className='text-[10px] sm:text-xs text-gray-900/80'>Total</p>
            </div>
            <div className='text-center'>
              <p className='text-lg sm:text-2xl font-bold text-gray-900'>{stats.new}</p>
              <p className='text-[10px] sm:text-xs text-gray-900/80'>New</p>
            </div>
            <div className='text-center'>
              <p className='text-lg sm:text-2xl font-bold text-gray-900'>{stats.contacted}</p>
              <p className='text-[10px] sm:text-xs text-gray-900/80'>Contacted</p>
            </div>
            <div className='text-center'>
              <p className='text-lg sm:text-2xl font-bold text-gray-900'>{stats.qualified}</p>
              <p className='text-[10px] sm:text-xs text-gray-900/80'>Qualified</p>
            </div>
            <div className='text-center'>
              <p className='text-lg sm:text-2xl font-bold text-gray-900'>{stats.quoted}</p>
              <p className='text-[10px] sm:text-xs text-gray-900/80'>Quoted</p>
            </div>
            <div className='text-center'>
              <p className='text-lg sm:text-2xl font-bold text-gray-900'>{stats.won}</p>
              <p className='text-[10px] sm:text-xs text-gray-900/80'>Won</p>
            </div>
            <div className='text-center'>
              <p className='text-lg sm:text-2xl font-bold text-gray-900'>{stats.lost}</p>
              <p className='text-[10px] sm:text-xs text-gray-900/80'>Lost</p>
            </div>
            <div className='text-center'>
              <p className='text-lg sm:text-2xl font-bold text-amber-600'>{stats.hot}</p>
              <p className='text-[10px] sm:text-xs text-gray-900/80'>🔥 Hot</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <LeadsKanban
        leadMatches={serializedLeadMatches}
        employees={employees}
        contractorId={contractorProfile.id}
      />
    </div>
  );
}
