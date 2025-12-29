'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { adminNavLinks } from '@/lib/constants/admin-nav';
import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  const [showManageSubscription, setShowManageSubscription] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/landlord/subscription', { cache: 'no-store' });
        const data = await res.json();
        const tier = data?.subscription?.tier;
        if (!cancelled) {
          setShowManageSubscription(Boolean(tier && tier !== 'free'));
          setIsPro(tier === 'pro' || tier === 'enterprise');
        }
      } catch {
        if (!cancelled) {
          setShowManageSubscription(false);
          setIsPro(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter out proOnly links for free tier users
  const visibleLinks = adminNavLinks.filter(item => !item.proOnly || isPro);

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

      {showManageSubscription && (
        <Link
          href='/admin/settings/subscription'
          title="Manage Subscription"
          className={cn(
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
            pathname.startsWith('/admin/settings/subscription') 
              ? 'bg-gradient-to-r from-violet-600/90 to-purple-600/90 text-white shadow-lg shadow-violet-500/20' 
              : 'hover:bg-white/20'
          )}
        >
          <Settings2 className={cn(
            'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
            pathname.startsWith('/admin/settings/subscription') ? 'text-white' : '!text-black'
          )} />
          <div className='flex flex-col min-w-0 nav-text-content'>
            <span className={cn(
              'text-sm truncate',
              pathname.startsWith('/admin/settings/subscription') ? 'text-white font-semibold' : '!text-black !font-semibold'
            )}>Manage Subscription</span>
            <span className={cn(
              'text-[11px] truncate',
              pathname.startsWith('/admin/settings/subscription') ? 'text-violet-200' : '!text-black/60'
            )}>Billing portal & usage</span>
          </div>
        </Link>
      )}
    </nav>
  );
};

export default MainNav;
