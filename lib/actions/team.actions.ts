'use server';

import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { formatError } from '../utils';
import { getOrCreateCurrentLandlord } from './landlord.actions';
import { checkFeatureAccess } from './subscription.actions';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { APP_NAME } from '@/lib/constants';

export type TeamMemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'employee';
export type TeamPermission = 
  | 'view_properties' 
  | 'manage_tenants' 
  | 'manage_maintenance' 
  | 'manage_finances'
  | 'manage_team'
  | 'manage_schedule'
  | 'approve_timesheets';

const DEFAULT_PERMISSIONS: Record<TeamMemberRole, TeamPermission[]> = {
  owner: ['view_properties', 'manage_tenants', 'manage_maintenance', 'manage_finances', 'manage_team', 'manage_schedule', 'approve_timesheets'],
  admin: ['view_properties', 'manage_tenants', 'manage_maintenance', 'manage_finances', 'manage_schedule', 'approve_timesheets'],
  manager: ['view_properties', 'manage_tenants', 'manage_maintenance', 'manage_schedule', 'approve_timesheets'],
  member: ['view_properties', 'manage_maintenance'],
  employee: ['view_properties'],
};

// Type-safe prisma access for models that may not exist yet
const teamMemberModel = () => (prisma as any).teamMember;

async function sendTeamInviteEmail(params: {
  email: string;
  inviteToken: string;
  landlordName: string;
}) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromAddress = process.env.SMTP_FROM_EMAIL || 'noreply@rooms4rentlv.com';

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error('Email configuration is missing on the server.');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SERVER_URL || 'http://localhost:3000';
  const acceptUrl = `${baseUrl}/team/invite?token=${encodeURIComponent(params.inviteToken)}`;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const subject = `${params.landlordName} invited you to join their team`;

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5;">
      <h2 style="margin-bottom: 0.5rem;">You have been invited to join a team</h2>
      <p>${params.landlordName} is using ${APP_NAME} to manage properties.</p>
      <p style="margin: 1.5rem 0;">
        <a
          href="${acceptUrl}"
          style="display: inline-block; padding: 0.75rem 1.5rem; background: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 999px; font-weight: 600;"
        >
          Accept invite
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p style="font-size: 12px; color: #4b5563; word-break: break-all;">${acceptUrl}</p>
      <p style="font-size: 12px; color: #6b7280;">This invite expires in 7 days.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `${APP_NAME} <${fromAddress}>`,
    to: params.email,
    subject,
    html,
  });
}

