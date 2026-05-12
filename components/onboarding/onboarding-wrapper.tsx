import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { OnboardingProvider } from './onboarding-provider';
import { normalizeTier } from '@/lib/config/subscription-tiers';

export async function OnboardingWrapper() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  // Get user details including role and creation date
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      createdAt: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  // Only show for landlords and property managers
  if (user.role !== 'landlord' && user.role !== 'property_manager') {
    return null;
  }

  // Resolve the current subscription tier so tour steps that require Pro+
  // are included for trialing Pro/Enterprise users.
  const landlord = await prisma.landlord.findFirst({
    where: { ownerUserId: user.id },
    select: {
      subscriptionTier: true,
      subscription: { select: { tier: true } },
    },
  });
  const rawTier = landlord?.subscription?.tier || landlord?.subscriptionTier;
  const tier = normalizeTier(rawTier);
  const isPro = tier === 'pro' || tier === 'enterprise';

  return (
    <OnboardingProvider
      userId={user.id}
      userCreatedAt={user.createdAt.toISOString()}
      userRole={user.role}
      isPro={isPro}
    />
  );
}
