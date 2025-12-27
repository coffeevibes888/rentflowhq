import { Building2, FileText, CreditCard, Wallet, Palette, TrendingUp, MessageCircle, ScanText, Users, HardHat, Clock, LucideIcon } from 'lucide-react';

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
    proOnly: true,
  },
  {
    title: 'Team Operations',
    description: 'Scheduling, time tracking & payroll',
    href: '/admin/team-operations',
    icon: Clock,
    enterpriseOnly: true,
  },
  {
    title: 'Analytics',
    description: 'Financial reports & insights',
    href: '/admin/analytics',
    icon: TrendingUp,
    proOnly: true,
  },
  {
    title: 'Communications',
    description: 'Inbox + tenant messages',
    href: '/admin/communications',
    icon: MessageCircle,
  },
  {
    title: 'Branding',
    description: 'Logo, subdomain & custom domain',
    href: '/admin/branding',
    icon: Palette,
  },
  {
    title: 'Team',
    description: 'Invite & manage team members',
    href: '/admin/team',
    icon: Users,
  },
];
