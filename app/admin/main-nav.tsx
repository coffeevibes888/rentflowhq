'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { adminNavLinks } from '@/lib/constants/admin-nav';
import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import { AffiliateNavLink } from '@/components/affiliate/affiliate-nav-link';

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/landlord/subscription', { cache: 'no-store' });
        const data = await res.json();
        const tier = data?.subscription?.tier;
        if (!cancelled) {
          setIsPro(tier === 'pro' || tier === 'enterprise');
        }
      } catch {
        if (!cancelled) {
          setIsPro(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Show all links - pro-only links will show a badge for non-pro users
  const visibleLinks = adminNavLinks;

  return (
    <nav
      className={cn(
        'flex flex-col gap-2 text-base text-black font-medium',
        className
      )}
      {...props}
    >
      {visibleLinks.map((item) => {
        const Icon = item.icon;
        // Special handling for dashboard - exact match only
        const isActive = item.href === '/admin/overview' 
          ? pathname === '/admin/overview'
          : pathname.startsWith(item.href);
        const showProBadge = item.proOnly && !isPro;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.title}
            className={cn(
              'group flex items-center rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]',
              isActive 
                ? 'bg-white border border-black shadow-lg text-black' 
                : 'bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border-transparent text-black hover:bg-slate-600 hover:text-white hover:border-blue-400 hover:shadow-md'
            )}
          >
            <Icon className={cn(
              'h-5 w-5 shrink-0 transition-all duration-200',
              isActive 
                ? 'text-blue-600' 
                : 'text-black group-hover:scale-110'
            )} />
            <div className='flex flex-col min-w-0 flex-1 overflow-hidden'>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-sm truncate font-semibold transition-all duration-200',
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-black'
                )}>{item.title}</span>
                {showProBadge && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white uppercase tracking-wide">
                    <Crown className="h-2 w-2" />
                    Pro
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[11px] truncate transition-all duration-200',
                isActive 
                  ? 'text-blue-500' 
                  : 'text-black/70'
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

export default MainNav;
