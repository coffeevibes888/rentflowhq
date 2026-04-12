'use client';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { MenuIcon, Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { contractorNavLinks, type ContractorNavLink } from '@/lib/constants/contractor-nav';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

type ContractorTier = 'starter' | 'pro' | 'enterprise';

export default function ContractorMobileDrawer() {
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
      // The page itself will show the upgrade modal
    }
  };

  return (
    <Drawer direction='left'>
      <DrawerTrigger asChild>
        <Button variant='outline' size='sm' className='md:hidden'>
          <MenuIcon className='h-5 w-5' />
        </Button>
      </DrawerTrigger>
      <DrawerContent className='h-full max-w-[85vw] sm:max-w-sm bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white'>
        <DrawerHeader>
          <DrawerTitle className='text-white text-lg'>Contractor Dashboard</DrawerTitle>
        </DrawerHeader>
        <div className='px-3 sm:px-4 py-2 space-y-1 overflow-y-auto'>
          {contractorNavLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/contractor/dashboard' && pathname.startsWith(item.href));
            const locked = !loading && isFeatureLocked(item);

            return (
              <DrawerClose asChild key={item.href}>
                <Link
                  href={item.href}
                  onClick={(e) => handleLockedClick(e, item)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 transition-colors',
                    locked && 'opacity-60',
                    isActive 
                      ? 'bg-white/30 text-white border border-white/40' 
                      : 'text-white hover:bg-white/20'
                  )}
                >
                  <Icon className='h-5 w-5 shrink-0' />
                  <div className='flex flex-col min-w-0 flex-1'>
                    <span className='text-sm font-semibold truncate'>{item.title}</span>
                    <span className='text-xs text-white/80 truncate'>{item.description}</span>
                  </div>
                  {locked && (
                    <Lock className="h-4 w-4 text-amber-300 shrink-0" />
                  )}
                </Link>
              </DrawerClose>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
