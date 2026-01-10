/**
 * Team Permission Utilities
 * Helper functions for checking team member permissions
 */

import { checkTeamMemberPermission } from '@/lib/actions/team.actions';

export type TeamPermission = 
  | 'view_properties' 
  | 'manage_tenants' 
  | 'manage_maintenance' 
  | 'manage_finances'
  | 'manage_team'
  | 'manage_schedule'
  | 'approve_timesheets'
  | 'view_financials'
  | 'schedule_showings'
  | 'process_applications';

export type TeamMemberRole = 
  | 'owner' 
  | 'admin' 
  | 'manager' 
  | 'leasing_agent' 
  | 'showing_agent' 
  | 'member' 
  | 'employee';

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  landlordId: string,
  permission: TeamPermission
): Promise<boolean> {
  return await checkTeamMemberPermission(userId, landlordId, permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  landlordId: string,
  permissions: TeamPermission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (await checkTeamMemberPermission(userId, landlordId, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  landlordId: string,
  permissions: TeamPermission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await checkTeamMemberPermission(userId, landlordId, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: TeamMemberRole): string {
  const roleNames: Record<TeamMemberRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    leasing_agent: 'Leasing Agent',
    showing_agent: 'Showing Agent',
    member: 'Member',
    employee: 'Employee',
  };
  return roleNames[role] || role;
}

/**
 * Get permission display name
 */
export function getPermissionDisplayName(permission: TeamPermission): string {
  const permissionNames: Record<TeamPermission, string> = {
    view_properties: 'View Properties',
    manage_tenants: 'Manage Tenants',
    manage_maintenance: 'Manage Maintenance',
    manage_finances: 'Manage Finances',
    manage_team: 'Manage Team',
    manage_schedule: 'Manage Schedule',
    approve_timesheets: 'Approve Timesheets',
    view_financials: 'View Financials',
    schedule_showings: 'Schedule Showings',
    process_applications: 'Process Applications',
  };
  return permissionNames[permission] || permission;
}

/**
 * Get permission description
 */
export function getPermissionDescription(permission: TeamPermission): string {
  const descriptions: Record<TeamPermission, string> = {
    view_properties: 'View property details and information',
    manage_tenants: 'Add, edit, and manage tenant information',
    manage_maintenance: 'Create and manage maintenance requests',
    manage_finances: 'Full access to financial data, reports, and transactions',
    manage_team: 'Invite and manage team members',
    manage_schedule: 'Create and manage team schedules',
    approve_timesheets: 'Review and approve employee timesheets',
    view_financials: 'View-only access to financial information',
    schedule_showings: 'Schedule and manage property showings',
    process_applications: 'Review and process rental applications',
  };
  return descriptions[permission] || '';
}

/**
 * Check if a role can access finances
 */
export function canAccessFinances(permissions: string[]): boolean {
  return permissions.includes('manage_finances') || permissions.includes('view_financials');
}

/**
 * Check if a role is administrative
 */
export function isAdministrativeRole(role: TeamMemberRole): boolean {
  return ['owner', 'admin', 'manager'].includes(role);
}
