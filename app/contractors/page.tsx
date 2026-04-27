import { prisma } from '@/db/prisma';
import { Metadata } from 'next';
import ContractorMarketplace from './contractor-marketplace';
import { rankContractors, type RankableContractor, CANONICAL_SPECIALTIES } from '@/lib/services/contractor-ranking';

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

    // Normalize specialty to match canonical list (case-insensitive)
    const normalizedSpecialty = specialty
      ? CANONICAL_SPECIALTIES.find(s => s.toLowerCase() === specialty.toLowerCase()) || specialty
      : undefined;

    // Build where clause for ContractorProfile
    const profileWhere: any = { isPublic: true, acceptingNewWork: true };

    if (normalizedSpecialty) {
      // Use hasSome for case-flexible matching across both stored formats
      profileWhere.specialties = {
        hasSome: [
          normalizedSpecialty,
          normalizedSpecialty.toLowerCase(),
          normalizedSpecialty.toUpperCase(),
          normalizedSpecialty.charAt(0).toUpperCase() + normalizedSpecialty.slice(1).toLowerCase(),
        ],
      };
    }

    if (q) {
      profileWhere.OR = [
        { businessName: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
        { tagline: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
        { specialties: { hasSome: [q, q.toLowerCase(), q.toUpperCase()] } },
        { baseCity: { contains: q, mode: 'insensitive' } },
        { baseState: { contains: q, mode: 'insensitive' } },
      ];
    }

    const contractorProfiles = await prisma.contractorProfile.findMany({
      where: profileWhere,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      take: 200, // fetch more, algorithm will rank and slice
    });

    // Also fetch from legacy Contractor table (landlord-added contractors with user accounts)
    const contractorWhere: any = { userId: { not: null } };
    if (normalizedSpecialty) {
      contractorWhere.specialties = {
        hasSome: [
          normalizedSpecialty,
          normalizedSpecialty.toLowerCase(),
          normalizedSpecialty.toUpperCase(),
          normalizedSpecialty.charAt(0).toUpperCase() + normalizedSpecialty.slice(1).toLowerCase(),
        ],
      };
    }
    if (q) {
      contractorWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { specialties: { hasSome: [q, q.toLowerCase(), q.toUpperCase()] } },
      ];
    }

    const legacyContractors = await prisma.contractor.findMany({
      where: contractorWhere,
      include: {
        user: { select: { id: true, name: true, image: true } },
        workOrders: { where: { status: 'completed' }, select: { id: true } },
      },
      take: 100,
    });

    // Map ContractorProfile → RankableContractor
    const profileResults: RankableContractor[] = contractorProfiles.map(c => ({
      id: c.id,
      avgRating: c.avgRating || 0,
      totalReviews: c.totalReviews || 0,
      completedJobs: c.completedJobs || 0,
      responseRate: c.responseRate || 0,
      onTimeRate: c.onTimeRate || 0,
      identityVerified: c.identityVerified,
      insuranceVerified: c.insuranceVerified,
      backgroundChecked: c.backgroundChecked,
      profilePhoto: c.profilePhoto || null,
      coverPhoto: c.coverPhoto || null,
      bio: c.bio || null,
      tagline: c.tagline || null,
      specialties: c.specialties,
      baseCity: c.baseCity || null,
      baseState: c.baseState || null,
      featuredUntil: c.featuredUntil || null,
      visibilityCredits: c.visibilityCredits || 0,
      newContractorBoostUntil: c.newContractorBoostUntil || null,
      lastActiveAt: c.lastActiveAt || null,
      createdAt: c.createdAt,
      // display fields
      name: c.displayName || c.businessName,
      email: c.email,
      isPaymentReady: c.identityVerified && c.insuranceVerified,
      user: c.user ? {
        id: c.user.id,
        name: c.user.name,
        image: c.profilePhoto || c.user.image,
      } : null,
      coverPhotoDisplay: c.coverPhoto || null,
      taglineDisplay: c.tagline || null,
      baseCity2: c.baseCity || null,
      baseState2: c.baseState || null,
      hourlyRate: c.hourlyRate ? parseFloat(c.hourlyRate.toString()) : null,
      yearsExperience: c.yearsExperience || null,
      slug: c.slug,
      source: 'profile' as const,
      responseTime: c.responseRate > 90 ? '< 1 hour' : c.responseRate > 70 ? '< 4 hours' : '< 24 hours',
    }));

    // Map legacy Contractor → RankableContractor (exclude if they have a ContractorProfile)
    const profileUserIds = new Set(contractorProfiles.map(p => p.userId));
    const legacyResults: RankableContractor[] = legacyContractors
      .filter(c => c.userId && !profileUserIds.has(c.userId))
      .map(c => ({
        id: c.id,
        avgRating: 0,
        totalReviews: 0,
        completedJobs: c.workOrders.length,
        responseRate: 0,
        onTimeRate: 0,
        identityVerified: false,
        insuranceVerified: false,
        backgroundChecked: false,
        profilePhoto: null,
        coverPhoto: null,
        bio: null,
        tagline: null,
        specialties: c.specialties,
        baseCity: null,
        baseState: null,
        featuredUntil: null,
        visibilityCredits: 0,
        newContractorBoostUntil: null,
        lastActiveAt: null,
        createdAt: new Date(),
        // display fields
        name: c.name,
        email: c.email,
        isPaymentReady: c.isPaymentReady,
        user: c.user ? { id: c.user.id, name: c.user.name, image: c.user.image } : null,
        coverPhotoDisplay: null,
        taglineDisplay: null,
        baseCity2: null,
        baseState2: null,
        hourlyRate: null,
        yearsExperience: null,
        slug: null,
        source: 'contractor' as const,
        responseTime: '< 24 hours',
      }));

    // Run the ranking algorithm
    const allRankable = [...profileResults, ...legacyResults];
    let ranked = rankContractors(allRankable);

    // If user explicitly chose a sort override, re-sort organic (keep sponsored at top)
    if (sort === 'rating') {
      const sponsored = ranked.filter(c => c.isSponsored);
      const organic = ranked.filter(c => !c.isSponsored).sort((a, b) => b.avgRating - a.avgRating);
      ranked = [...sponsored, ...organic];
    } else if (sort === 'jobs') {
      const sponsored = ranked.filter(c => c.isSponsored);
      const organic = ranked.filter(c => !c.isSponsored).sort((a, b) => b.completedJobs - a.completedJobs);
      ranked = [...sponsored, ...organic];
    }

    // Map to the shape ContractorMarketplace expects
    const contractors = ranked.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      specialties: c.specialties,
      isPaymentReady: c.isPaymentReady,
      completedJobs: c.completedJobs,
      rating: c.avgRating || 0,
      responseTime: c.responseTime,
      user: c.user,
      coverPhoto: c.coverPhotoDisplay,
      tagline: c.taglineDisplay,
      baseCity: c.baseCity2,
      baseState: c.baseState2,
      hourlyRate: c.hourlyRate,
      yearsExperience: c.yearsExperience,
      slug: c.slug,
      source: c.source,
      meritScore: c.meritScore,
      isSponsored: c.isSponsored,
      isNew: c.isNew,
      isBoosted: c.isBoosted,
    }));

    const openJobsCount = await prisma.workOrder.count({
      where: { isOpenBid: true, status: 'open' },
    });

    return (
      <ContractorMarketplace
        initialView={view === 'jobs' ? 'jobs' : 'contractors'}
        contractors={contractors}
        openJobsCount={openJobsCount}
        searchParams={params}
        activeSpecialty={normalizedSpecialty}
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
