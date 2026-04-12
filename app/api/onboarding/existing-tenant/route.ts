import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { NextResponse } from 'next/server';

// Roles that cannot be changed through onboarding - these are privileged system roles
const PROTECTED_ROLES = ['superAdmin', 'admin'];

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has a protected role that cannot be changed via onboarding
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser && PROTECTED_ROLES.includes(currentUser.role)) {
      return NextResponse.json(
        { error: `Cannot change role for ${currentUser.role} accounts through onboarding` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { inviteCode, landlordEmail, skip } = body;

    // Update user role and onboarding status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: 'tenant',
        onboardingCompleted: true,
        onboardingStep: null,
      },
    });

    // If invite code provided, try to link to landlord
    if (inviteCode && !skip) {
      // TODO: Implement invite code lookup and linking
      // This would look up the invite code and link the tenant to the landlord
    }

    // If landlord email provided, notify them
    if (landlordEmail && !skip) {
      // TODO: Send notification email to landlord
      // This would send an email to the landlord that a tenant signed up
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Existing tenant onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
