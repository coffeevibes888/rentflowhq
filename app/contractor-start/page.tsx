import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/auth';
import MetaViewContent from '@/components/analytics/meta-view-content';
import {
  CheckCircle2,
  Shield,
  FileSignature,
  Hammer,
  Globe,
  Banknote,
  CalendarClock,
  ArrowRight,
  Star,
  ClipboardList,
  Users,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'The Field Service Platform Built for Real Contractors',
  description:
    'Estimates, invoices, scheduling, crew management, and your own branded client portal. Starting at $19.99/month. No per-job fees.',
  alternates: { canonical: 'https://www.propertyflowhq.com/contractor-start' },
  openGraph: {
    title: 'Start Your Free 14-Day Trial — Property Flow HQ for Contractors',
    description:
      'Run your whole business from one dashboard. Estimates, invoices, scheduling, and payments.',
    url: 'https://www.propertyflowhq.com/contractor-start',
  },
  robots: { index: false, follow: true },
};


const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Estimates + Invoices',
    desc: 'Send quotes, convert to invoices, get paid. All in the same flow.',
  },
  {
    icon: FileSignature,
    title: 'E-Sign Contracts',
    desc: 'Lock in the job before you roll the truck. No more verbal-only deals.',
  },
  {
    icon: CalendarClock,
    title: 'Built-In Scheduling',
    desc: 'Book jobs, dispatch crews, send reminders. No more double-bookings.',
  },
  {
    icon: Banknote,
    title: 'Get Paid Faster',
    desc: 'ACH, card, or bank transfer. Payments hit your account fast.',
  },
  {
    icon: Users,
    title: 'Crew + Subcontractors',
    desc: 'Assign jobs, track hours, run payroll. One dashboard for your whole team.',
  },
  {
    icon: Globe,
    title: 'Your Branded Subdomain',
    desc: 'yourname.propertyflowhq.com — your logo, your brand, your portal.',
  },
];

const STEPS = [
  { n: '01', title: 'Create your account', desc: '60 seconds. No card required.' },
  { n: '02', title: 'Add your services + crew', desc: 'Set pricing, add team, connect your bank.' },
  { n: '03', title: 'Book jobs. Get paid.', desc: 'Send estimates, dispatch, invoice. All automated.' },
];

