import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { checkLimit, canAccessFeature } from '@/lib/services/contractor-feature-gate';
import { runBackgroundOps } from '@/lib/middleware/contractor-background-ops';
import { 
  SubscriptionLimitError, 
  FeatureLockedError,
  formatSubscriptionError, 
  logSubscriptionError 
} from '@/lib/errors/subscription-errors';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    // Get contractor profile
    const contractor = await prisma.contractorProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!contractor) {
      return NextResponse.json({ success: false, message: 'Contractor profile not found' }, { status: 404 });
    }

    // Run background operations
    await runBackgroundOps(contractor.id);

    // Check if team management feature is available
    const featureAccess = await canAccessFeature(contractor.id, 'teamManagement');
    if (!featureAccess.allowed) {
      const error = new FeatureLockedError(
        'teamManagement',
        'pro',
        featureAccess.tier
      );
      
      logSubscriptionError(error, {
        contractorId: contractor.id,
        feature: 'teamManagement',
        action: 'invite_team_member',
      });
      
      const formatted = formatSubscriptionError(error);
      return NextResponse.json({
        success: false,
        ...formatted.body,
        featureLocked: true,
      }, { status: formatted.status });
    }

    // Check team member limit
    const limitCheck = await checkLimit(contractor.id, 'teamMembers');
    if (!limitCheck.allowed) {
      const error = new SubscriptionLimitError(
        'team members',
        limitCheck.current,
        limitCheck.limit,
        contractor.subscriptionTier || 'starter'
      );
      
      logSubscriptionError(error, {
        contractorId: contractor.id,
        feature: 'teamMembers',
        action: 'invite_team_member',
      });
      
      const formatted = formatSubscriptionError(error);
      return NextResponse.json({
        success: false,
        ...formatted.body,
        limitReached: true,
      }, { status: formatted.status });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Check if already a team member
    if (existingUser) {
      const existingMember = await prisma.contractorTeamMember.findFirst({
        where: {
          contractorId: contractor.id,
          userId: existingUser.id,
        },
      });

      if (existingMember) {
        return NextResponse.json({
          success: false,
          message: 'User is already a team member',
        }, { status: 400 });
      }
    }

    // Check if invitation already sent
    const existingInvite = await prisma.contractorTeamMember.findFirst({
      where: {
        contractorId: contractor.id,
        invitedEmail: email.toLowerCase(),
        status: 'pending',
      },
    });

    if (existingInvite) {
      return NextResponse.json({
        success: false,
        message: 'Invitation already sent to this email',
      }, { status: 400 });
    }

    // Create team member invitation
    const member = await prisma.contractorTeamMember.create({
      data: {
        contractorId: contractor.id,
        userId: existingUser?.id || '',
        invitedEmail: email.toLowerCase(),
        role: role || 'employee',
        status: 'pending',
        permissions: [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // TODO: Send invitation email

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      member 
    });
  } catch (error) {
    // Handle subscription errors
    if (error instanceof SubscriptionLimitError || error instanceof FeatureLockedError) {
      const formatted = formatSubscriptionError(error);
      return NextResponse.json({
        success: false,
        ...formatted.body,
      }, { status: formatted.status });
    }
    
    console.error('Team invite error:', error);
    logSubscriptionError(error, {
      action: 'invite_team_member',
      error: 'unexpected_error',
    });
    return NextResponse.json({ success: false, message: 'Failed to send invitation' }, { status: 500 });
  }
}
