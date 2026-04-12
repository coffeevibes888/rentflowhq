/**
 * Contractor Team Roles and Permissions Configuration
 * 
 * Comprehensive role-based access control for contractor businesses
 */

export type ContractorPermission =
  // Job Management
  | 'jobs.view'
  | 'jobs.create'
  | 'jobs.edit'
  | 'jobs.delete'
  | 'jobs.assign'
  | 'jobs.complete'
  | 'jobs.schedule'
  
  // Customer Management
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  | 'customers.contact'
  
  // Invoicing & Payments
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.edit'
  | 'invoices.delete'
  | 'invoices.send'
  | 'payments.view'
  | 'payments.process'
  
  // Estimates & Quotes
  | 'estimates.view'
  | 'estimates.create'
  | 'estimates.edit'
  | 'estimates.delete'
  | 'estimates.send'
  
  // Team Management
  | 'team.view'
  | 'team.invite'
  | 'team.edit'
  | 'team.remove'
  | 'team.manage_roles'
  
  // Time Tracking
  | 'time.view_own'
  | 'time.view_all'
  | 'time.edit_own'
  | 'time.edit_all'
  | 'time.approve'
  
  // Inventory Management
  | 'inventory.view'
  | 'inventory.create'
  | 'inventory.edit'
  | 'inventory.delete'
  | 'inventory.receive'
  | 'inventory.use'
  | 'inventory.reorder'
  
  // Equipment Management
  | 'equipment.view'
  | 'equipment.create'
  | 'equipment.edit'
  | 'equipment.delete'
  | 'equipment.assign'
  | 'equipment.maintenance'
  
  // Truck/Vehicle Management
  | 'trucks.view'
  | 'trucks.create'
  | 'trucks.edit'
  | 'trucks.delete'
  | 'trucks.load'
  | 'trucks.unload'
  | 'trucks.assign'
  
  // Financial Management
  | 'financials.view_summary'
  | 'financials.view_detailed'
  | 'financials.manage'
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.approve'
  
  // Reports & Analytics
  | 'reports.view'
  | 'reports.export'
  | 'analytics.view'
  
  // Settings & Configuration
  | 'settings.view'
  | 'settings.edit'
  | 'settings.billing'
  
  // Communications
  | 'messages.view'
  | 'messages.send'
  | 'messages.manage'
  
  // Leads & Marketing
  | 'leads.view'
  | 'leads.create'
  | 'leads.edit'
  | 'leads.convert'
  | 'marketing.view'
  | 'marketing.manage';

export interface ContractorRoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: ContractorPermission[];
  color: string; // For UI display
  icon: string; // Icon name
  isDefault?: boolean;
  canBeDeleted?: boolean;
}

/**
 * Predefined contractor roles with appropriate permissions
 */
