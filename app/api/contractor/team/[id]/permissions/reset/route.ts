import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: ['view_properties', 'manage_properties', 'manage_tenants', 'process_applications', 'schedule_showings', 'manage_maintenance', 'view_financials', 'manage_finances', 'manage_team', 'manage_schedule', 'approve_timesheets', 'view_reports'],
  property_manager: ['view_properties', 'manage_properties', 'manage_tenants', 'process_applications', 'schedule_showings', 'manage_maintenance', 'view_financials', 'manage_schedule', 'approve_timesheets', 'view_reports'],
  leasing_agent: ['view_properties', 'manage_tenants', 'process_applications', 'schedule_showings'],
  showing_agent: ['view_properties', 'schedule_showings'],
  maintenance_tech: ['view_properties', 'manage_maintenance'],
  accountant: ['view_properties', 'view_financials', 'manage_finances', 'view_reports'],
  employee: ['view_properties'],
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: memberId } = await params;

    // Get contractor profile
    const contractor = await prisma.contractorProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!contractor) {
      return NextResponse.json({ success: false, message: 'Contractor profile not found' }, { status: 404 });
    }

    // Get the team member
    const member = await prisma.contractorTeamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.contractorId !== contractor.id) {
      return NextResponse.json({ success: false, message: 'Team member not found' }, { status: 404 });
    }

    // Reset to default permissions for their role
    const defaultPermissions = DEFAULT_PERMISSIONS[member.role] || [];

    await prisma.contractorTeamMember.update({
      where: { id: memberId },
      data: { permissions: defaultPermissions },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Permissions reset to defaults',
      permissions: defaultPermissions 
    });
  } catch (error) {
    console.error('Reset permissions error:', error);
    return NextResponse.json({ success: false, message: 'Failed to reset permissions' }, { status: 500 });
  }
}
