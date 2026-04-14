'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Building2, Wrench, ArrowLeft, ArrowRight } from 'lucide-react';

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
    <div className="w-full flex justify-center items-center gap-3 py-3 px-4">

      {/* Left hint — visible when contractor is active */}
      <div className={`hidden sm:flex items-center gap-2 transition-all duration-300 animate-float ${!isPM ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <span className="text-sm sm:text-base font-bold text-sky-400 whitespace-nowrap drop-shadow-sm">Property Manager? Click here</span>
        <ArrowRight className="h-5 w-5 text-sky-400 animate-bounce-x" />
      </div>

      {/* Toggle pill */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 border border-white/15 p-1.5 shadow-2xl backdrop-blur-sm animate-float">
        {/* PM button */}
        <button
          onClick={() => switchTo('pm')}
          className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-105 ${
            isPM
              ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/40 scale-105'
              : 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white opacity-70 hover:opacity-100 shadow-md shadow-cyan-900/40'
          }`}
        >
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          Property Managers
        </button>

        {/* Contractor button */}
        <button
          onClick={() => switchTo('contractor')}
          className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-105 ${
            !isPM
              ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-lg shadow-rose-500/40 scale-105'
              : 'bg-gradient-to-r from-rose-600 to-orange-500 text-white opacity-70 hover:opacity-100 shadow-md shadow-rose-900/40'
          }`}
        >
          <Wrench className="h-3.5 w-3.5 shrink-0" />
          Contractors
        </button>
      </div>

      {/* Right hint — visible when PM is active */}
      <div className={`hidden sm:flex items-center gap-2 transition-all duration-300 animate-float ${isPM ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <ArrowLeft className="h-5 w-5 text-rose-400 animate-bounce-x" />
        <span className="text-sm sm:text-base font-bold text-rose-400 whitespace-nowrap drop-shadow-sm">Contractor? Click here</span>
      </div>

    </div>
  );
}