export const CONTRACTOR_ROLES: Record<string, ContractorRoleDefinition> = {
  owner: {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all features and settings',
    permissions: [
      // All permissions
      'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 'jobs.assign', 'jobs.complete', 'jobs.schedule',
      'customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'customers.contact',
      'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.send',
      'payments.view', 'payments.process',
      'estimates.view', 'estimates.create', 'estimates.edit', 'estimates.delete', 'estimates.send',
      'team.view', 'team.invite', 'team.edit', 'team.remove', 'team.manage_roles',
      'time.view_own', 'time.view_all', 'time.edit_own', 'time.edit_all', 'time.approve',
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.receive', 'inventory.use', 'inventory.reorder',
      'equipment.view', 'equipment.create', 'equipment.edit', 'equipment.delete', 'equipment.assign', 'equipment.maintenance',
      'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete', 'trucks.load', 'trucks.unload', 'trucks.assign',
      'financials.view_summary', 'financials.view_detailed', 'financials.manage',
      'expenses.view', 'expenses.create', 'expenses.approve',
      'reports.view', 'reports.export', 'analytics.view',
      'settings.view', 'settings.edit', 'settings.billing',
      'messages.view', 'messages.send', 'messages.manage',
      'leads.view', 'leads.create', 'leads.edit', 'leads.convert',
      'marketing.view', 'marketing.manage',
    ],
    color: 'purple',
    icon: 'Crown',
    isDefault: true,
    canBeDeleted: false,
  },

  manager: {
    id: 'manager',
    name: 'Manager',
    description: 'Manages operations, team, and jobs. Limited financial access.',
    permissions: [
      'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.assign', 'jobs.complete', 'jobs.schedule',
      'customers.view', 'customers.create', 'customers.edit', 'customers.contact',
      'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send',
      'payments.view',
      'estimates.view', 'estimates.create', 'estimates.edit', 'estimates.send',
      'team.view', 'team.invite', 'team.edit',
      'time.view_all', 'time.edit_all', 'time.approve',
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.receive', 'inventory.use', 'inventory.reorder',
      'equipment.view', 'equipment.create', 'equipment.edit', 'equipment.assign', 'equipment.maintenance',
      'trucks.view', 'trucks.edit', 'trucks.load', 'trucks.unload', 'trucks.assign',
      'financials.view_summary',
      'expenses.view', 'expenses.create', 'expenses.approve',
      'reports.view', 'reports.export', 'analytics.view',
      'settings.view',
      'messages.view', 'messages.send', 'messages.manage',
      'leads.view', 'leads.create', 'leads.edit', 'leads.convert',
      'marketing.view',
    ],
    color: 'blue',
    icon: 'Briefcase',
    isDefault: true,
    canBeDeleted: false,
  },

  foreman: {
    id: 'foreman',
    name: 'Foreman / Lead',
    description: 'Supervises field crews, manages job sites, and coordinates work.',
    permissions: [
      'jobs.view', 'jobs.edit', 'jobs.assign', 'jobs.complete', 'jobs.schedule',
      'customers.view', 'customers.contact',
      'invoices.view',
      'estimates.view',
      'team.view',
      'time.view_all', 'time.edit_own', 'time.approve',
      'inventory.view', 'inventory.use', 'inventory.reorder',
      'equipment.view', 'equipment.assign',
      'trucks.view', 'trucks.load', 'trucks.unload',
      'expenses.view', 'expenses.create',
      'reports.view',
      'messages.view', 'messages.send',
      'leads.view',
    ],
    color: 'orange',
    icon: 'HardHat',
    isDefault: true,
    canBeDeleted: false,
  },

  technician: {
    id: 'technician',
    name: 'Technician / Tradesperson',
    description: 'Skilled worker who performs the actual work on jobs.',
    permissions: [
      'jobs.view', 'jobs.complete',
      'customers.view',
      'time.view_own', 'time.edit_own',
      'inventory.view', 'inventory.use',
      'equipment.view',
      'trucks.view', 'trucks.load', 'trucks.unload',
      'expenses.view', 'expenses.create',
      'messages.view', 'messages.send',
    ],
    color: 'green',
    icon: 'Wrench',
    isDefault: true,
    canBeDeleted: false,
  },

  driver: {
    id: 'driver',
    name: 'Driver / Mover',
    description: 'Operates vehicles, transports materials, and assists with jobs.',
    permissions: [
      'jobs.view', 'jobs.complete',
      'customers.view',
      'time.view_own', 'time.edit_own',
      'inventory.view', 'inventory.use',
      'equipment.view',
      'trucks.view', 'trucks.load', 'trucks.unload',
      'expenses.view', 'expenses.create',
      'messages.view', 'messages.send',
    ],
    color: 'cyan',
    icon: 'Truck',
    isDefault: true,
    canBeDeleted: false,
  },

  office_admin: {
    id: 'office_admin',
    name: 'Office Administrator',
    description: 'Handles administrative tasks, scheduling, and customer communications.',
    permissions: [
      'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.schedule',
      'customers.view', 'customers.create', 'customers.edit', 'customers.contact',
      'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send',
      'payments.view',
      'estimates.view', 'estimates.create', 'estimates.edit', 'estimates.send',
      'team.view',
      'time.view_all',
      'inventory.view',
      'equipment.view',
      'trucks.view',
      'financials.view_summary',
      'expenses.view',
      'reports.view', 'reports.export',
      'settings.view',
      'messages.view', 'messages.send', 'messages.manage',
      'leads.view', 'leads.create', 'leads.edit', 'leads.convert',
      'marketing.view',
    ],
    color: 'pink',
    icon: 'FileText',
    isDefault: true,
    canBeDeleted: false,
  },

  bookkeeper: {
    id: 'bookkeeper',
    name: 'Bookkeeper / Accountant',
    description: 'Manages financial records, invoicing, and expense tracking.',
    permissions: [
      'jobs.view',
      'customers.view',
      'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send',
      'payments.view', 'payments.process',
      'estimates.view',
      'time.view_all',
      'inventory.view',
      'equipment.view',
      'financials.view_summary', 'financials.view_detailed',
      'expenses.view', 'expenses.create', 'expenses.approve',
      'reports.view', 'reports.export', 'analytics.view',
      'messages.view', 'messages.send',
    ],
    color: 'emerald',
    icon: 'Calculator',
    isDefault: true,
    canBeDeleted: false,
  },

  sales: {
    id: 'sales',
    name: 'Sales Representative',
    description: 'Generates leads, creates estimates, and closes deals.',
    permissions: [
      'jobs.view', 'jobs.create',
      'customers.view', 'customers.create', 'customers.edit', 'customers.contact',
      'estimates.view', 'estimates.create', 'estimates.edit', 'estimates.send',
      'reports.view',
      'messages.view', 'messages.send',
      'leads.view', 'leads.create', 'leads.edit', 'leads.convert',
      'marketing.view',
    ],
    color: 'violet',
    icon: 'TrendingUp',
    isDefault: true,
    canBeDeleted: false,
  },

  warehouse: {
    id: 'warehouse',
    name: 'Warehouse Manager',
    description: 'Manages inventory, receives shipments, and tracks materials.',
    permissions: [
      'jobs.view',
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.receive', 'inventory.use', 'inventory.reorder',
      'equipment.view', 'equipment.create', 'equipment.edit', 'equipment.assign', 'equipment.maintenance',
      'trucks.view', 'trucks.load', 'trucks.unload',
      'expenses.view', 'expenses.create',
      'reports.view',
      'messages.view', 'messages.send',
    ],
    color: 'amber',
    icon: 'Package',
    isDefault: true,
    canBeDeleted: false,
  },

  helper: {
    id: 'helper',
    name: 'Helper / Laborer',
    description: 'Assists technicians and performs basic tasks.',
    permissions: [
      'jobs.view',
      'time.view_own', 'time.edit_own',
      'inventory.view', 'inventory.use',
      'equipment.view',
      'trucks.view', 'trucks.load', 'trucks.unload',
      'messages.view', 'messages.send',
    ],
    color: 'slate',
    icon: 'Users',
    isDefault: true,
    canBeDeleted: false,
  },
};

