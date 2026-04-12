'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Building2, Wrench } from 'lucide-react';

export default function AudienceTabBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [audience, setAudience] = useState<'pm' | 'contractor'>('pm');

  useEffect(() => {
    const param = searchParams.get('for');
    setAudience(param === 'contractor' ? 'contractor' : 'pm');
  }, [searchParams]);

  // Only render on the root homepage
  if (pathname !== '/') return null;

  const switchTo = (a: 'pm' | 'contractor') => {
    setAudience(a);
    const params = new URLSearchParams(searchParams.toString());
    if (a === 'pm') params.delete('for');
    else params.set('for', a);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const isPM = audience === 'pm';

  return (
    <div className="w-full flex justify-center py-2 bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/20 p-1 shadow-xl">
        <button
          onClick={() => switchTo('pm')}
          className={`relative px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
            isPM
              ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
          }`}
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Property Managers
          </span>
        </button>
        <button
          onClick={() => switchTo('contractor')}
          className={`relative px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
            !isPM
              ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-lg shadow-rose-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
          }`}
        >
          <span className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Contractors
          </span>
        </button>
      </div>
    </div>
  );
}
