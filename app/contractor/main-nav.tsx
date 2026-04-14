'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { contractorNavGroups, type ContractorNavLink } from '@/lib/constants/contractor-nav';
import { AffiliateNavLink } from '@/components/affiliate/affiliate-nav-link';
import { LayoutDashboard, Lock, ChevronDown } from 'lucide-react';

type ContractorTier = 'starter' | 'pro' | 'enterprise';

const tierOrder: Record<ContractorTier, number> = { starter: 1, pro: 2, enterprise: 3 };

const ContractorMainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  const [tier, setTier] = useState<ContractorTier>('starter');
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(contractorNavGroups.map((g) => [g.label, g.defaultOpen ?? false]))
  );

  useEffect(() => {
    fetch('/api/contractor/subscription/usage')
      .then((res) => res.json())
      .then((data) => { if (data.success && data.tier) setTier(data.tier); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Auto-open group containing the active page
    contractorNavGroups.forEach((group) => {
      if (group.items.some((item) =>
        pathname === item.href || (item.href !== '/contractor/dashboard' && pathname.startsWith(item.href))
      )) {
        setOpenGroups((prev) => ({ ...prev, [group.label]: true }));
      }
    });
  }, [pathname]);

  const isLocked = (item: ContractorNavLink) =>
    !item.requiredTier ? false : tierOrder[tier] < tierOrder[item.requiredTier];

  const isActive = (href: string) =>
    pathname === href || (href !== '/contractor/dashboard' && pathname.startsWith(href));

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <nav className={cn('flex flex-col gap-0.5 text-sm font-medium', className)} {...props}>
      {/* Dashboard — always visible standalone */}
      <Link
        href='/contractor/dashboard'
        className={cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
          isActive('/contractor/dashboard')
            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-md'
            : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
        )}
      >
        <LayoutDashboard className={cn(
          'h-4 w-4 shrink-0',
          isActive('/contractor/dashboard') ? 'text-slate-900' : 'text-amber-400'
        )} />
        <span className='nav-text-content font-semibold text-sm'>Dashboard</span>
      </Link>

      {/* Grouped sections */}
      {contractorNavGroups.map((group) => {
        const GroupIcon = group.icon;
        const isOpen = openGroups[group.label] ?? false;
        const hasActive = group.items.some((item) => isActive(item.href));

        return (
          <div key={group.label}>
            {/* Group header button */}
            <button
              type='button'
              onClick={() => toggleGroup(group.label)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                hasActive && !isOpen
                  ? 'text-amber-400 bg-slate-800/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
              )}
            >
              <GroupIcon className={cn(
                'h-4 w-4 shrink-0',
                hasActive ? 'text-amber-400' : 'text-slate-500'
              )} />
              <span className='nav-text-content font-semibold text-sm flex-1 text-left'>{group.label}</span>
              <ChevronDown className={cn(
                'nav-text-content h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-slate-500',
                isOpen && 'rotate-180'
              )} />
            </button>

            {/* Group items */}
            {isOpen && (
              <div className='ml-3 pl-3 border-l border-slate-700/60 mt-0.5 mb-1 space-y-0.5'>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const locked = !loading && isLocked(item);
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => { if (locked) e.preventDefault(); }}
                      title={locked ? `${item.title} — requires ${item.requiredTier} plan` : item.title}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-150',
                        locked && 'opacity-50 cursor-not-allowed',
                        active
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300')} />
                      <span className='nav-text-content text-xs font-medium truncate flex-1'>{item.title}</span>
                      {locked && <Lock className='h-3 w-3 text-amber-500/60 shrink-0' />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Affiliate link */}
      <div className='mt-auto pt-4 border-t border-slate-700/50'>
        <AffiliateNavLink variant='sidebar' />
      </div>
    </nav>
  );
};

export default ContractorMainNav;
