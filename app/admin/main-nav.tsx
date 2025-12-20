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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/landlord/subscription', { cache: 'no-store' });
        const data = await res.json();
        const tier = data?.subscription?.tier;
        if (!cancelled) {
          setShowManageSubscription(Boolean(tier && tier !== 'free'));
        }
      } catch {
        if (!cancelled) setShowManageSubscription(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav
      className={cn(
        'flex flex-col gap-2 text-base text-black font-medium',
        className
      )}
      {...props}
    >
      {adminNavLinks.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2',
              isActive ? 'text-white font-semibold' : 'text-black'
            )}
          >
            <Icon className='h-5 w-5 shrink-0' />
            <div className='flex flex-col'>
              <span className='font-medium text-sm'>{item.title}</span>
              <span className='text-xs text-emerald-300'>{item.description}</span>
            </div>
          </Link>
        );
      })}

      {showManageSubscription && (
        <Link
          href='/admin/settings/subscription'
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2',
            pathname.startsWith('/admin/settings/subscription') ? 'text-white font-semibold' : 'text-black'
          )}
        >
          <Settings2 className='h-5 w-5 shrink-0' />
          <div className='flex flex-col'>
            <span className='font-medium text-sm'>Manage Subscription</span>
            <span className='text-xs text-emerald-300'>Billing portal & usage</span>
          </div>
        </Link>
      )}
    </nav>
  );
};

export default MainNav;
