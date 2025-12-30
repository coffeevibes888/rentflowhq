import { prisma } from '@/db/prisma';
import { Metadata } from 'next';
import ContractorMarketplace from './contractor-marketplace';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contractor Marketplace | Property Flow HQ',
  description: 'Browse verified contractors or find open jobs for your property maintenance needs',
};

interface SearchParams {
  q?: string;
  specialty?: string;
  location?: string;
  sort?: string;
  view?: string;
}

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    const params = await searchParams;
    const { q, specialty, sort, view } = params;

    // Build query for contractors
    const where: any = {
      userId: { not: null },
    };

    if (specialty) {
      where.specialties = { has: specialty };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { specialties: { hasSome: [q] } },
      ];
    }

    // Fetch contractors with stats
    const contractors = await prisma.contractor.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { workOrders: true },
        },
        workOrders: {
          where: { status: 'completed' },
          select: { id: true },
        },
      },
      take: 50,
    });

    // Calculate stats for each contractor - serialize for client
    const contractorsWithStats = contractors.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      specialties: c.specialties,
      isPaymentReady: c.isPaymentReady,
      completedJobs: c.workOrders.length,
      rating: 4.5 + Math.random() * 0.5,
      responseTime: '< 1 hour',
      user: c.user ? {
        id: c.user.id,
        name: c.user.name,
        image: c.user.image,
      } : null,
    }));

    // Sort
    const sorted = [...contractorsWithStats].sort((a, b) => {
      if (sort === 'jobs') return b.completedJobs - a.completedJobs;
      if (sort === 'rating') return b.rating - a.rating;
      return 0;
    });

    // Fetch open jobs count for the badge
    const openJobsCount = await prisma.workOrder.count({
      where: {
        isOpenBid: true,
        status: 'open',
      },
    });

    return (
      <ContractorMarketplace
        initialView={view === 'jobs' ? 'jobs' : 'contractors'}
        contractors={sorted}
        openJobsCount={openJobsCount}
        searchParams={params}
      />
    );
  } catch (error) {
    console.error('Error loading contractors page:', error);
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-600 flex items-center justify-center">
        <div className="bg-white/90 rounded-xl p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Unable to load contractors</h1>
          <p className="text-slate-600">Please try again later.</p>
        </div>
      </div>
    );
  }
}
