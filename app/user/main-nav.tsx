'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import {
  User,
  FileText,
  FileSignature,
  ReceiptText,
  MessageCircle,
  LayoutDashboard,
  Wallet,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { AffiliateNavLink } from '@/components/affiliate/affiliate-nav-link';

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Determine dashboard label and link based on role
  let dashboardLabel = 'Dashboard';
  let dashboardLink = '/';
  
  if (userRole === 'tenant') {
    dashboardLabel = 'Tenant Dashboard';
    dashboardLink = '/user/dashboard';
  } else if (userRole === 'landlord' || userRole === 'admin' || userRole === 'superAdmin') {
    dashboardLabel = 'Landlord Dashboard';
    dashboardLink = '/admin/overview';
  } else if (userRole === 'property_manager') {
    dashboardLabel = 'Property Manager Dashboard';
    dashboardLink = '/admin/overview';
  }

  const links = [
    {
      title: dashboardLabel,
      description: 'View your dashboard',
      href: dashboardLink,
      icon: LayoutDashboard,
    },
    {
      title: 'Pay Rent',
      description: 'Make a rent payment',
      href: '/user/pay',
      icon: Wallet,
    },
    {
      title: 'Profile',
      description: 'Manage your personal details',
      href: '/user/profile',
      icon: User,
    },
    {
      title: 'Applications',
      description: 'View and complete your applications',
      href: '/user/applications',
      icon: FileText,
    },
    {
      title: 'Lease',
      description: 'Review lease documents',
      href: '/user/profile/lease',
      icon: FileSignature,
    },
    {
      title: 'Payment History',
      description: 'View past payments',
      href: '/user/profile/rent-receipts',
      icon: ReceiptText,
    },
    {
      title: 'Maintenance',
      description: 'Submit a maintenance request',
      href: '/user/profile/ticket',
      icon: MessageCircle,
    },
  ];

  return (
    <nav
      className={cn(
        'flex flex-col gap-0.5 text-sm font-medium',
        className
      )}
      {...props}
    >
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
              isActive
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-indigo-400' : 'text-slate-500')} />
            <div className='flex flex-col'>
              <span className='font-medium text-xs'>{item.title}</span>
              <span className={cn('text-xs', isActive ? 'text-indigo-300/70' : 'text-slate-600')}>{item.description}</span>
            </div>
          </Link>
        );
      })}
      
      {/* Affiliate Dashboard Link - only shows if user is an affiliate */}
      <div className="mt-auto pt-4 border-t border-slate-700/50">
        <AffiliateNavLink variant="sidebar" />
      </div>
    </nav>
  );
};

export default MainNav;
