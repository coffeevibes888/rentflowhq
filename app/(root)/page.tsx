import HomeContactCard from '@/components/home/home-contact-card';
import TrustBadges from '@/components/home/trust-badges';
import PricingSection from '@/components/home/pricing-section';
import AudienceSwitcher from '@/components/home/audience-switcher';
import { headers } from 'next/headers';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { unstable_cache } from 'next/cache';
import { Suspense } from 'react';

const getCachedLandlord = unstable_cache(
  async (subdomain: string) => {
    return prisma.landlord.findUnique({ where: { subdomain } });
  },
  ['landlord-by-subdomain'],
  { revalidate: 300 }
);

const getCachedProperties = unstable_cache(
  async (landlordId: string) => {
    return prisma.property.findMany({
      where: {
        landlordId,
        units: { some: { isAvailable: true } },
      },
      include: {
        units: { where: { isAvailable: true }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  ['landlord-properties'],
  { revalidate: 120 }
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

  if (!subdomain) return null;
  return getCachedLandlord(subdomain);
}

const Homepage = async () => {
  const landlord = await getLandlordForRequest();

  if (landlord) {
    const properties = await getCachedProperties(landlord.id);
    return (
      <main className='flex-1 w-full bg-white'>
        <section className='w-full pt-7 pb-7 px-2'>
          <div className='max-w-6xl mx-auto space-y-4 rounded-3xl border border-slate-200 bg-white p-6 md:p-8 text-slate-900 shadow-xl'>
            <div className='space-y-1'>
              <p className='text-xs font-medium text-violet-600 uppercase tracking-wide'>Listings</p>
              <h1 className='text-2xl md:text-3xl font-semibold tracking-tight text-slate-900'>
                Homes and apartments by {landlord.name}
              </h1>
              <p className='text-sm text-slate-600 max-w-2xl'>
                Browse available units and start your application online. All rent payments and
                maintenance requests are handled securely through our resident portal.
              </p>
            </div>
          </div>
        </section>

        <section className='w-full py-10 px-4'>
          <div className='max-w-6xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 md:p-8 text-slate-900 shadow-xl'>
            {properties.length === 0 ? (
              <div className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600'>
                No properties are currently available for this landlord. Please check back soon.
              </div>
            ) : (
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {properties.map((property) => {
                  const unitCount = property.units.length;
                  return (
                    <div
                      key={property.id}
                      className='rounded-2xl border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col'
                    >
                      <div className='relative h-44 w-full bg-slate-100'>
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
                            <h2 className='text-sm font-semibold text-slate-900'>{property.name}</h2>
                            <p className='text-[11px] text-slate-600'>
                              {unitCount === 1 ? '1 available unit' : `${unitCount} available units`}
                            </p>
                          </div>
                        </div>
                        {property.units[0] && (
                          <p className='text-sm font-medium text-violet-600 mt-1'>
                            {formatCurrency(Number(property.units[0].rentAmount))} / month
                          </p>
                        )}
                        <div className='mt-3 flex items-center justify-between text-[11px] text-slate-500'>
                          <span>{property.type}</span>
                          <span>Professionally Managed</span>
                        </div>
                        <div className='mt-4 flex gap-2'>
                          <Link
                            href={`/${property.slug}/apply`}
                            className='inline-flex items-center justify-center rounded-full bg-violet-600 px-4 py-1.5 text-[11px] font-medium text-white hover:bg-violet-700 flex-1 transition-colors'
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
        <Suspense fallback={null}>
          <AudienceSwitcher
            pmPricingSection={<PricingSection />}
            pmLifecycleSection={<PMLifecycleSection />}
            pmLeasePortalSection={<PMLeasePortalSection />}
          />
        </Suspense>
      </main>
      <HomeContactCard />
      <TrustBadges />
    </>
  );
};

export default Homepage;

// ─── PM Tenant Lifecycle Flow ────────────────────────────────────────────────
function PMLifecycleSection() {
  return (
    <section className='w-full py-4 md:py-16 px-4'>
      <div className='max-w-6xl mx-auto'>
        <div className='grid gap-4 md:gap-6 md:grid-cols-2'>
          <div className='md:col-span-2 group relative rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.01] bg-gradient-to-r from-sky-500 via-cyan-200 to-sky-500 border border-black shadow-2xl'>
            <div className='absolute top-4 right-4 md:top-6 md:right-6'>
              <span className='inline-flex items-center gap-1 bg-cyan-50 text-cyan-600 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-cyan-100'>
                <span className='relative flex h-2 w-2'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-cyan-500'></span>
                </span>
                AUTOMATED
              </span>
            </div>
            <div className='relative p-6 md:p-8 space-y-4 md:space-y-6'>
              <div className='space-y-2'>
                <h3 className='text-2xl md:text-3xl font-bold text-slate-900'>Complete Tenant Lifecycle</h3>
                <p className='text-slate-600 text-sm md:text-base'>From first click to move-out — fully automated</p>
              </div>

              {/* Mobile layout */}
              <div className='lg:hidden space-y-2'>
                {[
                  [{ label: 'Add Property', sub: 'Listed On White Label Domain', border: 'border-blue-400', color: 'text-cyan-400' }, { label: 'Free Lease Builder', sub: 'Or Upload Your Own', border: 'border-cyan-300', color: 'text-cyan-400' }],
                  [{ label: 'One Click Approval', sub: 'Or Schedule Viewing', border: 'border-violet-300', color: 'text-violet-400' }, { label: "Tenant Apply's", sub: 'E-mail Notified', border: 'border-emerald-300', color: 'text-emerald-400' }],
                  [{ label: 'Tenant Pays Rent', sub: 'Directly to your bank', border: 'border-violet-300', color: 'text-violet-400' }, { label: 'Tenant Moves In', sub: 'Keys Ready', border: 'border-emerald-300', color: 'text-emerald-400' }],
                  [{ label: 'Contractor Marketplace', sub: 'Find and Hire Contractors', border: 'border-violet-300', color: 'text-violet-400' }, { label: 'Maintenance Tickets', sub: 'Urgency System', border: 'border-emerald-300', color: 'text-emerald-400' }],
                  [{ label: 'Late Rent?', sub: "Auto Late Fee's", border: 'border-amber-300', color: 'text-amber-400' }, { label: 'Internal Communications', sub: 'Notices Sent', border: 'border-amber-300', color: 'text-amber-400' }],
                  [{ label: 'Move-Out', sub: 'Inspection Check list', border: 'border-slate-300', color: 'text-slate-300' }, { label: 'Eviction', sub: 'Legal Docs', border: 'border-red-300', color: 'text-red-400' }],
                ].map((row, i) => (
                  <div key={i} className='flex items-center gap-1 sm:gap-2'>
                    <div className={`flex-1 bg-slate-800/90 rounded-lg px-2 py-2 border-2 ${row[0].border} text-center`}>
                      <div className={`${row[0].color} text-[10px] sm:text-xs font-bold`}>{row[0].label}</div>
                      <div className='text-white text-[8px] sm:text-[10px] mt-0.5 font-semibold'>{row[0].sub}</div>
                    </div>
                    <svg className='h-4 w-4 text-slate-800 shrink-0' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' /></svg>
                    <div className={`flex-1 bg-slate-800/90 rounded-lg px-2 py-2 border-2 ${row[1].border} text-center`}>
                      <div className={`${row[1].color} text-[10px] sm:text-xs font-bold`}>{row[1].label}</div>
                      <div className='text-white text-[8px] sm:text-[10px] mt-0.5 font-semibold'>{row[1].sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop layout */}
              <div className='hidden lg:block space-y-4'>
                <div className='flex items-center justify-between gap-3'>
                  {[
                    { label: 'Add Property', sub: 'Listed On White Label Domain', border: 'border-blue-400', color: 'text-cyan-400' },
                    { label: 'Free Lease Builder', sub: 'Or Upload Your Own', border: 'border-cyan-300', color: 'text-cyan-400' },
                    { label: "Tenant Apply's", sub: 'E-mail Notified', border: 'border-emerald-300', color: 'text-emerald-400' },
                    { label: 'One Click Approval', sub: 'Or Schedule Viewing', border: 'border-violet-300', color: 'text-violet-400' },
                    { label: 'Tenant Pays Rent', sub: 'Directly to your bank', border: 'border-violet-300', color: 'text-violet-400' },
                  ].map((node, i, arr) => (
                    <div key={node.label} className='flex items-center gap-3 flex-1'>
                      <div className={`bg-slate-800/90 rounded-lg px-4 py-3 border-2 ${node.border} text-center min-w-[100px] flex-1`}>
                        <div className={`${node.color} text-xs font-bold`}>{node.label}</div>
                        <div className='text-white text-[10px] mt-0.5 font-semibold'>{node.sub}</div>
                      </div>
                      {i < arr.length - 1 && (
                        <svg className='h-3 w-5 text-slate-800 shrink-0' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' /></svg>
                      )}
                    </div>
                  ))}
                </div>
                <div className='flex justify-end pr-[50px]'>
                  <div className='flex flex-col items-center'>
                    <div className='w-0.5 h-4 border-l-2 border-dashed border-slate-800'></div>
                    <svg className='h-3 w-5 text-slate-800 rotate-90' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' /></svg>
                  </div>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  {[
                    { label: 'Internal Communications', sub: 'Notices Sent', border: 'border-amber-300', color: 'text-amber-400' },
                    { label: 'Late Rent?', sub: "Auto Late Fee's", border: 'border-amber-300', color: 'text-amber-400' },
                    { label: 'Contractor Marketplace', sub: 'Find and Hire Contractors', border: 'border-violet-300', color: 'text-violet-400' },
                    { label: 'Maintenance Tickets', sub: 'Urgency System', border: 'border-emerald-300', color: 'text-emerald-400' },
                    { label: 'Tenant Moves In', sub: 'Keys Ready', border: 'border-emerald-300', color: 'text-emerald-400' },
                  ].map((node, i, arr) => (
                    <div key={node.label} className='flex items-center gap-3 flex-1'>
                      {i > 0 && (
                        <svg className='h-4 w-4 text-slate-800 shrink-0 rotate-180' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' /></svg>
                      )}
                      <div className={`bg-slate-800/90 rounded-lg px-4 py-3 border-2 ${node.border} text-center min-w-[100px] flex-1`}>
                        <div className={`${node.color} text-xs font-bold`}>{node.label}</div>
                        <div className='text-white text-[10px] mt-0.5 font-semibold'>{node.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className='flex justify-start pl-[50px]'>
                  <div className='flex flex-col items-center'>
                    <div className='w-0.5 h-4 border-l-2 border-dashed border-slate-800'></div>
                    <svg className='h-4 w-4 text-slate-800 rotate-90' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' /></svg>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='bg-slate-800/90 rounded-lg px-4 py-3 border-2 border-red-300 text-center min-w-[100px]'>
                    <div className='text-red-400 text-xs font-bold'>Eviction</div>
                    <div className='text-white text-[10px] mt-0.5 font-semibold'>Legal Docs</div>
                  </div>
                  <svg className='h-4 w-4 text-slate-800' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z' clipRule='evenodd' /></svg>
                  <div className='bg-slate-800/90 rounded-lg px-4 py-3 border-2 border-slate-300 text-center min-w-[100px]'>
                    <div className='text-slate-300 text-xs font-bold'>Move-Out</div>
                    <div className='text-white text-[10px] mt-0.5 font-semibold'>Inspection Check list</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PM Lease Builder + White-Label Portal Cards ──────────────────────────────
function PMLeasePortalSection() {
  return (
    <section className='w-full py-6 md:py-12 px-3 md:px-4'>
      <div className='max-w-6xl mx-auto'>
        <div className='grid gap-4 md:gap-6 md:grid-cols-2'>

          {/* Free Lease Builder */}
          <div className='group relative rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] py-4'>
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
            <div className='relative p-8 md:p-10 space-y-5 md:space-y-7'>
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
                {['Unlimited Leases', 'E-Signatures', 'State-Compliant'].map((t) => (
                  <span key={t} className='inline-flex items-center gap-1.5 bg-slate-800/60 text-slate-200 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/50'>
                    <svg className='h-3.5 w-3.5 text-emerald-400' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' /></svg>
                    {t}
                  </span>
                ))}
              </div>
              <p className='text-slate-400 text-xs md:text-sm'>Other platforms charge $15-30 per lease. You pay $0.</p>
            </div>
          </div>

          {/* White-Label Portal */}
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
            <div className='relative p-8 md:p-10 space-y-5 md:space-y-7'>
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
                {['yourname.propertyflowhq.com', 'Unlimited Applications', 'Your Logo & Colors'].map((t) => (
                  <span key={t} className='inline-flex items-center gap-1.5 bg-slate-800/60 text-slate-200 text-[11px] md:text-xs font-medium px-3 py-1.5 rounded-full border border-slate-700/50'>
                    <svg className='h-3.5 w-3.5 text-violet-400' fill='currentColor' viewBox='0 0 20 20'><path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' /></svg>
                    {t}
                  </span>
                ))}
              </div>
              <p className='text-slate-400 text-xs md:text-sm'>Look professional. No coding required. Live in 5 minutes.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
