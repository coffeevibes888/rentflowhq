'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { contractorNavLinks } from '@/lib/constants/contractor-nav';

const ContractorMainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'flex flex-col gap-1 text-base text-black font-medium',
        className
      )}
      {...props}
    >
      {contractorNavLinks.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || 
          (item.href !== '/contractor/dashboard' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.title}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
              isActive 
                ? 'bg-gradient-to-r from-violet-600/90 to-purple-600/90 text-white shadow-lg shadow-violet-500/20' 
                : 'hover:bg-white/20'
            )}
          >
            <Icon className={cn(
              'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
              isActive ? 'text-white' : '!text-black'
            )} />
            <div className='flex flex-col min-w-0 nav-text-content'>
              <span className={cn(
                'text-sm truncate',
                isActive ? 'text-white font-semibold' : '!text-black !font-semibold'
              )}>{item.title}</span>
              <span className={cn(
                'text-[11px] truncate',
                isActive ? 'text-violet-200' : '!text-black/60'
              )}>{item.description}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
};

export default ContractorMainNav;
