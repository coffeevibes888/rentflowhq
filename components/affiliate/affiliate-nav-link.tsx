'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HandCoins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AffiliateNavLinkProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'sidebar' | 'mobile' | 'header';
}

export function AffiliateNavLink({ 
  className, 
  showLabel = true,
  variant = 'sidebar' 
}: AffiliateNavLinkProps) {
  const [isAffiliate, setIsAffiliate] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAffiliateStatus() {
      // Check localStorage first for cached status
      const cachedStatus = localStorage.getItem('isAffiliate');
      if (cachedStatus !== null) {
        setIsAffiliate(cachedStatus === 'true');
        setIsLoading(false);
      }

      try {
        const res = await fetch('/api/affiliate/status');
        const data = await res.json();
        setIsAffiliate(data.isAffiliate);
        // Cache the status in localStorage
        localStorage.setItem('isAffiliate', String(data.isAffiliate));
      } catch (error) {
        console.error('Failed to check affiliate status:', error);
        // If API fails but we have cached status, use it
        if (cachedStatus === null) {
          setIsAffiliate(false);
        }
      } finally {
        setIsLoading(false);
      }
    }

    checkAffiliateStatus();
  }, []);

  // Don't render anything while loading or if not an affiliate
  if (isLoading && isAffiliate === null) {
    return null;
  }
  
  if (!isAffiliate) {
    return null;
  }

  if (variant === 'mobile') {
    return (
      <Link
        href="/affiliate-program/dashboard"
        className={cn(
          'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg',
          'bg-gradient-to-r from-violet-600/20 to-purple-600/20',
          'text-violet-300 hover:text-white hover:from-violet-600/30 hover:to-purple-600/30',
          'border border-violet-500/30 transition-all',
          className
        )}
      >
        <HandCoins className="h-5 w-5" />
        <span>Affiliate Dashboard</span>
      </Link>
    );
  }

  if (variant === 'header') {
    return (
      <Link
        href="/affiliate-program/dashboard"
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg',
          'bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 hover:text-white',
          'transition-all',
          className
        )}
      >
        <HandCoins className="h-4 w-4" />
        {showLabel && <span>Affiliate</span>}
      </Link>
    );
  }

  // Default sidebar variant
  return (
    <Link
      href="/affiliate-program/dashboard"
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg',
        'bg-gradient-to-r from-violet-600/10 to-purple-600/10',
        'text-violet-300 hover:text-white hover:from-violet-600/20 hover:to-purple-600/20',
        'border border-violet-500/20 hover:border-violet-500/40 transition-all',
        className
      )}
    >
      <HandCoins className="h-5 w-5 flex-shrink-0" />
      {showLabel && (
        <span className="nav-text-content">Affiliate Dashboard</span>
      )}
    </Link>
  );
}
