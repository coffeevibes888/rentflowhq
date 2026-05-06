import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/auth';
import MetaViewContent from '@/components/analytics/meta-view-content';
import {
  CheckCircle2,
  Zap,
  Shield,
  FileSignature,
  Wrench,
  Globe,
  Banknote,
  UserPlus,
  ArrowRight,
  Sparkles,
  Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Property Management That Doesn’t Charge You to Collect Rent',
  description:
    'Unlimited leases, unlimited applications, e-signatures, maintenance tickets, and your own white-label tenant portal. Starting at $19.99/month. No per-unit fees.',
  alternates: { canonical: 'https://www.propertyflowhq.com/start' },
  openGraph: {
    title: 'Start Your Free 14-Day Trial — Property Flow HQ',
    description:
      'Automated rent collection, free lease builder, and your own branded tenant portal. No credit card required.',
    url: 'https://www.propertyflowhq.com/start',
  },
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

const FEATURES = [
  {
    icon: Banknote,
    title: 'Rent Collection, 0% Fees',
    desc: 'Tenants pay rent straight to your bank. You keep every dollar.',
  },
  {
    icon: FileSignature,
    title: 'Unlimited Leases + E-Sign',
    desc: 'Build, send, and sign leases in minutes. No per-document charges.',
  },
  {
    icon: UserPlus,
    title: 'Unlimited Applications',
    desc: 'Screen tenants, approve in one click, or schedule viewings online.',
  },
  {
    icon: Wrench,
    title: 'Maintenance Ticket System',
    desc: 'Tenants submit tickets. You assign, track, and close them out.',
  },
  {
    icon: Globe,
    title: 'White-Label Subdomain',
    desc: 'yourname.propertyflowhq.com — your branding, your portal.',
  },
  {
    icon: Zap,
    title: 'Automated Everything',
    desc: 'Late fees, reminders, receipts, and notices run on autopilot.',
  },
];

const STEPS = [
  { n: '01', title: 'Pick your plan', desc: 'Starter, Pro, or Enterprise. Upgrade anytime.' },
  { n: '02', title: 'Create your account', desc: '60 seconds. Card-on-file for a 14-day free trial.' },
  { n: '03', title: 'Go on autopilot', desc: 'Add properties and tenants. Rent, leases, and maintenance run themselves.' },
];

export default async function PMLandingPage() {
  const session = await auth();

  // If they're already signed in, skip the sign-up form and send them straight to plan selection.
  // If not, go to sign-up with role + plan pre-selected so the form skips the role picker
  // and forwards to /onboarding/landlord/subscription on success.
  const ctaUrl = session?.user
    ? '/onboarding/landlord/subscription?plan=starter&skipOnboarding=true'
    : '/sign-up?role=landlord&plan=starter&interval=monthly&skipOnboarding=true';

  return (
    <main className='min-h-screen bg-white text-slate-900 antialiased'>
      <MetaViewContent
        contentName='pm_landing_start'
        contentCategory='landlord'
        value={19.99}
      />
      {/* Minimal top bar — logo only, no main nav (conversion focus) */}
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

      {/* HERO */}
      <section className='relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900' />
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-cyan-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl' />

        <div className='relative max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32'>
          <div className='max-w-3xl mx-auto text-center space-y-8'>
            <span className='inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold text-cyan-200 uppercase tracking-wider'>
              <Sparkles className='h-3.5 w-3.5' /> Built for Small Landlords
            </span>

            <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.05]'>
              Property Management That{' '}
              <span className='bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-transparent'>
                Doesn’t Charge You
              </span>{' '}
              to Collect Rent.
            </h1>

            <p className='text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto'>
              Leases, applications, maintenance, and automation — all in one place.
              Starting at <span className='text-white font-semibold'>$19.99/mo</span>.
              No per-unit fees. Ever.
            </p>

            <div className='flex flex-col sm:flex-row gap-3 justify-center items-center pt-2'>
              <Link
                href={ctaUrl}
                className='group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-base px-8 py-4 shadow-2xl shadow-cyan-500/30 transition-all hover:scale-[1.02] w-full sm:w-auto'
              >
                Start Your Free 14-Day Trial
                <ArrowRight className='h-5 w-5 group-hover:translate-x-0.5 transition-transform' />
              </Link>
            </div>

            <p className='text-sm text-slate-400 flex items-center justify-center gap-2'>
              <Shield className='h-4 w-4 text-emerald-400' />
              14 days free · Cancel anytime · Setup in 5 minutes
            </p>

            <div className='pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-slate-400 text-sm'>
              <div className='flex items-center gap-1'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className='h-4 w-4 fill-amber-400 text-amber-400' />
                ))}
                <span className='ml-2 text-slate-300'>Loved by indie landlords</span>
              </div>
              <span className='hidden sm:inline text-slate-600'>•</span>
              <span>Built on Stripe · Bank-level security</span>
              <span className='hidden sm:inline text-slate-600'>•</span>
              <span>No per-unit pricing</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM / HOOK */}
      <section className='py-16 md:py-24 px-6 bg-white'>
        <div className='max-w-4xl mx-auto text-center space-y-6'>
          <h2 className='text-3xl md:text-4xl font-bold text-slate-900'>
            Your competition is charging you to collect your own money.
          </h2>
          <p className='text-lg text-slate-600 leading-relaxed'>
            Buildium, AppFolio, and TurboTenant tack on ACH fees, per-lease charges, per-unit pricing, and
            “premium” upsells for features that should just come with the software. We don’t.
            One flat price. Everything included.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className='py-16 md:py-24 px-6 bg-slate-50'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center max-w-2xl mx-auto space-y-3 mb-14'>
            <span className='inline-block text-xs font-bold tracking-widest text-blue-600 uppercase'>
              Everything. Included.
            </span>
            <h2 className='text-3xl md:text-4xl font-bold text-slate-900'>
              Run your entire portfolio from one dashboard.
            </h2>
            <p className='text-slate-600'>
              No upsells. No add-ons. No “call for pricing.” Just the tools you need to stop chasing
              rent, paperwork, and contractors.
            </p>
          </div>

          <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className='group rounded-2xl bg-white border border-slate-200 p-6 hover:border-blue-400 hover:shadow-xl hover:-translate-y-0.5 transition-all'
                >
                  <div className='h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20'>
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
            <span className='inline-block text-xs font-bold tracking-widest text-blue-600 uppercase'>
              How It Works
            </span>
            <h2 className='text-3xl md:text-4xl font-bold text-slate-900'>
              Live in 5 minutes. Seriously.
            </h2>
          </div>

          <div className='grid gap-6 md:grid-cols-3'>
            {STEPS.map((s) => (
              <div
                key={s.n}
                className='relative rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-7'
              >
                <div className='text-5xl font-black text-slate-200 leading-none mb-3'>{s.n}</div>
                <h3 className='text-lg font-bold text-slate-900 mb-2'>{s.title}</h3>
                <p className='text-sm text-slate-600 leading-relaxed'>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING ANCHOR */}
      <section className='py-16 md:py-24 px-6 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white relative overflow-hidden'>
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-3xl' />
        <div className='relative max-w-3xl mx-auto text-center space-y-8'>
          <span className='inline-block text-xs font-bold tracking-widest text-cyan-300 uppercase'>
            Simple Pricing
          </span>
          <h2 className='text-3xl md:text-5xl font-bold'>One price. Everything included.</h2>

          <div className='inline-flex flex-col items-center rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 px-10 py-8 shadow-2xl'>
            <div className='flex items-baseline gap-1'>
              <span className='text-6xl md:text-7xl font-black bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent'>
                $19.99
              </span>
              <span className='text-slate-300 font-semibold'>/month</span>
            </div>
            <p className='text-sm text-slate-400 mt-1'>Starts at Starter · Upgrade to Pro or Enterprise anytime</p>

            <ul className='mt-6 space-y-2.5 text-left'>
              {[
                'Rent collection with 0% fees',
                'Unlimited leases with e-signatures',
                'Unlimited rental applications',
                'Free lease builder',
                'Maintenance ticket system',
                'White-label tenant portal',
                'Automated late fees + reminders',
              ].map((item) => (
                <li key={item} className='flex items-center gap-2.5 text-sm text-slate-200'>
                  <CheckCircle2 className='h-5 w-5 text-emerald-400 shrink-0' />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className='pt-4'>
            <Link
              href={ctaUrl}
              className='group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-lg px-10 py-5 shadow-2xl shadow-cyan-500/30 transition-all hover:scale-[1.02]'
            >
              Start Free Today
              <ArrowRight className='h-5 w-5 group-hover:translate-x-0.5 transition-transform' />
            </Link>
            <p className='text-sm text-slate-400 mt-4'>
              14-day free trial · Pick your plan · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className='py-16 md:py-20 px-6 bg-white border-t border-slate-100'>
        <div className='max-w-3xl mx-auto text-center space-y-5'>
          <h2 className='text-2xl md:text-3xl font-bold text-slate-900'>
            Ready to stop paying fees just to collect your own rent?
          </h2>
          <p className='text-slate-600'>
            Join the landlords who run their entire portfolio from Property Flow HQ.
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
