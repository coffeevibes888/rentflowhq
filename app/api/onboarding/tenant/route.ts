import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lookingFor, preferredLocation, maxBudget, moveInDate, bedrooms } = body;

    // Update user role and onboarding status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: 'tenant',
        onboardingCompleted: true,
        onboardingStep: null,
        // Store preferences in address JSON field for now
        address: {
          preferences: {
            lookingFor,
            preferredLocation,
            maxBudget: maxBudget ? parseFloat(maxBudget) : null,
            moveInDate,
            bedrooms,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tenant onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
