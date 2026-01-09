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
  LucideIcon 
} from 'lucide-react';

export interface ContractorNavLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const contractorNavLinks: ContractorNavLink[] = [
  {
    title: 'Dashboard',
    description: 'Overview of your work',
    href: '/contractor/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Browse Jobs',
    description: 'Find open jobs & bid',
    href: '/contractors?view=jobs',
    icon: Briefcase,
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
    title: 'Time Tracking',
    description: 'Log hours and track jobs',
    href: '/contractor/time-tracking',
    icon: Clock,
  },
  {
    title: 'My Work',
    description: 'Photos, videos & documentation',
    href: '/contractor/portfolio',
    icon: Camera,
  },
  {
    title: 'My Landlords',
    description: 'Property managers you work with',
    href: '/contractor/landlords',
    icon: Building2,
  },
  {
    title: 'Payouts',
    description: 'Earnings and payment history',
    href: '/contractor/payouts',
    icon: Wallet,
  },
  {
    title: 'Disputes',
    description: 'File or view disputes',
    href: '/contractor/disputes',
    icon: Scale,
  },
  {
    title: 'My Profile',
    description: 'Public profile & branding',
    href: '/contractor/profile/branding',
    icon: Palette,
  },
];