export async function getTeamMembers() {
  try {
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    // Check if team management is available
    const featureCheck = await checkFeatureAccess(landlordResult.landlord.id, 'teamManagement');
    if (!featureCheck.allowed) {
      return { 
        success: false, 
        message: featureCheck.reason,
        featureLocked: true,
        upgradeTier: featureCheck.upgradeTier,
      };
    }

    // Note: TeamMember model needs to be created via Prisma migration
    let members: any[] = [];
    try {
      members = await teamMemberModel()?.findMany?.({
        where: { landlordId: landlordResult.landlord.id },
        orderBy: { createdAt: 'asc' },
      }) || [];
    } catch {
      // Model doesn't exist yet
      return { success: true, members: [] };
    }

    // Get user details for active members
    const userIds = members.filter((m: any) => m.status === 'active').map((m: any) => m.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true },
    });

    const membersWithUsers = members.map((member: any) => {
      const user = users.find(u => u.id === member.userId);
      return {
        ...member,
        user: user || null,
      };
    });

    return { success: true, members: membersWithUsers };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function inviteTeamMember(email: string, role: TeamMemberRole = 'member') {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    // Check if team management is available
    const featureCheck = await checkFeatureAccess(landlordResult.landlord.id, 'teamManagement');
    if (!featureCheck.allowed) {
      return { 
        success: false, 
        message: featureCheck.reason,
        featureLocked: true,
        upgradeTier: featureCheck.upgradeTier,
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    try {
      const activeCount =
        (await teamMemberModel()?.count?.({
          where: { landlordId: landlordResult.landlord.id, status: 'active' },
        })) || 0;
      if (activeCount >= 5) {
        return { success: false, message: 'Team limit reached. You can have up to 5 active team members.' };
      }
    } catch {
      // If model missing, invite flow already fails later.
    }
    
    // Check if already a team member
    if (existingUser) {
      try {
        const existingMember = await teamMemberModel()?.findUnique?.({
          where: {
            landlordId_userId: {
              landlordId: landlordResult.landlord.id,
              userId: existingUser.id,
            },
          },
        });

        if (existingMember) {
          return { success: false, message: 'This user is already a team member' };
        }
      } catch {
        // Model doesn't exist yet, continue
      }
    }

    // Generate invite token
    const inviteToken = randomUUID();
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create pending team member
    let member;
    try {
      const placeholderUserId = existingUser?.id || randomUUID();
      member = await teamMemberModel()?.create?.({
        data: {
          landlordId: landlordResult.landlord.id,
          userId: placeholderUserId,
          role,
          permissions: DEFAULT_PERMISSIONS[role],
          invitedEmail: email,
          inviteToken,
          inviteExpires,
          status: 'pending',
        },
      });
    } catch {
      return { success: false, message: 'Team management requires database migration. Please run: npx prisma migrate dev' };
    }

    await sendTeamInviteEmail({
      email,
      inviteToken,
      landlordName: landlordResult.landlord.name,
    });

    return { 
      success: true, 
      message: 'Invitation sent successfully',
      member,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function acceptTeamInvite(inviteToken: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    let member;
    try {
      member = await teamMemberModel()?.findUnique?.({
        where: { inviteToken },
      });
    } catch {
      return { success: false, message: 'Team management requires database migration' };
    }

    if (!member) {
      return { success: false, message: 'Invalid invitation' };
    }

    if (member.status !== 'pending') {
      return { success: false, message: 'This invitation has already been used' };
    }

    if (member.inviteExpires && member.inviteExpires < new Date()) {
      return { success: false, message: 'This invitation has expired' };
    }

    if (member.invitedEmail && session.user.email && member.invitedEmail.toLowerCase() !== session.user.email.toLowerCase()) {
      return { success: false, message: 'This invite was sent to a different email address.' };
    }

    const existingMembership = await teamMemberModel()?.findUnique?.({
      where: {
        landlordId_userId: {
          landlordId: member.landlordId,
          userId: session.user.id,
        },
      },
    });

    if (existingMembership?.status === 'active') {
      return { success: true, message: 'You are already on this team' };
    }

    const activeCount =
      (await teamMemberModel()?.count?.({
        where: { landlordId: member.landlordId, status: 'active' },
      })) || 0;
    if (activeCount >= 5) {
      return { success: false, message: 'This team is already at the 5-member limit.' };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const allowedRoles = ['admin', 'superAdmin', 'landlord', 'property_manager'];
    if (currentUser?.role && !allowedRoles.includes(currentUser.role)) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: 'property_manager' },
      });
    }

    await teamMemberModel()?.update?.({
      where: { id: member.id },
      data: {
        userId: session.user.id,
        status: 'active',
        joinedAt: new Date(),
        inviteToken: null,
        inviteExpires: null,
      },
    });

    return { success: true, message: 'You have joined the team' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateTeamMemberRole(memberId: string, role: TeamMemberRole) {
  try {
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    let member;
    try {
      member = await teamMemberModel()?.findFirst?.({
        where: { id: memberId, landlordId: landlordResult.landlord.id },
      });
    } catch {
      return { success: false, message: 'Team management requires database migration' };
    }

    if (!member) {
      return { success: false, message: 'Team member not found' };
    }

    if (member.role === 'owner') {
      return { success: false, message: 'Cannot change the owner role' };
    }

    await teamMemberModel()?.update?.({
      where: { id: memberId },
      data: {
        role,
        permissions: DEFAULT_PERMISSIONS[role],
      },
    });

    return { success: true, message: 'Role updated successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function removeTeamMember(memberId: string) {
  try {
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    let member;
    try {
      member = await teamMemberModel()?.findFirst?.({
        where: { id: memberId, landlordId: landlordResult.landlord.id },
      });
    } catch {
      return { success: false, message: 'Team management requires database migration' };
    }

    if (!member) {
      return { success: false, message: 'Team member not found' };
    }

    if (member.role === 'owner') {
      return { success: false, message: 'Cannot remove the owner' };
    }

    await teamMemberModel()?.delete?.({ where: { id: memberId } });

    return { success: true, message: 'Team member removed' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
