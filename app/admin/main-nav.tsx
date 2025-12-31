'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { adminNavLinks } from '@/lib/constants/admin-nav';
import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';

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
        'flex flex-col gap-1 text-base text-black font-medium',
        className
      )}
      {...props}
    >
      {visibleLinks.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);
        const showProBadge = item.proOnly && !isPro;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.title}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 overflow-hidden',
              isActive 
                ? 'bg-gradient-to-r from-violet-600/90 to-purple-600/90 text-white shadow-lg shadow-violet-500/20' 
                : 'hover:bg-white/20'
            )}
          >
            <Icon className={cn(
              'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
              isActive ? 'text-white' : '!text-black'
            )} />
            <div className='flex flex-col min-w-0 flex-1 overflow-hidden'>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-sm truncate',
                  isActive ? 'text-white font-semibold' : '!text-black !font-semibold'
                )}>{item.title}</span>
                {showProBadge && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white uppercase tracking-wide">
                    <Crown className="h-2 w-2" />
                    Pro
                  </span>
                )}
              </div>
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

export default MainNav;
