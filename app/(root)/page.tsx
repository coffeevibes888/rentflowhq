import { APP_NAME } from '@/lib/constants';
// import CustomerReviews from '@/components/home/customer-reviews';
import HomeContactCard from '@/components/home/home-contact-card';
import TrustBadges from '@/components/home/trust-badges';
import NewsletterSignup from '@/components/home/newsletter-signup';
import ExitIntentPopup from '@/components/home/exit-intent-popup';
import PricingSection from '@/components/home/pricing-section';
import { headers } from 'next/headers';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Clock, DollarSign, FileText, MessageSquare, Wrench, Building2, Users, CreditCard, Calendar, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import { unstable_cache } from 'next/cache';

// Cache landlord lookup for 5 minutes to reduce DB queries
const getCachedLandlord = unstable_cache(
  async (subdomain: string) => {
    return prisma.landlord.findUnique({ where: { subdomain } });
  },
  ['landlord-by-subdomain'],
  { revalidate: 300 } // 5 minutes
);

// Cache properties for a landlord for 2 minutes
const getCachedProperties = unstable_cache(
  async (landlordId: string) => {
    return prisma.property.findMany({
      where: {
        landlordId,
        units: {
          some: {
            isAvailable: true,
          },
        },
      },
      include: {
        units: {
          where: { isAvailable: true },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['landlord-properties'],
  { revalidate: 120 } // 2 minutes
);

async function getLandlordForRequest() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const rawApex = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  const bareHost = host.split(':')[0].toLowerCase();
  let subdomain: string | null = null;

  if (rawApex) {
    let apex = rawApex.trim().toLowerCase();

    if (apex.startsWith('http://')) apex = apex.slice(7);
    if (apex.startsWith('https://')) apex = apex.slice(8);
    if (apex.endsWith('/')) apex = apex.slice(0, -1);

    const apexBase = apex.split(':')[0];

    if (bareHost !== apexBase && bareHost.endsWith(`.${apexBase}`)) {
      subdomain = bareHost.slice(0, bareHost.length - apexBase.length - 1);
    }
  }

  if (!subdomain && bareHost.endsWith('.localhost')) {
    subdomain = bareHost.slice(0, bareHost.length - '.localhost'.length);
  }

  if (!subdomain) {
    return null;
  }

  // Use cached version instead of direct DB query
  const landlord = await getCachedLandlord(subdomain);
  return landlord;
}

const Homepage = async () => {
  const landlord = await getLandlordForRequest();

  if (landlord) {
    // Use cached properties query
    const properties = await getCachedProperties(landlord.id);

    return (
      <main className='flex-1 w-full'>
        <section className='w-full pt-10 pb-14 px-4'>
          <div className='max-w-6xl mx-auto space-y-4 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl p-6 md:p-8 text-slate-50 shadow-[0_20px_70px_rgba(15,23,42,0.9)]'>
            <div className='space-y-1'>
              <p className='text-xs font-medium text-violet-200/80 uppercase tracking-wide'>Listings</p>
              <h1 className='text-2xl md:text-3xl font-semibold tracking-tight text-white'>Homes and apartments by {landlord.name}</h1>
              <p className='text-sm text-slate-100/80 max-w-2xl'>
                Browse available units and start your application online. All rent payments and maintenance
                requests are handled securely through our resident portal.
              </p>
            </div>
          </div>
        </section>

        <section className='w-full py-10 px-4'>
          <div className='max-w-6xl mx-auto rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl p-6 md:p-8 text-slate-50 shadow-[0_20px_70px_rgba(15,23,42,0.9)]'>
            {properties.length === 0 ? (
              <div className='rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-sm px-4 py-8 text-center text-sm text-slate-200/90'>
                No properties are currently available for this landlord. Please check back soon.
              </div>
            ) : (
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {properties.map((property) => {
                  const unitCount = property.units.length;
                  return (
                    <div
                      key={property.id}
                      className='rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-[0_20px_70px_rgba(15,23,42,0.9)] overflow-hidden flex flex-col'
                    >
                      <div className='relative h-44 w-full bg-slate-900/60'>
                        <Image
                          src={property.units[0]?.images?.[0] || '/images/placeholder-property.jpg'}
                          alt={property.name}
                          fill
                          className='object-cover'
                        />
                      </div>
                      <div className='p-4 space-y-2 flex-1 flex flex-col'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='space-y-1'>
                            <h2 className='text-sm font-semibold text-white'>{property.name}</h2>
                            <p className='text-[11px] text-slate-200'>
                              {unitCount === 1
                                ? '1 available unit'
                                : `${unitCount} available units`}
                            </p>
                          </div>
                        </div>

                        {property.units[0] && (
                          <p className='text-sm font-medium text-violet-200/80 mt-1'>
                            {formatCurrency(Number(property.units[0].rentAmount))} / month
                          </p>
                        )}

                        <div className='mt-3 flex items-center justify-between text-[11px] text-slate-200'>
                          <span>{property.type}</span>
                          <span>Professionally managed</span>
                        </div>

                        <div className='mt-4 flex gap-2'>
                          <Link
                            href={`/${property.slug}/apply`}
                            className='inline-flex items-center justify-center rounded-full bg-violet-500 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-violet-400 flex-1 transition-colors'
                          >
                            Start application
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className='flex-1 w-full'>
        {/* Hero Section - Conversion Focused */}
        <section className='w-full pt-6 pb-10 md:pt-20 md:pb-24 px-3 md:px-4 relative overflow-hidden'>
          <div className='absolute inset-0  animate-pulse' />
          <div className='max-w-7xl mx-auto relative z-10'>
            <div className='grid gap-6 md:gap-8 lg:grid-cols-2 items-center'>
              <div className='space-y-4 md:space-y-6 animate-in fade-in slide-in-from-left duration-700'>
                
                <h1 className='text-3xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight'>
                 Property Management...
                </h1>
                <h4 className='text-3xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight'>
                 Fully Automated!
                </h4>
                <p className='text-sm md:text-lg text-white font-bold max-w-xl leading-relaxed'>
                  Find the time to live the life you always dreamed and let us handle the dirty work...From appications, collecting rents, leases, maintance tickets, internal communicatins, to yes even the eviction process we got your back...
                </p>
          
                
                <div className='flex flex-wrap items-center gap-3 md:gap-4'>
                  <Link
                    href='/sign-up'
                    className='group inline-flex items-center justify-center rounded-full bg-violet-500 text-white px-6 py-3 md:px-8 md:py-3.5 text-sm md:text-base font-bold shadow-lg hover:bg-violet-400 transition-all duration-300 hover:scale-105 hover:shadow-violet-500/50'
                  >
                    Start Free Today
                    <ArrowRight className='ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform' />
                  </Link>
                </div>
              </div>
              
              <div className='relative rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-right duration-700 delay-200'>
                <div className='absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600' />
                <div className='relative p-4 md:p-6 flex flex-col'>
                  {/* Header */}
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-base md:text-xl font-bold text-white'>Your Dashboard</h3>
                    <span className='text-[10px] md:text-xs text-white bg-slate-700/80 px-3 py-1 rounded-full'>Live</span>
                  </div>
                  
                  {/* Top Action Cards - Green & Purple */}
                  <div className='grid grid-cols-3 gap-2 md:gap-3 mb-3'>
                    <div className='rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 md:p-4 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[9px] md:text-[11px] text-emerald-100 font-medium'>Share Listings</span>
                        <svg className='h-3 w-3 md:h-4 md:w-4 text-emerald-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' /></svg>
                      </div>
                      <div className='text-sm md:text-base font-bold text-white'>Send Link</div>
                      <div className='text-[8px] md:text-[10px] text-emerald-100'>QR code, text, or email</div>
                    </div>
                    <div className='rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-3 md:p-4 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[9px] md:text-[11px] text-violet-100 font-medium'>Invite Contractor</span>
                        <svg className='h-3 w-3 md:h-4 md:w-4 text-violet-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z' /></svg>
                      </div>
                      <div className='text-sm md:text-base font-bold text-white'>Send Link</div>
                      <div className='text-[8px] md:text-[10px] text-violet-100'>QR code, text, or email</div>
                    </div>
                    <div className='rounded-xl bg-slate-800/60 border border-slate-600/50 p-3 md:p-4 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[9px] md:text-[11px] text-slate-300 font-medium'>Total Units</span>
                        <svg className='h-3 w-3 md:h-4 md:w-4 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' /></svg>
                      </div>
                      <div className='text-xl md:text-2xl font-bold text-white'>1</div>
                      <div className='text-[8px] md:text-[10px] text-slate-400'>1 vacant</div>
                    </div>
                  </div>

                  {/* Middle Stats Grid */}
                  <div className='grid grid-cols-3 gap-2 md:gap-3 mb-3'>
                    <div className='rounded-xl bg-slate-800/60 border border-slate-600/50 p-3 md:p-4 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[9px] md:text-[11px] text-slate-300 font-medium'>Rent This Month</span>
                        <svg className='h-3 w-3 md:h-4 md:w-4 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
                      </div>
                      <div className='text-xl md:text-2xl font-bold text-white'>$0.00</div>
                      <div className='text-[8px] md:text-[10px] text-slate-400'>0% collected</div>
                    </div>
                    <div className='rounded-xl bg-slate-800/60 border border-slate-600/50 p-3 md:p-4 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[9px] md:text-[11px] text-slate-300 font-medium'>Maintenance</span>
                        <svg className='h-3 w-3 md:h-4 md:w-4 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                      </div>
                      <div className='text-xl md:text-2xl font-bold text-white'>0</div>
                      <div className='text-[8px] md:text-[10px] text-slate-400'>0 urgent</div>
                    </div>
                    <div className='rounded-xl bg-slate-800/60 border border-slate-600/50 p-3 md:p-4 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[9px] md:text-[11px] text-slate-300 font-medium'>Applications</span>
                        <svg className='h-3 w-3 md:h-4 md:w-4 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
                      </div>
                      <div className='text-xl md:text-2xl font-bold text-white'>1</div>
                      <div className='text-[8px] md:text-[10px] text-slate-400'>Review now</div>
                    </div>
                  </div>

                  {/* Bottom Stats Row */}
                  <div className='grid grid-cols-2 gap-2 md:gap-3 mb-3'>
                    <div className='rounded-xl bg-slate-800/60 border border-slate-600/50 p-3 md:p-4 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[9px] md:text-[11px] text-slate-300 font-medium'>Available Balance</span>
                        <svg className='h-3 w-3 md:h-4 md:w-4 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' /></svg>
                      </div>
                      <div className='text-xl md:text-2xl font-bold text-white'>$0.00</div>
                      <div className='text-[8px] md:text-[10px] text-slate-400'>Ready to cash out</div>
                    </div>
                    <div className='rounded-xl bg-slate-800/60 border border-slate-600/50 p-3 md:p-4 space-y-1'>
                      <div className='flex items-center justify-between'>
                        <span className='text-[9px] md:text-[11px] text-slate-300 font-medium'>Messages</span>
                        <svg className='h-3 w-3 md:h-4 md:w-4 text-slate-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' /></svg>
                      </div>
                      <div className='text-xl md:text-2xl font-bold text-white'>0</div>
                      <div className='text-[8px] md:text-[10px] text-slate-400'>Open inbox threads</div>
                    </div>
                  </div>

                  {/* Footer Stats Bar */}
                  <div className='rounded-xl bg-slate-900/80 border border-slate-700/50 p-3 md:p-4'>
                    <div className='grid grid-cols-4 gap-2 text-center'>
                      <div>
                        <div className='text-[9px] md:text-[10px] text-slate-400 uppercase tracking-wide'>Occupied</div>
                        <div className='text-base md:text-lg font-bold text-white'>0</div>
                      </div>
                      <div>
                        <div className='text-[9px] md:text-[10px] text-slate-400 uppercase tracking-wide'>Tenants</div>
                        <div className='text-base md:text-lg font-bold text-white'>1</div>
                      </div>
                      <div>
                        <div className='text-[9px] md:text-[10px] text-slate-400 uppercase tracking-wide'>Rent (YTD)</div>
                        <div className='text-base md:text-lg font-bold text-white'>$0.00</div>
                      </div>
                      <div>
                        <div className='text-[9px] md:text-[10px] text-slate-400 uppercase tracking-wide'>Properties</div>
                        <div className='text-base md:text-lg font-bold text-white'>1</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PricingSection />

        {/* Two Killer Features Section */}
        <section className='w-full py-10 md:py-16 px-3 md:px-4'>
          <div className='max-w-5xl mx-auto'>
            <div className='grid gap-4 md:gap-6 md:grid-cols-2'>
              
              {/* FREE Lease Builder Card */}
              <div className='group relative rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]'>
                <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900' />
                <div className='absolute inset-0 border border-emerald-500/30 rounded-2xl md:rounded-3xl' />
                <div className='absolute top-4 right-4 md:top-6 md:right-6'>
                  <span className='inline-flex items-center gap-1 bg-emerald-500/20 backdrop-blur-sm text-emerald-400 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/40'>
                    <span className='relative flex h-2 w-2'>
                      <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                      <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-400'></span>
                    </span>
                    100% FREE
                  </span>
                </div>
                <div className='relative p-6 md:p-8 space-y-4 md:space-y-6'>
                  <div className='h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center border border-emerald-500/30'>
                    <svg className='h-7 w-7 md:h-8 md:w-8 text-emerald-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                    </svg>
                  </div>
                  <div className='space-y-2'>
                    <h3 className='text-2xl md:text-3xl font-bold text-white'>Free Lease Builder</h3>
                    <p className='text-slate-300 text-sm md:text-base leading-relaxed'>
                      Create professional, legally-sound leases in minutes. Unlimited leases. E-signatures included. No per-document fees. Ever.
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <span className='inline-flex items-center gap-1.5 bg-slate-800/60 text-slate-200 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/50'>
                      <svg className='h-3.5 w-3.5 text-emerald-400' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' /></svg>
                      Unlimited Leases
                    </span>
                    <span className='inline-flex items-center gap-1.5 bg-slate-800/60 text-slate-200 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/50'>
                      <svg className='h-3.5 w-3.5 text-emerald-400' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' /></svg>
                      E-Signatures
                    </span>
                    <span className='inline-flex items-center gap-1.5 bg-slate-800/60 text-slate-200 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/50'>
                      <svg className='h-3.5 w-3.5 text-emerald-400' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' /></svg>
                      State-Compliant
                    </span>
                  </div>
                  <div className='pt-2'>
                    <p className='text-slate-400 text-xs md:text-sm'>
                      Other platforms charge $15-30 per lease. You pay $0.
                    </p>
                  </div>
                </div>
              </div>

              {/* White-Label Portal Card */}
              <div className='group relative rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]'>
                <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900' />
                <div className='absolute inset-0 border border-violet-500/30 rounded-2xl md:rounded-3xl' />
                <div className='absolute top-4 right-4 md:top-6 md:right-6'>
                  <span className='inline-flex items-center gap-1 bg-violet-500/20 backdrop-blur-sm text-violet-400 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-violet-500/40'>
                    <span className='relative flex h-2 w-2'>
                      <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75'></span>
                      <span className='relative inline-flex rounded-full h-2 w-2 bg-violet-400'></span>
                    </span>
                    YOUR BRAND
                  </span>
                </div>
                <div className='relative p-6 md:p-8 space-y-4 md:space-y-6'>
                  <div className='h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-violet-500/20 backdrop-blur-sm flex items-center justify-center border border-violet-500/30'>
                    <svg className='h-7 w-7 md:h-8 md:w-8 text-violet-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' />
                    </svg>
                  </div>
                  <div className='space-y-2'>
                    <h3 className='text-2xl md:text-3xl font-bold text-white'>Your Own Tenant Portal</h3>
                    <p className='text-slate-300 text-sm md:text-base leading-relaxed'>
                      Get your branded website instantly. Tenants apply, sign leases, and pay rent — all under your company name.
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <span className='inline-flex items-center gap-1.5 bg-slate-800/60 text-slate-200 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/50'>
                      <svg className='h-3.5 w-3.5 text-violet-400' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' /></svg>
                      yourname.propertyflowhq.com
                    </span>
                    <span className='inline-flex items-center gap-1.5 bg-slate-800/60 text-slate-200 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/50'>
                      <svg className='h-3.5 w-3.5 text-violet-400' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' /></svg>
                      Unlimited Applications
                    </span>
                    <span className='inline-flex items-center gap-1.5 bg-slate-800/60 text-slate-200 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/50'>
                      <svg className='h-3.5 w-3.5 text-violet-400' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' /></svg>
                      Your Logo & Colors
                    </span>
                  </div>
                  <div className='pt-2'>
                    <p className='text-slate-400 text-xs md:text-sm'>
                      Look professional. No coding required. Live in 5 minutes.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Pain Points → Solutions */}
        <section className='w-full py-10 md:py-20 px-3 md:px-4'>
          <div className='max-w-6xl mx-auto space-y-8 md:space-y-12'>
            <div className='text-center space-y-2 md:space-y-3 animate-in fade-in duration-700'>
              <h2 className='text-2xl md:text-4xl font-bold text-white'>
                FINALLY A SOULTION THAT YOU CAN TRUST
              </h2>
              <p className='text-sm md:text-lg text-black font-semibold max-w-2xl mx-auto'>
                You didn't become a landlord to spend hours on admin work. Here's how we solve your biggest headaches.
              </p>
            </div>

            <div className='grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {/* Pain Point 1 */}
              <div className='group rounded-xl md:rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-4 md:p-6 space-y-3 md:space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-3 md:gap-4'>
                  <div className='rounded-lg md:rounded-xl bg-red-500/20 p-2 md:p-3 border border-red-500/30'>
                    <Clock className='h-5 w-5 md:h-6 md:w-6 text-red-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-base md:text-lg font-bold text-white mb-1 md:mb-2'>Late Rent Every Month</h3>
                    <p className='text-xs md:text-sm text-black font-semibold mb-2 md:mb-3'>
                      Chasing tenants for payments, sending reminders, tracking who paid what...
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-xs md:text-sm font-semibold'>
                      <ArrowRight className='h-3 w-3 md:h-4 md:w-4' />
                      <span>Solution: Automated online payments with Stripe</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 2 */}
              <div className='group rounded-xl md:rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-4 md:p-6 space-y-3 md:space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-3 md:gap-4'>
                  <div className='rounded-lg md:rounded-xl bg-amber-500/20 p-2 md:p-3 border border-amber-500/30'>
                    <MessageSquare className='h-5 w-5 md:h-6 md:w-6 text-amber-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-base md:text-lg font-bold text-white mb-1 md:mb-2'>Maintenance Request Chaos</h3>
                    <p className='text-xs md:text-sm text-black mb-2 md:mb-3'>
                      Texts, calls, emails scattered everywhere. No way to track what's urgent.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-xs md:text-sm font-semibold'>
                      <ArrowRight className='h-3 w-3 md:h-4 md:w-4' />
                      <span>Solution: Centralized ticket system with priority tracking</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 3 */}
              <div className='group rounded-xl md:rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-4 md:p-6 space-y-3 md:space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-3 md:gap-4'>
                  <div className='rounded-lg md:rounded-xl bg-blue-500/20 p-2 md:p-3 border border-blue-500/30'>
                    <FileText className='h-5 w-5 md:h-6 md:w-6 text-blue-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-base md:text-lg font-bold text-white mb-1 md:mb-2'>Spreadsheet Nightmare</h3>
                    <p className='text-xs md:text-sm text-black mb-2 md:mb-3'>
                      Properties, tenants, leases, payments—all in different files that never sync.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-xs md:text-sm font-semibold'>
                      <ArrowRight className='h-3 w-3 md:h-4 md:w-4' />
                      <span>Solution: Everything in one organized dashboard</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 4 */}
              <div className='group rounded-xl md:rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-4 md:p-6 space-y-3 md:space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-3 md:gap-4'>
                  <div className='rounded-lg md:rounded-xl bg-purple-500/20 p-2 md:p-3 border border-purple-500/30'>
                    <Users className='h-5 w-5 md:h-6 md:w-6 text-purple-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-base md:text-lg font-bold text-white mb-1 md:mb-2'>Application Management Chaos</h3>
                    <p className='text-xs md:text-sm text-black mb-2 md:mb-3'>
                      Paper applications, lost emails, no way to track who applied when or compare applicants side-by-side.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-xs md:text-sm font-semibold'>
                      <ArrowRight className='h-3 w-3 md:h-4 md:w-4' />
                      <span>Solution: Digital applications with organized approval workflow</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 5 */}
              <div className='group rounded-xl md:rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-4 md:p-6 space-y-3 md:space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-3 md:gap-4'>
                  <div className='rounded-lg md:rounded-xl bg-cyan-500/20 p-2 md:p-3 border border-cyan-500/30'>
                    <FileText className='h-5 w-5 md:h-6 md:w-6 text-cyan-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-base md:text-lg font-bold text-white mb-1 md:mb-2'>Lease Management Mess</h3>
                    <p className='text-xs md:text-sm text-black mb-2 md:mb-3'>
                      Printing, signing, scanning, storing leases. Renewals slip through the cracks.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-xs md:text-sm font-semibold'>
                      <ArrowRight className='h-3 w-3 md:h-4 md:w-4' />
                      <span>Solution: Digital leases with e-signatures & auto-renewal reminders</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 6 */}
              <div className='group rounded-xl md:rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-4 md:p-6 space-y-3 md:space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-3 md:gap-4'>
                  <div className='rounded-lg md:rounded-xl bg-pink-500/20 p-2 md:p-3 border border-pink-500/30'>
                    <DollarSign className='h-5 w-5 md:h-6 md:w-6 text-pink-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-base md:text-lg font-bold text-white mb-1 md:mb-2'>Expensive Software</h3>
                    <p className='text-xs md:text-sm text-black mb-2 md:mb-3'>
                      Most property management tools cost $50-200/month. Too much for small portfolios.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-xs md:text-sm font-semibold'>
                      <ArrowRight className='h-3 w-3 md:h-4 md:w-4' />
                      <span>Solution: Free up to 24 units. $2 flat fee per payment.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        {/* <section className='w-full py-10 md:py-20 px-3 md:px-4'>
          <div className='max-w-6xl mx-auto space-y-8 md:space-y-12'>
            <div className='text-center space-y-2 md:space-y-3 animate-in fade-in duration-700'>
              <h2 className='text-2xl md:text-4xl font-bold text-white'>
                Everything You Need. Nothing You Don't.
              </h2>
              <p className='text-sm md:text-lg text-black font-semibold max-w-2xl mx-auto'>
                Whether you have 3 units or 200, get the tools that enterprise property managers use — without the enterprise price tag.
              </p>
            </div>

            <div className='grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'>
              {[
                { icon: DollarSign, title: 'Online Rent Collection', desc: '$2 flat fee per payment — not a percentage of your rent' },
                { icon: Building2, title: 'Your Own Branded Portal', desc: 'Custom subdomain (yourname.propertyflowhq.com) for your tenants' },
                { icon: MessageSquare, title: 'Team Chat Built-In', desc: 'Slack-like communication for your property management team' },
                { icon: FileText, title: 'Digital Leases', desc: 'E-signatures, storage, and automatic renewal reminders' },
                { icon: Wrench, title: 'Maintenance Tickets', desc: 'Priority-based system with tenant communication' },
                { icon: Users, title: 'Tenant Applications', desc: 'Digital forms with organized approval workflow' },
                { icon: TrendingUp, title: 'Revenue Tracking', desc: 'See income, late payments, and trends at a glance' },
                { icon: Calendar, title: 'Lease Renewals', desc: 'Automated reminders before lease expiration' },
                { icon: Shield, title: 'Secure & Compliant', desc: 'Bank-level encryption for all sensitive data' },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className='rounded-lg md:rounded-xl border border-white/10 bg-gradient-to-r from-blue-600 via-sky-500 to-sky-600 p-3 md:p-5 space-y-2 md:space-y-3 hover:border-violet-400/60 hover:bg-slate-950/60 transition-all duration-300 group animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className='flex items-center gap-2 md:gap-3'>
                      <div className='rounded-md md:rounded-lg bg-violet-500/20 p-1.5 md:p-2 border border-violet-400/40 group-hover:bg-violet-500/30 transition-colors ring-1 ring-violet-400/40'>
                        <Icon className='h-4 w-4 md:h-5 md:w-5 text-violet-300' />
                      </div>
                      <h3 className='font-semibold text-white text-xs md:text-sm'>{feature.title}</h3>
                    </div>
                    <p className='text-[10px] md:text-xs text-black font-bold'>{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section> */}

        {/* Final CTA */}
        {/* <section className='w-full py-16 md:py-20 px-4 bg-gradient-to-br from-violet-500/10 via-cyan-500/10 to-purple-500/10'>
          <div className='max-w-4xl mx-auto text-center space-y-8 animate-in fade-in duration-700'>
            <h2 className='text-3xl md:text-5xl font-bold text-white leading-tight'>
              Ready to Stop Chasing Rent?
            </h2>
            <p className='text-xl text-slate-200 max-w-2xl mx-auto'>
              Free for up to 24 units. Get your own branded tenant portal, team chat, and automated rent collection in minutes.
            </p>
            <div className='flex flex-wrap items-center justify-center gap-4'>
              <Link
                href='/sign-up'
                className='group inline-flex items-center justify-center rounded-full bg-violet-500 text-white px-10 py-4 text-lg font-bold shadow-lg hover:bg-violet-400 transition-all duration-300 hover:scale-105 hover:shadow-violet-500/50'
              >
                Get Started Free
                <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform' />
              </Link>
              <Link
                href='/contact'
                className='inline-flex items-center justify-center rounded-full border-2 border-white/30 text-white px-8 py-4 text-base font-semibold hover:bg-white/10 transition-all duration-300'
              >
                Have Questions?
              </Link>
            </div>
            <p className='text-sm text-slate-400'>
              No credit card required • Free up to 24 units • $2 flat fee per payment
            </p>
          </div>
        </section> */}
      </main>

      <NewsletterSignup />
      {/* <CustomerReviews /> */}
      <HomeContactCard />
      <ExitIntentPopup />
      <TrustBadges />
    </>
  );
};

export default Homepage;