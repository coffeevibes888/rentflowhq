import { APP_NAME } from '@/lib/constants';
import CustomerReviews from '@/components/home/customer-reviews';
import HomeContactCard from '@/components/home/home-contact-card';
import { headers } from 'next/headers';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Wrench,
  Building2,
  Users,
  CreditCard,
  Calendar,
  Shield,
  Zap,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

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
          <div className='absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 animate-pulse' />
          <div className='max-w-7xl mx-auto relative z-10'>
            <div className='grid gap-8 lg:grid-cols-2 items-center'>
              <div className='space-y-6 animate-in fade-in slide-in-from-left duration-700'>
                <div className='inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-violet-200/80 text-xs font-medium border border-white/10 backdrop-blur-sm ring-1 ring-white/10'>
                  <Sparkles className='h-3 w-3' />
                  <span>100% Free Forever • No Credit Card Required</span>
                </div>
                
                <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white'>
                  Stop Chasing Rent. Start Growing Your Portfolio.
                </h1>
                
                <p className='text-base md:text-lg text-slate-200 max-w-xl leading-relaxed'>
                  Tired of late payments, maintenance chaos, and spreadsheet nightmares? Join thousands of small landlords who manage everything—rent collection, leases, maintenance, and tenant communication—all in one place. <span className='text-violet-200/80 font-semibold'>Completely free.</span>
                </p>
                
                <div className='flex flex-wrap items-center gap-4'>
                  <Link
                    href='/sign-up'
                    className='group inline-flex items-center justify-center rounded-full bg-violet-500 text-white px-8 py-3.5 text-base font-bold shadow-lg hover:bg-violet-400 transition-all duration-300 hover:scale-105 hover:shadow-violet-500/50'
                  >
                    Start Free Today
                    <ArrowRight className='ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform' />
                  </Link>
                  <Link
                    href='#how-it-works'
                    className='inline-flex items-center justify-center rounded-full border-2 border-white/30 text-white px-6 py-3.5 text-sm font-semibold hover:bg-white/10 hover:border-white/50 transition-all duration-300'
                  >
                    See How It Works
                  </Link>
                </div>
                
                <div className='flex flex-wrap items-center gap-6 pt-4 text-sm text-slate-300'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300' />
                    <span>No setup fees</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300' />
                    <span>Up to 24 units free</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300' />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
              
              <div className='relative h-[500px] lg:h-[600px] rounded-3xl bg-slate-950/60 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-right duration-700 delay-200'>
                <div className='absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5' />
                <div className='relative h-full p-6 flex flex-col justify-between'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-bold text-white'>Your Dashboard</h3>
                      <span className='text-xs text-violet-200/80 bg-white/5 px-2 py-1 rounded-full ring-1 ring-white/10'>Live Demo</span>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='rounded-xl bg-slate-900/80 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors'>
                        <div className='text-xs text-slate-400'>Total Units</div>
                        <div className='text-2xl font-bold text-white'>24</div>
                        <div className='text-[10px] text-violet-200/80'>3 vacant</div>
                      </div>
                      <div className='rounded-xl bg-slate-900/80 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors'>
                        <div className='text-xs text-slate-400'>This Month</div>
                        <div className='text-2xl font-bold text-white'>$28,500</div>
                        <div className='text-[10px] text-violet-200/80'>98% collected</div>
                      </div>
                      <div className='rounded-xl bg-slate-900/80 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors'>
                        <div className='text-xs text-slate-400'>Maintenance</div>
                        <div className='text-2xl font-bold text-white'>2</div>
                        <div className='text-[10px] text-amber-300'>1 urgent</div>
                      </div>
                      <div className='rounded-xl bg-slate-900/80 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors'>
                        <div className='text-xs text-slate-400'>Applications</div>
                        <div className='text-2xl font-bold text-white'>5</div>
                        <div className='text-[10px] text-blue-300'>3 pending</div>
                      </div>
                    </div>
                  </div>
                  <div className='space-y-3 bg-slate-900/60 rounded-xl p-4 border border-white/10'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='font-semibold text-white'>Quick Actions</span>
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <button className='text-xs bg-violet-500/20 text-violet-200/80 px-3 py-2 rounded-lg border border-violet-400/40 hover:bg-violet-500/30 transition-colors ring-1 ring-violet-400/40'>
                        Collect Rent
                      </button>
                      <button className='text-xs bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors'>
                        New Lease
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points → Solutions */}
        <section className='w-full py-16 md:py-20 px-4 bg-gradient-to-b from-transparent to-slate-900/30'>
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
              <div className='group rounded-2xl border border-red-500/20 bg-slate-950/60 p-6 space-y-4 hover:border-red-500/40 hover:bg-slate-950/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-red-500/20 p-3 border border-red-500/30'>
                    <Clock className='h-6 w-6 text-red-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Late Rent Every Month</h3>
                    <p className='text-sm text-slate-400 mb-3'>
                      Chasing tenants for payments, sending reminders, tracking who paid what...
                    </p>
                    <div className='flex items-center gap-2 text-violet-200/80 text-sm font-semibold'>
                      <ArrowRight className='h-4 w-4' />
                      <span>Solution: Automated online payments with Stripe</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pain Point 2 */}
              <div className='group rounded-2xl border border-amber-500/20 bg-slate-950/60 p-6 space-y-4 hover:border-amber-500/40 hover:bg-slate-950/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom delay-100'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-amber-500/20 p-3 border border-amber-500/30'>
                    <MessageSquare className='h-6 w-6 text-amber-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Maintenance Request Chaos</h3>
                    <p className='text-sm text-slate-400 mb-3'>
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
              <div className='group rounded-2xl border border-blue-500/20 bg-slate-950/60 p-6 space-y-4 hover:border-blue-500/40 hover:bg-slate-950/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom delay-200'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-blue-500/20 p-3 border border-blue-500/30'>
                    <FileText className='h-6 w-6 text-blue-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Spreadsheet Nightmare</h3>
                    <p className='text-sm text-slate-400 mb-3'>
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
              <div className='group rounded-2xl border border-purple-500/20 bg-slate-950/60 p-6 space-y-4 hover:border-purple-500/40 hover:bg-slate-950/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom delay-300'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-purple-500/20 p-3 border border-purple-500/30'>
                    <Users className='h-6 w-6 text-purple-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Application Management Chaos</h3>
                    <p className='text-sm text-slate-400 mb-3'>
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
              <div className='group rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-6 space-y-4 hover:border-cyan-500/40 hover:bg-slate-950/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom delay-400'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-cyan-500/20 p-3 border border-cyan-500/30'>
                    <FileText className='h-6 w-6 text-cyan-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Lease Management Mess</h3>
                    <p className='text-sm text-slate-400 mb-3'>
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
              <div className='group rounded-2xl border border-pink-500/20 bg-slate-950/60 p-6 space-y-4 hover:border-pink-500/40 hover:bg-slate-950/80 transition-all duration-300 animate-in fade-in slide-in-from-bottom delay-500'>
                <div className='flex items-start gap-4'>
                  <div className='rounded-xl bg-pink-500/20 p-3 border border-pink-500/30'>
                    <DollarSign className='h-6 w-6 text-pink-400' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-white mb-2'>Expensive Software</h3>
                    <p className='text-sm text-slate-400 mb-3'>
                      Most property management tools cost $50-200/month. Too much for small portfolios.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-300 text-sm font-semibold'>
                      <ArrowRight className='h-4 w-4' />
                      <span>Solution: 100% free forever. No hidden fees.</span>
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
        <section className='w-full py-16 md:py-20 px-4 bg-gradient-to-b from-slate-900/30 to-transparent'>
          <div className='max-w-6xl mx-auto space-y-12'>
            <div className='text-center space-y-3 animate-in fade-in duration-700'>
              <h2 className='text-3xl md:text-4xl font-bold text-white'>
                Everything You Need, Nothing You Don't
              </h2>
              <p className='text-lg text-slate-300 max-w-2xl mx-auto'>
                Powerful features designed specifically for small landlords and property managers.
              </p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {[
                { icon: DollarSign, title: 'Online Rent Collection', desc: 'Stripe-powered payments with automatic reminders ($2 per transaction)' },
                { icon: FileText, title: 'Digital Leases', desc: 'E-signatures, storage, and renewal tracking' },
                { icon: Wrench, title: 'Maintenance Tickets', desc: 'Priority-based system with tenant communication' },
                { icon: Users, title: 'Tenant Applications', desc: 'Digital forms with organized approval workflow' },
                { icon: TrendingUp, title: 'Revenue Tracking', desc: 'See income, late payments, and trends at a glance' },
                { icon: MessageSquare, title: 'Tenant Communication', desc: 'Built-in messaging for quick responses' },
                { icon: Calendar, title: 'Lease Renewals', desc: 'Automated reminders before lease expiration' },
                { icon: Shield, title: 'Secure & Compliant', desc: 'Bank-level encryption for all sensitive data' },
                { icon: Zap, title: 'Mobile Friendly', desc: 'Manage everything from your phone or tablet' },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className='rounded-xl border border-white/10 bg-slate-950/40 p-5 space-y-3 hover:border-violet-400/60 hover:bg-slate-950/60 transition-all duration-300 group animate-in fade-in slide-in-from-bottom'
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className='flex items-center gap-3'>
                      <div className='rounded-lg bg-violet-500/20 p-2 border border-violet-400/40 group-hover:bg-violet-500/30 transition-colors ring-1 ring-violet-400/40'>
                        <Icon className='h-5 w-5 text-violet-300' />
                      </div>
                      <h3 className='font-semibold text-white text-sm'>{feature.title}</h3>
                    </div>
                    <p className='text-xs text-slate-400'>{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing - Emphasizing Free */}
        <section className='w-full py-16 md:py-20 px-4'>
          <div className='max-w-5xl mx-auto space-y-12'>
            <div className='text-center space-y-3 animate-in fade-in duration-700'>
              <div className='inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-violet-200/80 text-xs font-medium border border-white/10 ring-1 ring-white/10'>
                <Sparkles className='h-3 w-3' />
                <span>No Credit Card Required</span>
              </div>
              <h2 className='text-3xl md:text-4xl font-bold text-white'>
                Free Forever. Seriously.
              </h2>
              <p className='text-lg text-slate-300 max-w-2xl mx-auto'>
                We believe property management software should be accessible to everyone. Start free with up to 24 units, then upgrade when you're ready to grow.
              </p>
            </div>

            <div className='grid gap-6 md:grid-cols-3'>
              <div className='rounded-2xl border-2 border-violet-400/60 bg-violet-500/10 p-8 flex flex-col gap-6 relative overflow-hidden'>
                <div className='absolute top-0 right-0 bg-violet-500 text-white px-4 py-1 text-xs font-bold rounded-bl-lg'>
                  MOST POPULAR
                </div>
                <div className='space-y-2'>
                  <h3 className='text-2xl font-bold text-white'>Free Plan</h3>
                  <p className='text-violet-200/80 text-sm'>Perfect for all landlords</p>
                </div>
                <div className='space-y-1'>
                  <div className='text-5xl font-bold text-white'>$0</div>
                  <div className='text-violet-200/80 text-sm'>Forever • Up to 24 units</div>
                </div>
                <ul className='space-y-3 text-sm text-white flex-1'>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Up to 24 units</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Online rent payments (Stripe)</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Digital leases & e-signatures</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Maintenance ticket system</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Tenant applications</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Revenue tracking & reports</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Tenant communication portal</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Mobile-friendly dashboard</span>
                  </li>
                </ul>
                <div className='rounded-lg bg-slate-900/60 border border-white/10 p-3 space-y-1'>
                  <p className='text-xs font-semibold text-slate-300'>Transaction Fees:</p>
                  <p className='text-xs text-slate-400'>$2 per rent payment</p>
                </div>
                <Link
                  href='/sign-up'
                  className='w-full inline-flex items-center justify-center rounded-full bg-violet-500 text-white px-6 py-3 text-sm font-bold hover:bg-violet-400 transition-all duration-300 hover:scale-105'
                >
                  Start Free Now
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Link>
              </div>

              <div className='rounded-2xl border border-white/10 bg-slate-950/40 p-8 flex flex-col gap-6'>
                <div className='space-y-2'>
                  <h3 className='text-2xl font-bold text-white'>Pro (Coming Soon)</h3>
                  <p className='text-slate-300 text-sm'>For growing portfolios</p>
                </div>
                <div className='space-y-1'>
                  <div className='text-5xl font-bold text-white'>$29.99</div>
                  <div className='text-slate-300 text-sm'>per month • 25+ units</div>
                </div>
                <ul className='space-y-3 text-sm text-slate-300 flex-1'>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Everything in Free</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Advanced analytics & reports</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Automated late fees</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Team access & collaboration</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Priority support</span>
                  </li>
                </ul>
                <div className='rounded-lg bg-slate-900/60 border border-white/10 p-3 space-y-1'>
                  <p className='text-xs font-semibold text-slate-300'>Transaction Fees:</p>
                  <p className='text-xs text-slate-400'>$2 per rent payment</p>
                </div>
                <Link
                  href='/contact'
                  className='w-full inline-flex items-center justify-center rounded-full border-2 border-white/30 text-white px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-all duration-300'
                >
                  Get Notified
                </Link>
              </div>

              <div className='rounded-2xl border border-white/10 bg-slate-950/40 p-8 flex flex-col gap-6'>
                <div className='space-y-2'>
                  <h3 className='text-2xl font-bold text-white'>Enterprise</h3>
                  <p className='text-slate-300 text-sm'>For property management companies</p>
                </div>
                <div className='space-y-1'>
                  <div className='text-5xl font-bold text-white'>Custom</div>
                  <div className='text-slate-300 text-sm'>Contact us</div>
                </div>
                <ul className='space-y-3 text-sm text-slate-300 flex-1'>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Everything in Pro</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Custom branding & subdomains</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>API access</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Dedicated support</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle2 className='h-5 w-5 text-violet-300 shrink-0 mt-0.5' />
                    <span>Custom integrations</span>
                  </li>
                </ul>
                <div className='rounded-lg bg-slate-900/60 border border-white/10 p-3 space-y-1'>
                  <p className='text-xs font-semibold text-slate-300'>Transaction Fees:</p>
                  <p className='text-xs text-slate-400'>$2 per rent payment</p>
                </div>
                <Link
                  href='/contact'
                  className='w-full inline-flex items-center justify-center rounded-full border-2 border-white/30 text-white px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-all duration-300'
                >
                  Contact Sales
                </Link>
              </div>
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
              Join thousands of landlords who've simplified their property management. Sign up free in 30 seconds.
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
              No credit card required • Setup in minutes • Cancel anytime
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
