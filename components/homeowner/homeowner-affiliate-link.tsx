'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HomeownerAffiliateLink() {
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

  return (
    <Link href="/affiliate-program/dashboard">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-violet-300 hover:text-white hover:bg-violet-600/20 border border-violet-500/30"
      >
        <HandCoins className="h-4 w-4 mr-2" />
        Affiliate
      </Button>
    </Link>
  );
}
