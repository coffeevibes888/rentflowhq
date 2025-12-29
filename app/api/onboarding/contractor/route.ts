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
    const { 
      companyName, 
      licenseNumber, 
      insuranceProvider, 
      specialties, 
      serviceAreas,
      inviteCode 
    } = body;

    // Update user role and onboarding status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        role: 'contractor',
        onboardingCompleted: true,
        onboardingStep: null,
        name: companyName || session.user.name,
      },
    });

    let linked = false;

    // If invite code provided, try to link to landlord
    if (inviteCode) {
      const invite = await prisma.contractorInvite.findFirst({
        where: {
          token: inviteCode.toUpperCase(), // Codes are uppercase
          status: 'pending',
          expiresAt: { gt: new Date() },
        },
        include: {
          contractor: true,
        },
      });

      if (invite) {
        // Update the placeholder contractor with real user info
        await prisma.contractor.update({
          where: { id: invite.contractorId },
          data: {
            userId: session.user.id,
            name: companyName || session.user.name || 'Contractor',
            email: session.user.email || '',
            specialties: specialties || [],
            serviceAreas: serviceAreas ? serviceAreas.split(',').map((s: string) => s.trim()) : [],
            licenseNumber: licenseNumber || null,
            insuranceInfo: insuranceProvider ? { provider: insuranceProvider } : null,
            status: 'active',
          },
        });

        // Update invite status
        await prisma.contractorInvite.update({
          where: { id: invite.id },
          data: { 
            status: 'accepted',
            email: session.user.email || invite.email,
          },
        });

        linked = true;
      }
    }

    // If no valid invite code, contractor is registered but not linked to any landlord yet
    // They'll appear in the marketplace and can be invited by landlords later

    return NextResponse.json({ success: true, linked });
  } catch (error) {
    console.error('Contractor onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
