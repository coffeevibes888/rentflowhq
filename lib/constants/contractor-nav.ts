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
        title: 'Team Hub',
        description: 'Team management',
        href: '/contractor/team',
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
        title: 'My Profile',
        description: 'Public profile & branding',
        href: '/contractor/profile/branding',
        icon: Palette,
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
