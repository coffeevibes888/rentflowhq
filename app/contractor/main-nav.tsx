'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { contractorNavLinks } from '@/lib/constants/contractor-nav';
import { AffiliateNavLink } from '@/components/affiliate/affiliate-nav-link';

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
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 border-b border-black',
              isActive 
                ? 'bg-gradient-to-r from-violet-600/90 to-purple-600/90 text-gray-900 shadow-lg shadow-violet-500/20' 
                : 'hover:bg-gradient-to-r hover:from-violet-100 hover:to-purple-100 hover:shadow-md hover:scale-105'
            )}
          >
            <Icon className={cn(
              'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
              isActive ? 'text-gray-900' : '!text-black'
            )} />
            <div className='flex flex-col min-w-0 nav-text-content'>
              <span className={cn(
                'text-sm truncate',
                isActive ? 'text-gray-900 font-semibold' : '!text-black !font-semibold'
              )}>{item.title}</span>
              <span className={cn(
                'text-[11px] truncate',
                isActive ? 'text-violet-700' : '!text-black/60'
              )}>{item.description}</span>
            </div>
          </Link>
        );
      })}
      
      {/* Affiliate Dashboard Link - only shows if user is an affiliate */}
      <div className="mt-auto pt-4 border-t border-black/10">
        <AffiliateNavLink variant="sidebar" />
      </div>
    </nav>
  );
};

export default ContractorMainNav;
