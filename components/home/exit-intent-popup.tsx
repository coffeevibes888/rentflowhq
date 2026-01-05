'use client';

import { useState, useEffect } from 'react';
import { X, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if popup was already shown in this session
    const shown = sessionStorage.getItem('exitIntentShown');
    if (shown) {
      return;
    }

    // Show popup after 35 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
      sessionStorage.setItem('exitIntentShown', 'true');
    }, 35000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div 
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        onClick={() => setIsVisible(false)}
      />
      
      {/* Modal */}
      <div className='relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300'>
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className='absolute top-4 right-4 text-slate-400 hover:text-white transition-colors'
        >
          <X className='h-5 w-5' />
        </button>

        {/* Content */}
        <div className='text-center space-y-4'>
          <div className='inline-flex items-center justify-center rounded-full bg-violet-500/20 p-4 border border-violet-500/30'>
            <Gift className='h-8 w-8 text-violet-400' />
          </div>
          
          <h2 className='text-2xl font-bold text-white'>
            Wait! Don't Miss Out
          </h2>
          
          <p className='text-slate-300'>
            Try all features <span className='text-violet-400 font-semibold'>free for 7 days</span> — credit card required. See why property managers love us.
          </p>

          <div className='bg-violet-500/10 border border-violet-500/20 rounded-lg p-4'>
            <p className='text-sm text-violet-200'>
              ✓ Online rent collection<br />
              ✓ Maintenance tracking<br />
              ✓ Digital leases & e-signatures<br />
              ✓ Your own branded tenant portal
            </p>
          </div>

          <div className='space-y-3 pt-2'>
            <Link
              href='/sign-up'
              className='group w-full inline-flex items-center justify-center rounded-full bg-violet-500 text-white px-6 py-3 font-bold hover:bg-violet-400 transition-all duration-300'
            >
              Start Your Free Trial
              <ArrowRight className='ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform' />
            </Link>
            
            <button
              onClick={() => setIsVisible(false)}
              className='w-full text-sm text-slate-400 hover:text-white transition-colors'
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
