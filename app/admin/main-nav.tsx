'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { Building2, FileText, Wrench, CreditCard, Settings2 } from 'lucide-react';

const links = [
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
    title: 'Maintenance',
    description: 'Track work tickets',
    href: '/admin/maintenance',
    icon: Wrench,
  },
  {
    title: 'Rents & Evictions',
    description: 'Monthly rent status and notices',
    href: '/admin/revenue',
    icon: CreditCard,
  },
  {
    title: 'Settings',
    description: 'Team & property settings',
    href: '/admin/settings',
    icon: Settings2,
  },
];

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'flex flex-col gap-1 text-sm text-slate-600',
        className
      )}
      {...props}
    >
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
              isActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <Icon className='h-4 w-4 shrink-0' />
            <div className='flex flex-col'>
              <span className='font-medium text-xs'>{item.title}</span>
              <span className='text-[11px] text-slate-400'>{item.description}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
};

export default MainNav;
