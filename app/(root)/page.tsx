import { APP_NAME } from '@/lib/constants';
import CustomerReviews from '@/components/home/customer-reviews';
import HomeContactCard from '@/components/home/home-contact-card';
import PricingSection from '@/components/home/pricing-section';
import { headers } from 'next/headers';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, Clock, DollarSign, FileText, MessageSquare, Wrench, Building2, Users, CreditCard, Calendar, Shield, Zap, TrendingUp, ArrowRight, Sparkles,} from 'lucide-react';

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

  const landlord = await prisma.landlord.findUnique({ where: { subdomain } });
  return landlord;
}

const Homepage = async () => {
  const landlord = await getLandlordForRequest();

  if (landlord) {
    const properties = await prisma.property.findMany({
      where: {
        landlordId: landlord.id,
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
        <section className='w-full pt-12 pb-16 md:pt-20 md:pb-24 px-4 relative overflow-hidden'>
          <div className='absolute inset-0  animate-pulse' />
          <div className='max-w-7xl mx-auto relative z-10'>
            <div className='grid gap-8 lg:grid-cols-2 items-center'>
              <div className='space-y-6 animate-in fade-in slide-in-from-left duration-700'>
                
                <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight '>
                 Property Management — Fully Automated.
                </h1>
                <p className='text-base md:text-lg text-white font-bold max-w-xl leading-relaxed'>
                  Take control of your time, and stop wasting it on chasing rents, countless hours on reports and doing everything by hand.
                </p>
                
                <div className='flex flex-wrap items-center gap-4'>
                  <Link
                    href='/sign-up'
                    className='group inline-flex items-center justify-center rounded-full bg-violet-500 text-white px-8 py-3.5 text-base font-bold shadow-lg hover:bg-violet-400 transition-all duration-300 hover:scale-105 hover:shadow-violet-500/50'
                  >
                    Start Free Today
                    <ArrowRight className='ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform' />
                  </Link>
                </div>
                
                {/* <div className='flex flex-wrap items-center gap-6 pt-4 text-sm'>
                  <div className='flex items-center gap-2 text-black'>
                    <CheckCircle2 className='h-5 w-5 text-purple' />
                    <span>Free up to 24 units</span>
                  </div>
                  <div className='flex items-center gap-2 text-black'>
                    <CheckCircle2 className='h-5 w-5 text-emerald-500' />
                    <span>Your own branded portal</span>
                  </div>
                  <div className='flex items-center gap-2 text-black'>
                    <CheckCircle2 className='h-5 w-5 text-emerald-500' />
                    <span>E-Signatures & Custom Lease's</span>
                  </div>
                  <div className='flex items-center gap-2 text-black'>
                    <CheckCircle2 className='h-5 w-5 text-emerald-500' />
                    <span>Free Applications</span>
                  </div>
                  <div className='flex items-center gap-2 text-black'>
                    <CheckCircle2 className='h-5 w-5 text-emerald-500' />
                    <span>Online Rent Collections</span>
                  </div>
                  <div className='flex items-center gap-2 text-black'>
                    <CheckCircle2 className='h-5 w-5 text-emerald-500' />
                    <span>Maintenance Ticketing System</span>
                  </div>
         
                </div> */}
              </div>
              
              <div className='relative h-[600px] lg:h-[600px] rounded-3xl  border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-right duration-700 delay-200'>
                <div className='absolute inset-0 bg-blue-700' />
                <div className='relative h-full p-6 flex flex-col justify-between'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-bold text-white'>Your Dashboard</h3>
                      <span className='text-xs text-violet-200/80 bg-white/5 px-2 py-1 rounded-full ring-1 ring-white/10'>Live Demo</span>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
                        <div className='text-xs text-black'>Total Units</div>
                        <div className='text-2xl font-bold text-white'>24</div>
                        <div className='text-[10px] text-red-400'>3 vacant</div>
                      </div>
                      <div className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
                        <div className='text-xs text-black'>This Month</div>
                        <div className='text-2xl font-bold text-white'>$28,500</div>
                        <div className='text-[10px] text-yellow-800'>98% collected</div>
                      </div>
                      <div className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
                        <div className='text-xs text-black'>Maintenance</div>
                        <div className='text-2xl font-bold text-white'>2</div>
                        <div className='text-[10px] text-red'>1 urgent</div>
                      </div>
                      <div className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
                        <div className='text-xs text-black'>Applications</div>
                        <div className='text-2xl font-bold text-white'>5</div>
                        <div className='text-[10px] text-green-400'>3 pending</div>
                      </div>
                      <div className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
                        <div className='text-xs text-black'>Applications</div>
                        <div className='text-2xl font-bold text-white'>5</div>
                        <div className='text-[10px] text-green-400'>3 pending</div>
                      </div>
                      <div className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
                        <div className='text-xs text-black'>Applications</div>
                        <div className='text-2xl font-bold text-white'>5</div>
                        <div className='text-[10px] text-green-400'>3 pending</div>
                      </div>
                    </div>
                  </div>
                  {/* <div className='space-y-3 bg-slate-900/60 rounded-xl p-4 border border-white/10'>
    
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* Pain Points → Solutions */}
        <section className='w-full py-16 md:py-20 px-4 '>
          <div className='max-w-6xl mx-auto space-y-12'>
            <div className='text-center space-y-3 animate-in fade-in duration-700'>
              <h2 className='text-3xl md:text-4xl font-bold text-white'>
                We Get It. Property Management is Exhausting.
              </h2>
              <p className='text-lg text-slate-300 max-w-2xl mx-auto'>
                You didn't become a landlord to spend hours on admin work. Here's how we solve your biggest headaches.
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {/* Pain Point 1 */}
              <div className='group rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-6 space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-red-500/20 p-3 border border-red-500/30'>
                    <Clock className='h-6 w-6 text-red-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Late Rent Every Month</h3>
                    <p className='text-sm text-black font-semibold mb-3'>
                      Chasing tenants for payments, sending reminders, tracking who paid what...
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300  text-sm font-semibold'>
                      <ArrowRight className='h-4 w-4' />
                      <span>Solution: Automated online payments with Stripe</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 2 */}
              <div className='group rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-6 space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-amber-500/20 p-3 border border-amber-500/30'>
                    <MessageSquare className='h-6 w-6 text-amber-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Maintenance Request Chaos</h3>
                    <p className='text-sm text-black mb-3'>
                      Texts, calls, emails scattered everywhere. No way to track what's urgent.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-sm font-semibold'>
                      <ArrowRight className='h-4 w-4' />
                      <span>Solution: Centralized ticket system with priority tracking</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 3 */}
              <div className='group rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-6 space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-blue-500/20 p-3 border border-blue-500/30'>
                    <FileText className='h-6 w-6 text-blue-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Spreadsheet Nightmare</h3>
                    <p className='text-sm text-black mb-3'>
                      Properties, tenants, leases, payments—all in different files that never sync.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-sm font-semibold'>
                      <ArrowRight className='h-4 w-4' />
                      <span>Solution: Everything in one organized dashboard</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 4 */}
              <div className='group rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-6 space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-purple-500/20 p-3 border border-purple-500/30'>
                    <Users className='h-6 w-6 text-purple-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Application Management Chaos</h3>
                    <p className='text-sm text-black mb-3'>
                      Paper applications, lost emails, no way to track who applied when or compare applicants side-by-side.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-sm font-semibold'>
                      <ArrowRight className='h-4 w-4' />
                      <span>Solution: Digital applications with organized approval workflow</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 5 */}
              <div className='group rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-6 space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-cyan-500/20 p-3 border border-cyan-500/30'>
                    <FileText className='h-6 w-6 text-cyan-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Lease Management Mess</h3>
                    <p className='text-sm text-black 0 mb-3'>
                      Printing, signing, scanning, storing leases. Renewals slip through the cracks.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-sm font-semibold'>
                      <ArrowRight className='h-4 w-4' />
                      <span>Solution: Digital leases with e-signatures & auto-renewal reminders</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 6 */}
              <div className='group rounded-2xl border border-red-500/20 bg-gradient-to-r from-indigo-700 to-sky-600 p-6 space-y-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-pink-500/20 p-3 border border-pink-500/30'>
                    <DollarSign className='h-6 w-6 text-pink-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Expensive Software</h3>
                    <p className='text-sm text-black mb-3'>
                      Most property management tools cost $50-200/month. Too much for small portfolios.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-sm font-semibold'>
                      <ArrowRight className='h-4 w-4' />
                      <span>Solution: Free up to 24 units. $2 flat fee per payment.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          id='how-it-works'
          className='w-full py-16 md:py-20 px-4 scroll-mt-20'
        >
          <div className='max-w-6xl mx-auto space-y-12'>
            <div className='text-center space-y-3 animate-in fade-in duration-700'>
              <h2 className='text-3xl md:text-4xl font-bold text-white'>
                Get Started in Minutes, Not Days
              </h2>
              <p className='text-lg text-slate-300 max-w-2xl mx-auto'>
                No complicated setup. No training required. Just sign up and start managing.
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
              {[
                {
                  step: '1',
                  icon: Building2,
                  title: 'Add Your Properties',
                  description: 'Create properties and units in minutes. Add photos, rent amounts, and amenities.',
                  iconBg: 'bg-violet-500/20',
                  iconBorder: 'border-violet-400/40',
                  iconColor: 'text-violet-300',
                },
                {
                  step: '2',
                  icon: Users,
                  title: 'Invite Tenants',
                  description: 'Send digital invitations. Tenants create accounts and access their portal instantly.',
                  iconBg: 'bg-blue-500/20',
                  iconBorder: 'border-blue-500/30',
                  iconColor: 'text-blue-400',
                },
                {
                  step: '3',
                  icon: FileText,
                  title: 'Send Digital Leases',
                  description: 'Create lease agreements and send for e-signature. All documents stored securely.',
                  iconBg: 'bg-purple-500/20',
                  iconBorder: 'border-purple-500/30',
                  iconColor: 'text-purple-400',
                },
                {
                  step: '4',
                  icon: CreditCard,
                  title: 'Collect Rent Online',
                  description: 'Tenants pay through Stripe. Money goes directly to your bank account. Automated reminders included.',
                  iconBg: 'bg-violet-500/20',
                  iconBorder: 'border-violet-400/40',
                  iconColor: 'text-violet-300',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className='group rounded-2xl border border-white/10 bg-slate-950/60 p-6 space-y-4 hover:border-violet-400/60 hover:bg-slate-950/80 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom'
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className='flex items-center gap-3'>
                      <div className={`rounded-xl ${item.iconBg} p-3 border ${item.iconBorder}`}>
                        <Icon className={`h-6 w-6 ${item.iconColor}`} />
                      </div>
                      <span className='text-2xl font-bold text-white/20'>{item.step}</span>
                    </div>
                    <h3 className='text-lg font-bold text-white'>{item.title}</h3>
                    <p className='text-sm text-slate-300 leading-relaxed'>{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className='w-full py-16 md:py-20 px-4'>
          <div className='max-w-6xl mx-auto space-y-12'>
            <div className='text-center space-y-3 animate-in fade-in duration-700'>
              <h2 className='text-3xl md:text-4xl font-bold text-white'>
                Everything You Need. Nothing You Don't.
              </h2>
              <p className='text-lg text-slate-300 max-w-2xl mx-auto'>
                Whether you have 3 units or 200, get the tools that enterprise property managers use — without the enterprise price tag.
              </p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {[
                { icon: DollarSign, title: 'Online Rent Collection', desc: '$2 flat fee per payment — not a percentage of your rent' },
                { icon: Building2, title: 'Your Own Branded Portal', desc: 'Custom subdomain (yourname.rentflowhq.com) for your tenants' },
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
                    className='rounded-xl border border-white/10 bg-gradient-to-r from-blue-600 via-sky-500 to-sky-600 p-5 space-y-3 hover:border-violet-400/60 hover:bg-slate-950/60 transition-all duration-300 group animate-in fade-in slide-in-from-bottom shadow-2xl drop-shadow-2xl'
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='rounded-lg bg-violet-500/20 p-2 border border-violet-400/40 group-hover:bg-violet-500/30 transition-colors ring-1 ring-violet-400/40'>
                        <Icon className='h-5 w-5 text-violet-300' />
                      </div>
                      <h3 className='font-semibold text-white text-sm'>{feature.title}</h3>
                    </div>
                    <p className='text-xs text-black font-bold'>{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className='w-full py-16 md:py-20 px-4 bg-gradient-to-br from-violet-500/10 via-cyan-500/10 to-purple-500/10'>
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
        </section>
      </main>

      <CustomerReviews />
      <HomeContactCard />
    </>
  );
};

export default Homepage;