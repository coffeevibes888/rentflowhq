import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { OnboardingProvider } from './onboarding-provider';

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

  return (
    <OnboardingProvider
      userId={user.id}
      userCreatedAt={user.createdAt.toISOString()}
      userRole={user.role}
    />
  );
}
