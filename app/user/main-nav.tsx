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
} from 'lucide-react';

const links = [
  {
    title: 'Profile',
    description: 'Manage your personal details',
    href: '/user/profile',
    icon: User,
  },
  {
    title: 'Application',
    description: 'View your rental application',
    href: '/user/profile/application',
    icon: FileText,
  },
  {
    title: 'Lease',
    description: 'Review lease documents',
    href: '/user/profile/lease',
    icon: FileSignature,
  },
  {
    title: 'Rent Receipts',
    description: 'Download payment receipts',
    href: '/user/profile/rent-receipts',
    icon: ReceiptText,
  },
  {
    title: 'Create Ticket',
    description: 'Submit a maintenance request',
    href: '/user/profile/ticket',
    icon: MessageCircle,
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
        'flex flex-col gap-1 text-md text-black hover:text-white',
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
