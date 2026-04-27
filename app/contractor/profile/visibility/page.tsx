import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/db/prisma';
import { getProfileCompletion } from '@/lib/services/contractor-ranking';
import { VISIBILITY_PACKAGES } from '@/app/api/contractor/visibility/purchase/route';
import VisibilityClient from './visibility-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Marketplace Visibility | Contractor Dashboard',
};

export default async function ContractorVisibilityPage({
  searchParams,
}: {
  searchParams?: Promise<{ boost?: string; package?: string; session_id?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  if (session.user.role !== 'contractor') redirect('/');

  const params = (await searchParams) || {};

  // If returning from a successful Stripe checkout, confirm the payment server-side
  // This is a safety net in case the webhook hasn't fired yet
  if (params.boost === 'success' && params.session_id) {
    try {
      const profile = await prisma.contractorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (profile) {
        const checkoutSession = await (await import('@/lib/stripe')).stripe.checkout.sessions.retrieve(params.session_id);
        if (
          checkoutSession.payment_status === 'paid' &&
          checkoutSession.metadata?.type === 'visibility_boost' &&
          checkoutSession.metadata?.contractorProfileId === profile.id
        ) {
          const credits = parseInt(checkoutSession.metadata?.credits || '0', 10);
          if (credits > 0) {
            // Use upsert-style update — safe to call multiple times
            await prisma.contractorProfile.update({
              where: { id: profile.id },
              data: {
                visibilityCredits: { increment: credits },
                featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          }
        }
      }
    } catch (e) {
      // Non-fatal — webhook will handle it if this fails
      console.error('Visibility confirm error:', e);
    }
  }

  const profile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      displayName: true,
      businessName: true,
      profilePhoto: true,
      coverPhoto: true,
      bio: true,
      tagline: true,
      specialties: true,
      baseCity: true,
      baseState: true,
      phone: true,
      hourlyRate: true,
      identityVerified: true,
      insuranceVerified: true,
      avgRating: true,
      totalReviews: true,
      completedJobs: true,
      responseRate: true,
      onTimeRate: true,
      visibilityCredits: true,
      featuredUntil: true,
      newContractorBoostUntil: true,
      createdAt: true,
      isPublic: true,
      acceptingNewWork: true,
    },
  });

  if (!profile) redirect('/onboarding/contractor');

  const { score, missing } = getProfileCompletion(profile);
  const now = new Date();
  const hasActiveBoost =
    (profile.featuredUntil && profile.featuredUntil > now) ||
    (profile.newContractorBoostUntil && profile.newContractorBoostUntil > now) ||
    profile.visibilityCredits > 0;

  const isNewMember =
    (Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24) < 30;

  return (
    <VisibilityClient
      profile={{
        id: profile.id,
        name: profile.displayName || profile.businessName,
        completionScore: score,
        missingItems: missing,
        visibilityCredits: profile.visibilityCredits,
        featuredUntil: profile.featuredUntil?.toISOString() || null,
        newContractorBoostUntil: profile.newContractorBoostUntil?.toISOString() || null,
        hasActiveBoost,
        isNewMember,
        isPublic: profile.isPublic,
        acceptingNewWork: profile.acceptingNewWork,
        avgRating: profile.avgRating,
        totalReviews: profile.totalReviews,
        completedJobs: profile.completedJobs,
      }}
      packages={VISIBILITY_PACKAGES as any}
      boostResult={params.boost || null}
    />
  );
}
