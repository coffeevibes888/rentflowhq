import { 
  LayoutDashboard, 
  ClipboardList, 
  Calculator, 
  Palette, 
  Briefcase,
  Users,
  FolderKanban,
  BarChart3,
  Calendar,
  Megaphone,
  Package,
  Wrench,
  Shield,
  ShoppingCart,
  FileCheck,
  Truck,
  HardHat,
  TrendingUp,
  Settings,
  CreditCard,
  UserCircle,
  DollarSign,
  Receipt,
  FileSignature,
  Tag,
  MapPin,
  Zap,
  LucideIcon 
} from 'lucide-react';

export interface ContractorNavLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  requiredTier?: 'pro' | 'enterprise';
  locked?: boolean;
}

export interface ContractorNavGroup {
  label: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  items: ContractorNavLink[];
}

export const contractorNavGroups: ContractorNavGroup[] = [
  {
    label: 'Work',
    icon: FolderKanban,
    defaultOpen: true,
    items: [
      {
        title: 'Jobs',
        description: 'Manage your projects',
        href: '/contractor/jobs',
        icon: FolderKanban,
      },
      {
        title: 'Work Orders',
        description: 'View and manage jobs',
        href: '/contractor/work-orders',
        icon: ClipboardList,
      },
      {
        title: 'Estimates',
        description: 'Create and send quotes',
        href: '/contractor/estimates',
        icon: Calculator,
      },
      {
        title: 'Calendar',
        description: 'Schedule & dispatch',
        href: '/contractor/calendar',
        icon: Calendar,
      },
    ],
  },
  {
    label: 'People',
    icon: Users,
    defaultOpen: false,
    items: [
      {
        title: 'Customers',
        description: 'Customer CRM',
        href: '/contractor/customers',
        icon: Users,
        requiredTier: 'pro',
      },
      {
        title: 'Subcontractors',
        description: 'Subcontractor network',
        href: '/contractor/subcontractors',
        icon: HardHat,
        requiredTier: 'pro',
      },
      {
        title: 'Dispatch',
        description: 'Crew scheduling',
        href: '/contractor/dispatch',
        icon: Truck,
        requiredTier: 'pro',
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
        href: '/contractor/team/directory',
        icon: Users,
        requiredTier: 'pro',
      },
      {
        title: 'Scheduling',
        description: 'Shifts & calendar',
        href: '/contractor/team/schedule',
        icon: Calendar,
        requiredTier: 'pro',
      },
      {
        title: 'Time & Attendance',
        description: 'Clock in/out & tracking',
        href: '/contractor/team/time',
        icon: ClipboardList,
        requiredTier: 'pro',
      },
      {
        title: 'Timesheets',
        description: 'Approvals & payroll',
        href: '/contractor/team/timesheets',
        icon: FileCheck,
        requiredTier: 'pro',
      },
      {
        title: 'Hiring',
        description: 'Job postings & applicants',
        href: '/contractor/team/hiring',
        icon: Users,
        requiredTier: 'pro',
      },
    ],
  },
  {
    label: 'Resources',
    icon: Package,
    defaultOpen: false,
    items: [
      {
        title: 'Inventory',
        description: 'Materials & supplies',
        href: '/contractor/inventory',
        icon: Package,
        requiredTier: 'pro',
      },
      {
        title: 'Equipment',
        description: 'Tools & machinery',
        href: '/contractor/equipment',
        icon: Wrench,
        requiredTier: 'pro',
      },
      {
        title: 'Purchase Orders',
        description: 'Material orders',
        href: '/contractor/purchase-orders',
        icon: ShoppingCart,
        requiredTier: 'pro',
      },
      {
        title: 'Receiving Dock',
        description: 'Log incoming materials',
        href: '/contractor/receiving',
        icon: Truck,
        requiredTier: 'pro',
      },
      {
        title: 'Shipping',
        description: 'Ship materials to job sites',
        href: '/contractor/shipping',
        icon: Package,
        requiredTier: 'pro',
      },
      {
        title: 'Label Center',
        description: 'Print & manage labels',
        href: '/contractor/labels',
        icon: Tag,
        requiredTier: 'pro',
      },
      {
        title: 'Find Inventory',
        description: 'Locate items by name or label',
        href: '/contractor/inventory/locate',
        icon: MapPin,
        requiredTier: 'pro',
      },
    ],
  },
  {
    label: 'Growth',
    icon: TrendingUp,
    defaultOpen: false,
    items: [
      {
        title: 'Marketing',
        description: 'Campaigns & referrals',
        href: '/contractor/marketing',
        icon: Megaphone,
      },
      {
        title: 'Reports',
        description: 'Analytics & insights',
        href: '/contractor/reports',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'Business',
    icon: Briefcase,
    defaultOpen: false,
    items: [
      {
        title: 'My Business',
        description: 'Portfolio & relationships',
        href: '/contractor/business',
        icon: Briefcase,
      },
      {
        title: 'Public Profile',
        description: 'Marketplace profile & branding',
        href: '/contractor/profile/branding',
        icon: Palette,
      },
      {
        title: 'Marketplace Visibility',
        description: 'How you rank & boost impressions',
        href: '/contractor/profile/visibility',
        icon: TrendingUp,
      },
      {
        title: 'Warranties',
        description: 'Agreements & claims',
        href: '/contractor/warranties',
        icon: FileCheck,
      },
      {
        title: 'Safety',
        description: 'OSHA checklists',
        href: '/contractor/safety',
        icon: Shield,
        requiredTier: 'pro',
      },
      {
        title: 'Payroll',
        description: 'Run payroll & pay stubs',
        href: '/contractor/payroll',
        icon: DollarSign,
        requiredTier: 'pro',
      },
      {
        title: 'Tax & Financials',
        description: 'P&L report & 1099 prep',
        href: '/contractor/finance/tax',
        icon: Receipt,
        requiredTier: 'pro',
      },
      {
        title: 'Contracts',
        description: 'Create & send contracts for signing',
        href: '/contractor/contracts',
        icon: FileSignature,
      },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    defaultOpen: false,
    items: [
      {
        title: 'Account',
        description: 'Profile, avatar & password',
        href: '/contractor/settings/account',
        icon: UserCircle,
      },
      {
        title: 'Billing',
        description: 'Payment method & invoices',
        href: '/contractor/settings/billing',
        icon: CreditCard,
      },
      {
        title: 'API & Webhooks',
        description: 'Automate with API keys & webhooks',
        href: '/contractor/settings/api',
        icon: Zap,
        requiredTier: 'enterprise' as const,
      },
      {
        title: 'Subscription',
        description: 'Plan, usage & upgrades',
        href: '/contractor/settings/subscription',
        icon: TrendingUp,
      },
    ],
  },
];

export const contractorNavLinks: ContractorNavLink[] = [
  {
    title: 'Dashboard',
    description: 'Overview of your work',
    href: '/contractor/dashboard',
    icon: LayoutDashboard,
  },
  ...contractorNavGroups.flatMap((g) => g.items),
];
