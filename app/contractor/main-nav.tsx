'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { contractorNavLinks, type ContractorNavLink } from '@/lib/constants/contractor-nav';
import { AffiliateNavLink } from '@/components/affiliate/affiliate-nav-link';
import { Lock } from 'lucide-react';

type ContractorTier = 'starter' | 'pro' | 'enterprise';

const ContractorMainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  const [tier, setTier] = useState<ContractorTier>('starter');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch contractor tier
    fetch('/api/contractor/subscription/usage')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.tier) {
          setTier(data.tier);
        }
      })
      .catch(err => console.error('Failed to fetch tier:', err))
      .finally(() => setLoading(false));
  }, []);

  const isFeatureLocked = (item: ContractorNavLink): boolean => {
    if (!item.requiredTier) return false;
    
    const tierOrder: Record<ContractorTier, number> = {
      starter: 1,
      pro: 2,
      enterprise: 3,
    };
    
    return tierOrder[tier] < tierOrder[item.requiredTier];
  };

  const handleLockedClick = (e: React.MouseEvent, item: ContractorNavLink) => {
    if (isFeatureLocked(item)) {
      e.preventDefault();
      // Could show a modal here, but for now just prevent navigation
      // The page itself will show the upgrade modal
    }
  };

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
        const locked = !loading && isFeatureLocked(item);

        return (
          <Link
            key={item.href}
            href={item.href}
            title={locked ? `${item.title} - Requires ${item.requiredTier} plan` : item.title}
            onClick={(e) => handleLockedClick(e, item)}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 border-b border-black',
              locked && 'opacity-60 cursor-not-allowed',
              isActive 
                ? 'bg-gradient-to-r from-violet-600/90 to-purple-600/90 text-gray-900 shadow-lg shadow-violet-500/20' 
                : 'hover:bg-gradient-to-r hover:from-violet-100 hover:to-purple-100 hover:shadow-md hover:scale-105'
            )}
          >
            <Icon className={cn(
              'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
              isActive ? 'text-gray-900' : '!text-black'
            )} />
            <div className='flex flex-col min-w-0 nav-text-content flex-1'>
              <span className={cn(
                'text-sm truncate',
                isActive ? 'text-gray-900 font-semibold' : '!text-black !font-semibold'
              )}>{item.title}</span>
              <span className={cn(
                'text-[11px] truncate',
                isActive ? 'text-violet-700' : '!text-black/60'
              )}>{item.description}</span>
            </div>
            {locked && (
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            )}
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
