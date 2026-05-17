/**
 * GET /api/mobile/marketplace/contractors
 *
 * Public-ish marketplace browse — returns ranked contractor profiles.
 * Auth optional (logged-in users get personalized signals later).
 *
 * Query params:
 *   q          search by name / tagline / city
 *   specialty  filter by specialty
 *   sort       'rating' | 'reviews' | 'recent' | 'merit' (default)
 *   page       1-indexed
 *
 * Response:
 *   { contractors: Contractor[], total: number, page: number, pages: number,
 *     specialties: { name: string; count: number }[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { CANONICAL_SPECIALTIES, rankContractors, type RankableContractor } from '@/lib/services/contractor-ranking';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.toLowerCase().trim() || '';
    const specialty = searchParams.get('specialty')?.trim() || '';
    const sort = (searchParams.get('sort') as 'rating' | 'reviews' | 'recent' | 'merit') || 'merit';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    // Pull all profiles (small enough at this stage; paginate after ranking)
    const where: any = { isPublic: true };
    if (specialty) {
      where.specialties = { has: specialty };
    }
    if (q) {
      where.OR = [
        { businessName: { contains: q, mode: 'insensitive' } },
        { tagline: { contains: q, mode: 'insensitive' } },
        { baseCity: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const profiles = await prisma.contractorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      take: 500,
    });

    // Coerce into RankableContractor shape
    const rankable: RankableContractor[] = profiles.map((p: any) => ({
      id: p.id,
      avgRating: p.avgRating ?? 0,
      totalReviews: p.totalReviews ?? 0,
      completedJobs: p.completedJobs ?? 0,
      responseRate: p.responseRate ?? 0,
      onTimeRate: p.onTimeRate ?? 0,
      identityVerified: p.identityVerified ?? false,
      insuranceVerified: p.insuranceVerified ?? false,
      backgroundChecked: p.backgroundChecked ?? false,
      profilePhoto: p.profilePhoto,
      coverPhoto: p.coverPhoto,
      bio: p.bio,
      tagline: p.tagline,
      specialties: p.specialties ?? [],
      baseCity: p.baseCity,
      baseState: p.baseState,
      featuredUntil: p.featuredUntil,
      lastActiveAt: p.lastActiveAt,
      createdAt: p.createdAt,
      hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : null,
      yearsExperience: p.yearsExperience,
      slug: p.slug,
      businessName: p.businessName,
      isPaymentReady: !!p.stripeAccountId,
      user: p.user,
      coverPhotoDisplay: p.coverPhoto,
      taglineDisplay: p.tagline,
      baseCity2: p.baseCity,
      baseState2: p.baseState,
    }));

    const ranked = rankContractors(rankable);

    // Sort
    let sorted = ranked;
    if (sort === 'rating') {
      sorted = [...ranked].sort((a, b) => (b.avgRating - a.avgRating) || (b.totalReviews - a.totalReviews));
    } else if (sort === 'reviews') {
      sorted = [...ranked].sort((a, b) => b.totalReviews - a.totalReviews);
    } else if (sort === 'recent') {
      sorted = [...ranked].sort((a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
        (a.createdAt ? new Date(a.createdAt).getTime() : 0));
    }

    // Paginate
    const total = sorted.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const slice = sorted.slice(start, start + PAGE_SIZE);

    // Specialty counts (use the unfiltered set ideally; here use ranked which is filtered by `q` only when specialty empty)
    const specialtyCounts = await Promise.all(
      CANONICAL_SPECIALTIES.map(async (name) => {
        const count = await prisma.contractorProfile.count({
          where: { isPublic: true, specialties: { has: name } },
        });
        return { name, count };
      }),
    );

    return NextResponse.json({
      contractors: slice.map((c: any) => ({
        id: c.id,
        slug: c.slug ?? null,
        businessName: c.businessName ?? c.user?.name ?? 'Contractor',
        userName: c.user?.name ?? null,
        userImage: c.user?.image ?? null,
        profilePhoto: c.profilePhoto,
        coverPhoto: c.coverPhoto,
        tagline: c.tagline,
        bio: c.bio,
        specialties: c.specialties ?? [],
        baseCity: c.baseCity,
        baseState: c.baseState,
        hourlyRate: c.hourlyRate,
        yearsExperience: c.yearsExperience,
        avgRating: c.avgRating ?? 0,
        totalReviews: c.totalReviews ?? 0,
        completedJobs: c.completedJobs ?? 0,
        responseRate: c.responseRate ?? 0,
        identityVerified: c.identityVerified,
        insuranceVerified: c.insuranceVerified,
        backgroundChecked: c.backgroundChecked,
        isPaymentReady: c.isPaymentReady,
        meritScore: c.meritScore,
        isBoosted: c.isBoosted,
        isNew: c.isNew,
        isSponsored: c.isSponsored,
      })),
      total,
      page,
      pages,
      specialties: specialtyCounts,
    });
  } catch (error) {
    console.error('[mobile/marketplace/contractors]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
