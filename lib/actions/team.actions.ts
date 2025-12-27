'use server';

import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { formatError } from '../utils';
import { getOrCreateCurrentLandlord } from './landlord.actions';
import { checkFeatureAccess } from './subscription.actions';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
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
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const resend = new Resend(resendApiKey);
  const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SERVER_URL || 'http://localhost:3000';
  const acceptUrl = `${baseUrl}/team/invite?token=${encodeURIComponent(params.inviteToken)}`;

  const subject = `${params.landlordName} invited you to join their team`;

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="margin-bottom: 0.5rem; color: #1e293b;">You have been invited to join a team</h2>
      <p style="color: #475569;">${params.landlordName} is using ${APP_NAME} to manage properties and wants you to join their team.</p>
      <p style="margin: 1.5rem 0;">
        <a
          href="${acceptUrl}"
          style="display: inline-block; padding: 0.75rem 1.5rem; background: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 999px; font-weight: 600;"
        >
          Accept Invite
        </a>
      </p>
      <p style="color: #64748b;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="font-size: 12px; color: #4b5563; word-break: break-all;">${acceptUrl}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;" />
      <p style="font-size: 12px; color: #94a3b8;">This invite expires in 7 days.</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: `${APP_NAME} <${senderEmail}>`,
    to: params.email,
    subject,
    html,
  });

  if (error) {
    console.error('Resend email error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
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

    // Check if user already exists in the system
    const existingUser = await prisma.user.findUnique({ where: { email } });

    // Check team member limit based on subscription tier
    const landlord = await prisma.landlord.findUnique({
      where: { id: landlordResult.landlord.id },
      select: { subscriptionTier: true },
    });
    
    const isEnterprise = landlord?.subscriptionTier === 'enterprise';
    const maxMembers = isEnterprise ? Infinity : 5;

    try {
      const activeCount =
        (await teamMemberModel()?.count?.({
          where: { landlordId: landlordResult.landlord.id, status: 'active' },
        })) || 0;
      if (activeCount >= maxMembers) {
        return { 
          success: false, 
          message: isEnterprise 
            ? 'Unable to add more team members at this time.' 
            : 'Team limit reached. You can have up to 5 active team members. Upgrade to Enterprise for unlimited team members.' 
        };
      }
    } catch {
      // If model missing, invite flow already fails later.
    }
    
    // Check if already a team member (by email, not just userId)
    try {
      // First check by invited email (for pending invites)
      const existingByEmail = await teamMemberModel()?.findFirst?.({
        where: {
          landlordId: landlordResult.landlord.id,
          invitedEmail: email,
        },
      });

      if (existingByEmail) {
        if (existingByEmail.status === 'pending') {
          return { success: false, message: 'An invitation has already been sent to this email address' };
        }
        if (existingByEmail.status === 'active') {
          return { success: false, message: 'This user is already an active team member' };
        }
      }

      // Also check by userId if user exists
      if (existingUser) {
        const existingByUserId = await teamMemberModel()?.findFirst?.({
          where: {
            landlordId: landlordResult.landlord.id,
            userId: existingUser.id,
            status: 'active',
          },
        });

        if (existingByUserId) {
          return { success: false, message: 'This user is already an active team member' };
        }
      }
    } catch {
      // Model doesn't exist yet, continue
    }

    // Generate invite token
    const inviteToken = randomUUID();
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create pending team member
    // userId is null for users not in the system yet
    let member;
    try {
      member = await teamMemberModel()?.create?.({
        data: {
          landlordId: landlordResult.landlord.id,
          userId: existingUser?.id ?? null,
          role,
          permissions: DEFAULT_PERMISSIONS[role],
          invitedEmail: email,
          inviteToken,
          inviteExpires,
          status: 'pending',
        },
      });
    } catch (createError: any) {
      // Handle unique constraint violation (user already exists as team member)
      if (createError?.code === 'P2002') {
        return { success: false, message: 'This user is already a team member or has a pending invite' };
      }
      console.error('Team member create error:', createError);
      return { success: false, message: 'Failed to create team invite. Please try again.' };
    }

    // If user exists in the system, create internal notification
    let notificationSent = false;
    if (existingUser) {
      try {
        // Import notification service dynamically to avoid circular deps
        const { NotificationService } = await import('@/lib/services/notification-service');
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.SERVER_URL || 'http://localhost:3000';
        const acceptUrl = `${baseUrl}/team/invite?token=${encodeURIComponent(inviteToken)}`;
        
        await NotificationService.createNotification({
          userId: existingUser.id,
          type: 'message',
          title: 'Team Invitation',
          message: `${landlordResult.landlord.name} has invited you to join their property management team as a ${role}.`,
          actionUrl: acceptUrl,
          landlordId: landlordResult.landlord.id,
        });
        notificationSent = true;
      } catch (notifError) {
        console.error('Failed to create internal notification:', notifError);
      }
    }

    // Try to send email (required for new users, optional for existing users)
    let emailSent = false;
    let emailError = null;
    try {
      await sendTeamInviteEmail({
        email,
        inviteToken,
        landlordName: landlordResult.landlord.name,
      });
      emailSent = true;
    } catch (error: any) {
      emailError = error.message || 'Failed to send email';
      console.error('Email send error:', emailError);
    }

    // If user doesn't exist and email failed, we need to fail the invite
    if (!existingUser && !emailSent) {
      // Delete the pending member since we can't notify them
      try {
        await teamMemberModel()?.delete?.({ where: { id: member.id } });
      } catch {}
      return { 
        success: false, 
        message: `Could not send invitation email: ${emailError}. The user doesn't have an account, so email is required.` 
      };
    }

    // Build success message
    let successMessage = 'Invitation sent successfully';
    if (existingUser) {
      if (notificationSent && emailSent) {
        successMessage = 'Invitation sent via email and in-app notification';
      } else if (notificationSent) {
        successMessage = 'In-app notification sent (email delivery failed, but user can accept via their notifications)';
      } else if (emailSent) {
        successMessage = 'Email invitation sent';
      }
    }

    return { 
      success: true, 
      message: successMessage,
      member,
      emailSent,
      notificationSent,
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

    if (member.invitedEmail && session.user.email) {
      const invitedEmail = member.invitedEmail.trim().toLowerCase();
      const userEmail = session.user.email.trim().toLowerCase();
      
      if (invitedEmail !== userEmail) {
        return { success: false, message: `This invite was sent to ${member.invitedEmail}. Please sign in with that email address to accept.` };
      }
    }

    // Check if user already has an active membership on this team
    const existingMembership = await teamMemberModel()?.findFirst?.({
      where: {
        landlordId: member.landlordId,
        userId: session.user.id,
        status: 'active',
      },
    });

    if (existingMembership) {
      return { success: true, message: 'You are already on this team' };
    }

    // Check team member limit based on subscription tier
    const landlord = await prisma.landlord.findUnique({
      where: { id: member.landlordId },
      select: { subscriptionTier: true },
    });
    
    const isEnterprise = landlord?.subscriptionTier === 'enterprise';
    
    if (!isEnterprise) {
      const activeCount =
        (await teamMemberModel()?.count?.({
          where: { landlordId: member.landlordId, status: 'active' },
        })) || 0;
      if (activeCount >= 5) {
        return { success: false, message: 'This team is already at the 5-member limit. The team owner needs to upgrade to Enterprise for unlimited members.' };
      }
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


export async function clearPendingInvites() {
  try {
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    try {
      const result = await teamMemberModel()?.deleteMany?.({
        where: {
          landlordId: landlordResult.landlord.id,
          status: 'pending',
        },
      });

      const count = result?.count || 0;
      return { 
        success: true, 
        message: count > 0 
          ? `Cleared ${count} pending invite${count > 1 ? 's' : ''}` 
          : 'No pending invites to clear'
      };
    } catch {
      return { success: false, message: 'Team management requires database migration' };
    }
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