/**
 * Get role by ID
 */
export function getContractorRole(roleId: string): ContractorRoleDefinition | undefined {
  return CONTRACTOR_ROLES[roleId];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(roleId: string, permission: ContractorPermission): boolean {
  const role = getContractorRole(roleId);
  return role?.permissions.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(roleId: string, permissions: ContractorPermission[]): boolean {
  return permissions.some(permission => hasPermission(roleId, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(roleId: string, permissions: ContractorPermission[]): boolean {
  return permissions.every(permission => hasPermission(roleId, permission));
}

/**
 * Get all available roles as an array
 */
export function getAllContractorRoles(): ContractorRoleDefinition[] {
  return Object.values(CONTRACTOR_ROLES);
}

/**
 * Get roles suitable for selection (excluding owner)
 */
export function getSelectableContractorRoles(): ContractorRoleDefinition[] {
  return Object.values(CONTRACTOR_ROLES).filter(role => role.id !== 'owner');
}

/**
 * Permission categories for UI grouping
 */
export const PERMISSION_CATEGORIES = {
  'Job Management': [
    'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete', 
    'jobs.assign', 'jobs.complete', 'jobs.schedule'
  ],
  'Customer Management': [
    'customers.view', 'customers.create', 'customers.edit', 
    'customers.delete', 'customers.contact'
  ],
  'Financial': [
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.send',
    'payments.view', 'payments.process',
    'estimates.view', 'estimates.create', 'estimates.edit', 'estimates.delete', 'estimates.send',
    'financials.view_summary', 'financials.view_detailed', 'financials.manage',
    'expenses.view', 'expenses.create', 'expenses.approve'
  ],
  'Team Management': [
    'team.view', 'team.invite', 'team.edit', 'team.remove', 'team.manage_roles',
    'time.view_own', 'time.view_all', 'time.edit_own', 'time.edit_all', 'time.approve'
  ],
  'Inventory & Equipment': [
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
    'inventory.receive', 'inventory.use', 'inventory.reorder',
    'equipment.view', 'equipment.create', 'equipment.edit', 'equipment.delete',
    'equipment.assign', 'equipment.maintenance',
    'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.delete',
    'trucks.load', 'trucks.unload', 'trucks.assign'
  ],
  'Reports & Analytics': [
    'reports.view', 'reports.export', 'analytics.view'
  ],
  'Settings & Configuration': [
    'settings.view', 'settings.edit', 'settings.billing'
  ],
  'Communications': [
    'messages.view', 'messages.send', 'messages.manage'
  ],
  'Sales & Marketing': [
    'leads.view', 'leads.create', 'leads.edit', 'leads.convert',
    'marketing.view', 'marketing.manage'
  ],
} as const;
