import { 
  LayoutDashboard, 
  ClipboardList, 
  Calculator, 
  Building2, 
  Wallet, 
  Palette, 
  Camera,
  Clock,
  Briefcase,
  Scale,
  Users,
  FolderKanban,
  BarChart3,
  Calendar,
  UserCircle,
  Megaphone,
  Package,
  Wrench,
  LucideIcon 
} from 'lucide-react';

export interface ContractorNavLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  requiredTier?: 'pro' | 'enterprise'; // Optional: if set, feature requires this tier or higher
  locked?: boolean; // Will be set dynamically based on user's tier
}

export const contractorNavLinks: ContractorNavLink[] = [
  {
    title: 'Dashboard',
    description: 'Overview of your work',
    href: '/contractor/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Jobs',
    description: 'Manage your projects',
    href: '/contractor/jobs',
    icon: FolderKanban,
  },
  {
    title: 'Customers',
    description: 'Customer CRM',
    href: '/contractor/customers',
    icon: Users,
    requiredTier: 'pro', // CRM features require Pro or Enterprise
  },
  {
    title: 'Team Hub',
    description: 'Team management',
    href: '/contractor/team',
    icon: Users,
    requiredTier: 'pro', // Team management requires Pro or Enterprise
  },
  {
    title: 'Calendar',
    description: 'Schedule & dispatch',
    href: '/contractor/calendar',
    icon: Calendar,
  },
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
    title: 'Inventory',
    description: 'Materials & supplies',
    href: '/contractor/inventory',
    icon: Package,
    requiredTier: 'pro', // Inventory tracking requires Pro or Enterprise
  },
  {
    title: 'Equipment',
    description: 'Tools & machinery',
    href: '/contractor/equipment',
    icon: Wrench,
    requiredTier: 'pro', // Equipment tracking requires Pro or Enterprise
  },
  {
    title: 'My Business',
    description: 'Portfolio, relationships & more',
    href: '/contractor/business',
    icon: Briefcase,
  },
  {
    title: 'My Profile',
    description: 'Public profile & branding',
    href: '/contractor/profile/branding',
    icon: Palette,
  },
];
