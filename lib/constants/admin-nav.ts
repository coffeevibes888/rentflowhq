import { Building2, FileText, CreditCard, Wallet, Palette, TrendingUp, ScanText, Users, HardHat, LucideIcon, Settings, LayoutDashboard, Briefcase, MessageCircle, Wrench, Calendar, Clock, FileSpreadsheet, DollarSign, UserPlus } from 'lucide-react';

export interface AdminNavLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  proOnly?: boolean;
  enterpriseOnly?: boolean;
}

export interface AdminNavGroup {
  label: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  items: AdminNavLink[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Properties',
    icon: Building2,
    defaultOpen: true,
    items: [
      {
        title: 'Properties',
        description: 'Manage buildings and units',
        href: '/admin/products',
        icon: Building2,
      },
      {
        title: 'Applications',
        description: 'Review rental applications',
        href: '/admin/applications',
        icon: FileText,
      },
      {
        title: 'Documents',
        description: 'Manage leases, applications, and more',
        href: '/admin/documents',
        icon: ScanText,
      },
    ],
  },
  {
    label: 'Financials',
    icon: CreditCard,
    defaultOpen: false,
    items: [
      {
        title: 'Rents',
        description: 'Monthly rent status',
        href: '/admin/revenue',
        icon: CreditCard,
      },
      {
        title: 'Payouts',
        description: 'Cash out collected rent',
        href: '/admin/payouts',
        icon: Wallet,
      },
      {
        title: 'Analytics',
        description: 'Financial reports & insights',
        href: '/admin/analytics',
        icon: TrendingUp,
        proOnly: true,
      },
    ],
  },
  {
    label: 'Operations',
    icon: HardHat,
    defaultOpen: false,
    items: [
      {
        title: 'Messages',
        description: 'Inbox & tenant communications',
        href: '/admin/messages',
        icon: MessageCircle,
      },
      {
        title: 'Maintenance',
        description: 'View and manage work requests',
        href: '/admin/maintenance',
        icon: Wrench,
      },
      {
        title: 'Contractor Work',
        description: 'Hire, invoice & pay contractors',
        href: '/admin/contractors',
        icon: HardHat,
      },
    ],
  },
  {
    label: 'Team',
    icon: Users,
    defaultOpen: false,
    items: [
      {
        title: 'Directory',
        description: 'Team members & roles',
        href: '/admin/team/directory',
        icon: Users,
        proOnly: true,
      },
      {
        title: 'Scheduling',
        description: 'Shifts & calendar',
        href: '/admin/team/schedule',
        icon: Calendar,
        proOnly: true,
      },
      {
        title: 'Time & Attendance',
        description: 'Clock in/out & tracking',
        href: '/admin/team/time',
        icon: Clock,
        proOnly: true,
      },
      {
        title: 'Timesheets',
        description: 'Approvals & payroll',
        href: '/admin/team/timesheets',
        icon: FileSpreadsheet,
        proOnly: true,
      },
      {
        title: 'Hiring',
        description: 'Job postings & applicants',
        href: '/admin/team/hiring',
        icon: UserPlus,
        proOnly: true,
      },
      {
        title: 'Payroll',
        description: 'Payments & integrations',
        href: '/admin/team/payroll',
        icon: DollarSign,
        enterpriseOnly: true,
      },
    ],
  },
  {
    label: 'Settings',
    icon: Briefcase,
    defaultOpen: false,
    items: [
      {
        title: 'Branding',
        description: 'Logo, subdomain & custom domain',
        href: '/admin/branding',
        icon: Palette,
      },
      {
        title: 'Settings',
        description: 'Profile, fees & preferences',
        href: '/admin/settings',
        icon: Settings,
      },
    ],
  },
];

export const adminNavLinks: AdminNavLink[] = [
  {
    title: 'Dashboard',
    description: 'Overview & quick actions',
    href: '/admin/overview',
    icon: LayoutDashboard,
  },
  ...adminNavGroups.flatMap((g) => g.items),
];
