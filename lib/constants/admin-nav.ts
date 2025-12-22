import { Building2, FileText, Wrench, CreditCard, Settings2, Wallet, Palette, TrendingUp, MessageCircle, Scale, ScanText, Users, LucideIcon } from 'lucide-react';

export interface AdminNavLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  proOnly?: boolean;
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
    title: 'Maintenance',
    description: 'Track work tickets',
    href: '/admin/maintenance',
    icon: Wrench,
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
