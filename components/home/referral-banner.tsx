import Link from 'next/link';
import { Gift, ArrowRight, Users } from 'lucide-react';

export default function ReferralBanner() {
  return (
    <section className='w-full py-8 md:py-12 px-3 md:px-4'>
      <div className='max-w-5xl mx-auto'>
        <div className='rounded-2xl md:rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-fuchsia-600/20 backdrop-blur-xl p-6 md:p-10 relative overflow-hidden'>
          {/* Background decoration */}
          <div className='absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2' />
          <div className='absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2' />
          
          <div className='relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10'>
            {/* Icon */}
            <div className='flex-shrink-0'>
              <div className='rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-4 md:p-5 shadow-lg shadow-violet-500/30'>
                <Gift className='h-8 w-8 md:h-10 md:w-10 text-white' />
              </div>
            </div>

            {/* Content */}
            <div className='flex-1 text-center md:text-left space-y-2 md:space-y-3'>
              <h3 className='text-xl md:text-2xl font-bold text-white'>
                Refer a Friend, Get $50 Credit
              </h3>
              <p className='text-sm md:text-base text-slate-200 max-w-xl'>
                Know another landlord who could use Property Flow HQ? Share your referral link and you'll both get $50 credit when they sign up and collect their first rent payment.
              </p>
              <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs md:text-sm text-slate-300'>
                <div className='flex items-center gap-1.5'>
                  <Users className='h-4 w-4 text-violet-400' />
                  <span>No limit on referrals</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <Gift className='h-4 w-4 text-fuchsia-400' />
                  <span>Credits never expire</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className='flex-shrink-0'>
              <Link
                href='/admin/referrals'
                className='group inline-flex items-center justify-center rounded-full bg-white text-violet-600 px-6 py-3 md:px-8 md:py-3.5 text-sm md:text-base font-bold shadow-lg hover:bg-violet-50 transition-all duration-300 hover:scale-105'
              >
                Get Your Link
                <ArrowRight className='ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform' />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
