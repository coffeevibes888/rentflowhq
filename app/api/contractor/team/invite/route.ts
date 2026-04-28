import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { resolveContractorAuth, can } from '@/lib/contractor-auth';
import { checkLimit, canAccessFeature } from '@/lib/services/contractor-feature-gate';
import { runBackgroundOps } from '@/lib/middleware/contractor-background-ops';
import { seedContractorRoles } from '@/lib/services/contractor-role-seeder';
import {
  SubscriptionLimitError,
  FeatureLockedError,
  formatSubscriptionError,
  logSubscriptionError,
} from '@/lib/errors/subscription-errors';
import crypto from 'crypto';

/**
 * POST /api/contractor/team/invite
 *
 * Invite a new team member by email. Creates a ContractorEmployee record
 * with status='invited' and an invite token. The invitee signs up (or signs in)
 * and hits /api/contractor/team/invite/accept to link their account.
 *
 * Body: { email, roleId?, role?, employeeType?, payRate?, payType? }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const contractorAuth = await resolveContractorAuth(session.user.id);
    if (!contractorAuth) {
      return NextResponse.json({ success: false, message: 'Contractor profile not found' }, { status: 404 });
    }

    // Permission check
    if (!can(contractorAuth, 'team.invite')) {
      return NextResponse.json({ success: false, message: 'You do not have permission to invite team members' }, { status: 403 });
    }

    const contractor = await prisma.contractorProfile.findUnique({
      where: { id: contractorAuth.contractorId },
      select: { id: true, businessName: true, subscriptionTier: true, specialties: true },
    });

    if (!contractor) {
      return NextResponse.json({ success: false, message: 'Contractor profile not found' }, { status: 404 });
    }

    // Run background operations
    await runBackgroundOps(contractor.id);

    // Feature gate check
    const featureAccess = await canAccessFeature(contractor.id, 'teamManagement');
    if (!featureAccess.allowed) {
      const error = new FeatureLockedError('teamManagement', 'pro', featureAccess.tier);
      logSubscriptionError(error, { contractorId: contractor.id, feature: 'teamManagement', action: 'invite_team_member' });
      const formatted = formatSubscriptionError(error);
      return NextResponse.json({ success: false, ...formatted.body, featureLocked: true }, { status: formatted.status });
    }

    // Team member limit check
    const limitCheck = await checkLimit(contractor.id, 'teamMembers');
    if (!limitCheck.allowed) {
      const error = new SubscriptionLimitError('team members', limitCheck.current, limitCheck.limit, contractor.subscriptionTier || 'starter');
      logSubscriptionError(error, { contractorId: contractor.id, feature: 'teamMembers', action: 'invite_team_member' });
      const formatted = formatSubscriptionError(error);
      return NextResponse.json({ success: false, ...formatted.body, limitReached: true }, { status: formatted.status });
    }

    const body = await req.json();
    const { email, roleId, role, employeeType, payRate, payType } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already a team member
    const existingMember = await prisma.contractorEmployee.findFirst({
      where: {
        contractorId: contractor.id,
        email: normalizedEmail,
        status: { in: ['active', 'invited'] },
      },
    });

    if (existingMember) {
      const msg = existingMember.status === 'invited'
        ? 'An invitation has already been sent to this email'
        : 'This person is already a team member';
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }

    // Ensure default roles are seeded for this contractor
    await seedContractorRoles(contractor.id, contractor.specialties?.[0]);

    // If roleId provided, validate it belongs to this contractor
    let validRoleId: string | null = null;
    if (roleId) {
      const roleRecord = await (prisma as any).contractorRole.findFirst({
        where: { id: roleId, contractorId: contractor.id, isActive: true },
      });
      if (!roleRecord) {
        return NextResponse.json({ success: false, message: 'Invalid role selected' }, { status: 400 });
      }
      validRoleId = roleRecord.id;
    }

    // Generate invite token (expires in 7 days)
    const inviteToken = crypto.randomUUID();
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Check if user already has an account
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const member = await prisma.contractorEmployee.create({
      data: {
        contractorId: contractor.id,
        userId: null, // Will be linked when they accept
        email: normalizedEmail,
        firstName: '',
        lastName: '',
        role: role || 'technician',
        roleId: validRoleId,
        employeeType: employeeType || 'w2',
        status: 'invited',
        hireDate: new Date(),
        payRate: payRate ? parseFloat(payRate) : 0,
        payType: payType || 'hourly',
        inviteToken,
        inviteExpiry,
        invitedAt: new Date(),
      },
      include: {
        assignedRole: { select: { name: true } },
      },
    });

    // TODO: Send invitation email with link:
    // ${process.env.NEXT_PUBLIC_SERVER_URL}/sign-up?invite=${inviteToken}&contractor=${contractor.businessName}

    return NextResponse.json({
      success: true,
      message: existingUser
        ? 'Invitation sent — they already have an account and can accept from their dashboard'
        : 'Invitation sent — they will need to create an account first',
      member,
      inviteLink: `/sign-up?invite=${inviteToken}`,
    });
  } catch (error) {
    if (error instanceof SubscriptionLimitError || error instanceof FeatureLockedError) {
      const formatted = formatSubscriptionError(error);
      return NextResponse.json({ success: false, ...formatted.body }, { status: formatted.status });
    }
    console.error('Team invite error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send invitation' }, { status: 500 });
  }
}
