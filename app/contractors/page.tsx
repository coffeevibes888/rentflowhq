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

    // Fetch from ContractorProfile (public marketplace profiles)
    const profileWhere: any = { isPublic: true };
    if (specialty) profileWhere.specialties = { has: specialty };
    if (q) {
      profileWhere.OR = [
        { businessName: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
        { specialties: { hasSome: [q] } },
      ];
    }

    const contractorProfiles = await prisma.contractorProfile.findMany({
      where: profileWhere,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      take: 50,
    });

    // Also fetch from Contractor table (landlord-added contractors with user accounts)
    const contractorWhere: any = { userId: { not: null } };
    if (specialty) contractorWhere.specialties = { has: specialty };
    if (q) {
      contractorWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { specialties: { hasSome: [q] } },
      ];
    }

    const contractors = await prisma.contractor.findMany({
      where: contractorWhere,
      include: {
        user: { select: { id: true, name: true, image: true } },
        workOrders: { where: { status: 'completed' }, select: { id: true } },
      },
      take: 50,
    });

    // Map ContractorProfile records
    const profileResults = contractorProfiles.map(c => ({
      id: c.id,
      name: c.displayName || c.businessName,
      email: c.email,
      specialties: c.specialties,
      isPaymentReady: c.identityVerified && c.insuranceVerified,
      completedJobs: c.completedJobs,
      rating: c.avgRating || 4.5,
      responseTime: c.responseRate > 90 ? '< 1 hour' : c.responseRate > 70 ? '< 4 hours' : '< 24 hours',
      user: c.user ? {
        id: c.user.id,
        name: c.user.name,
        image: c.profilePhoto || c.user.image,
      } : null,
      tagline: c.tagline,
      baseCity: c.baseCity,
      baseState: c.baseState,
      hourlyRate: c.hourlyRate ? parseFloat(c.hourlyRate.toString()) : null,
      yearsExperience: c.yearsExperience,
      slug: c.slug,
      source: 'profile' as const,
    }));

    // Map Contractor records (exclude if they already have a ContractorProfile)
    const profileUserIds = new Set(contractorProfiles.map(p => p.userId));
    const contractorResults = contractors
      .filter(c => c.userId && !profileUserIds.has(c.userId))
      .map(c => ({
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
        tagline: null as string | null,
        baseCity: null as string | null,
        baseState: null as string | null,
        hourlyRate: null as number | null,
        yearsExperience: null as number | null,
        slug: null as string | null,
        source: 'contractor' as const,
      }));

    // Combine and sort
    let allContractors = [...profileResults, ...contractorResults];
    
    if (sort === 'rating') {
      allContractors.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'jobs') {
      allContractors.sort((a, b) => b.completedJobs - a.completedJobs);
    }

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
        contractors={allContractors}
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
