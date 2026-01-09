import { Building2, FileText, CreditCard, Wallet, Palette, TrendingUp, ScanText, Users, HardHat, LucideIcon, Settings, UserPlus } from 'lucide-react';

export interface AdminNavLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  proOnly?: boolean;
  enterpriseOnly?: boolean;
}

export const adminNavLinks: AdminNavLink[] = [
  {
    title: 'Properties',
    description: 'Manage buildings and units',
    href: '/admin/products',
    icon: Building2,
  },
  {
    title: 'Tenants',
    description: 'Manage tenants and leases',
    href: '/admin/tenants',
    icon: UserPlus,
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
    title: 'Contractor Work',
    description: 'Hire, invoice & pay contractors',
    href: '/admin/contractors',
    icon: HardHat,
  },
  {
    title: 'Analytics',
    description: 'Financial reports & insights',
    href: '/admin/analytics',
    icon: TrendingUp,
    proOnly: true,
  },
  {
    title: 'Branding',
    description: 'Logo, subdomain & custom domain',
    href: '/admin/branding',
    icon: Palette,
  },
  {
    title: 'Team Hub',
    description: 'Chat, members & operations',
    href: '/admin/team',
    icon: Users,
    proOnly: true,
  },
  {
    title: 'Settings',
    description: 'Profile, fees & preferences',
    href: '/admin/settings',
    icon: Settings,
  },
];