export default async function ContractorLandingPage() {
  const session = await auth();

  // Already signed in? Skip sign-up entirely and go to plan selection.
  // Not signed in? Send to sign-up with contractor role + plan pre-set.
  const ctaUrl = session?.user
    ? '/onboarding/contractor/subscription?plan=starter'
    : '/sign-up?role=contractor&plan=starter&interval=monthly&skipOnboarding=true';

  return (
    <main className='min-h-screen bg-white text-slate-900 antialiased'>
      <MetaViewContent
        contentName='contractor_landing_start'
        contentCategory='contractor'
        value={19.99}
      />
      {/* Minimal header — logo only */}
      <header className='border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-40'>
        <div className='max-w-6xl mx-auto px-6 py-4 flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2'>
            <Image src='/images/logo.svg' alt='Property Flow HQ' width={36} height={36} priority />
            <span className='font-bold text-slate-900'>Property Flow HQ</span>
          </Link>
          <Link
            href={ctaUrl}
            className='hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 transition-colors'
          >
            Start Free Trial <ArrowRight className='h-4 w-4' />
          </Link>
        </div>
      </header>

      {/* HERO — warm amber + rust tones to match the contractor theme */}
      <section className='relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-[#1a0f08] via-[#2a1810] to-[#1a0f08]' />
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-orange-500/15 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl' />

        <div className='relative max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32'>
          <div className='max-w-3xl mx-auto text-center space-y-8'>
            <span className='inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-400/10 px-4 py-1.5 text-xs font-semibold text-orange-200 uppercase tracking-wider'>
              <Hammer className='h-3.5 w-3.5' /> Built for Real Contractors
            </span>

            <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.05]'>
              Stop Juggling Texts, Spreadsheets, and{' '}
              <span className='bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent'>
                Paper Invoices.
              </span>
            </h1>

            <p className='text-lg md:text-xl text-amber-100/80 leading-relaxed max-w-2xl mx-auto'>
              Estimates, contracts, scheduling, crew, and getting paid — all in one tool.
              Starting at <span className='text-white font-semibold'>$19.99/mo</span>.
              No per-job fees.
            </p>

            <div className='flex flex-col sm:flex-row gap-3 justify-center items-center pt-2'>
              <Link
                href={ctaUrl}
                className='group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-300 hover:to-rose-400 text-white font-bold text-base px-8 py-4 shadow-2xl shadow-orange-500/30 transition-all hover:scale-[1.02] w-full sm:w-auto'
              >
                Start Your Free 14-Day Trial
                <ArrowRight className='h-5 w-5 group-hover:translate-x-0.5 transition-transform' />
              </Link>
            </div>

            <p className='text-sm text-amber-200/60 flex items-center justify-center gap-2'>
              <Shield className='h-4 w-4 text-emerald-400' />
              No credit card required · Cancel anytime · Setup in 5 minutes
            </p>

            <div className='pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-amber-200/60 text-sm'>
              <div className='flex items-center gap-1'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className='h-4 w-4 fill-amber-400 text-amber-400' />
                ))}
                <span className='ml-2 text-amber-100'>Loved by solo ops and crews</span>
              </div>
              <span className='hidden sm:inline text-amber-900'>•</span>
              <span>Built on Stripe · Get paid fast</span>
              <span className='hidden sm:inline text-amber-900'>•</span>
              <span>No per-job pricing</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM / HOOK */}
      <section className='py-16 md:py-24 px-6 bg-white'>
        <div className='max-w-4xl mx-auto text-center space-y-6'>
          <h2 className='text-3xl md:text-4xl font-bold text-slate-900'>
            You’re a contractor, not a paperwork factory.
          </h2>
          <p className='text-lg text-slate-600 leading-relaxed'>
            ServiceTitan wants $400+ a month. Jobber hits you with add-ons. Housecall Pro
            nickel-and-dimes every feature. We put everything you actually need into one flat
            price — so you can spend less time at the desk and more time on the job.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className='py-16 md:py-24 px-6 bg-gradient-to-b from-orange-50/40 via-white to-rose-50/40'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center max-w-2xl mx-auto space-y-3 mb-14'>
            <span className='inline-block text-xs font-bold tracking-widest text-orange-600 uppercase'>
              Everything. Included.
            </span>
            <h2 className='text-3xl md:text-4xl font-bold text-slate-900'>
              Your whole business, one dashboard.
            </h2>
            <p className='text-slate-600'>
              From the first lead to the final payment — every step of your job is tracked,
              automated, and connected.
            </p>
          </div>

          <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className='group rounded-2xl bg-white border border-orange-100 p-6 hover:border-orange-400 hover:shadow-xl hover:-translate-y-0.5 transition-all'
                >
                  <div className='h-11 w-11 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20'>
                    <Icon className='h-5 w-5 text-white' />
                  </div>
                  <h3 className='font-bold text-slate-900 mb-1.5'>{f.title}</h3>
                  <p className='text-sm text-slate-600 leading-relaxed'>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className='py-16 md:py-24 px-6 bg-white'>
        <div className='max-w-5xl mx-auto'>
          <div className='text-center max-w-2xl mx-auto space-y-3 mb-14'>
            <span className='inline-block text-xs font-bold tracking-widest text-orange-600 uppercase'>
              How It Works
            </span>
            <h2 className='text-3xl md:text-4xl font-bold text-slate-900'>
              Live in 5 minutes. On the job today.
            </h2>
          </div>

          <div className='grid gap-6 md:grid-cols-3'>
            {STEPS.map((s) => (
              <div
                key={s.n}
                className='relative rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 p-7'
              >
                <div className='text-5xl font-black text-orange-200 leading-none mb-3'>{s.n}</div>
                <h3 className='text-lg font-bold text-slate-900 mb-2'>{s.title}</h3>
                <p className='text-sm text-slate-600 leading-relaxed'>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING ANCHOR */}
      <section className='py-16 md:py-24 px-6 bg-gradient-to-br from-[#1a0f08] via-[#2a1810] to-[#1a0f08] text-white relative overflow-hidden'>
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-orange-500/15 rounded-full blur-3xl' />
        <div className='relative max-w-3xl mx-auto text-center space-y-8'>
          <span className='inline-block text-xs font-bold tracking-widest text-orange-300 uppercase'>
            Simple Pricing
          </span>
          <h2 className='text-3xl md:text-5xl font-bold'>One price. Everything included.</h2>

          <div className='inline-flex flex-col items-center rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 px-10 py-8 shadow-2xl'>
            <div className='flex items-baseline gap-1'>
              <span className='text-6xl md:text-7xl font-black bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent'>
                $19.99
              </span>
              <span className='text-amber-100/70 font-semibold'>/month</span>
            </div>
            <p className='text-sm text-amber-100/50 mt-1'>Solo operator · Scales with your crew</p>

            <ul className='mt-6 space-y-2.5 text-left'>
              {[
                'Estimates + quotes',
                'E-sign contracts',
                'Unlimited invoices',
                'Built-in scheduling + dispatch',
                'Crew + subcontractor management',
                'Branded client portal',
                'Photo & document uploads per job',
              ].map((item) => (
                <li key={item} className='flex items-center gap-2.5 text-sm text-amber-50'>
                  <CheckCircle2 className='h-5 w-5 text-emerald-400 shrink-0' />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className='pt-4'>
            <Link
              href={ctaUrl}
              className='group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-300 hover:to-rose-400 text-white font-bold text-lg px-10 py-5 shadow-2xl shadow-orange-500/30 transition-all hover:scale-[1.02]'
            >
              Start Free Today
              <ArrowRight className='h-5 w-5 group-hover:translate-x-0.5 transition-transform' />
            </Link>
            <p className='text-sm text-amber-100/60 mt-4'>
              14-day free trial · No credit card · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className='py-16 md:py-20 px-6 bg-white border-t border-slate-100'>
        <div className='max-w-3xl mx-auto text-center space-y-5'>
          <h2 className='text-2xl md:text-3xl font-bold text-slate-900'>
            Ready to run your business like a pro?
          </h2>
          <p className='text-slate-600'>
            Join the contractors who book more jobs and get paid faster with Property Flow HQ.
          </p>
          <Link
            href={ctaUrl}
            className='inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-4 transition-colors'
          >
            Start My Free Trial <ArrowRight className='h-5 w-5' />
          </Link>
          <p className='text-xs text-slate-500 pt-2'>
            Questions? Email us at{' '}
            <a href='mailto:support@propertyflowhq.com' className='underline'>
              support@propertyflowhq.com
            </a>
          </p>
        </div>
      </section>

      {/* Minimal footer */}
      <footer className='py-8 px-6 border-t border-slate-100 bg-slate-50'>
        <div className='max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500'>
          <div>© {new Date().getFullYear()} Property Flow HQ. All rights reserved.</div>
          <div className='flex items-center gap-5'>
            <Link href='/privacy' className='hover:text-slate-900'>Privacy</Link>
            <Link href='/terms' className='hover:text-slate-900'>Terms</Link>
            <Link href='/' className='hover:text-slate-900'>Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
