import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import Link from 'next/link';
import { Building2, CreditCard, Palette, Globe, HardHat, GraduationCap } from 'lucide-react';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Getting started',
};

const AdminOnboardingPage = async () => {
  await requireAdmin();
  const session = await auth();
  const landlordResult = await getOrCreateCurrentLandlord();

  const landlordName = landlordResult.success ? landlordResult.landlord.name : 'Your properties';

  return (
    <main className='min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12'>
      <div className='max-w-3xl w-full space-y-12'>
        {/* Welcome header */}
        <div className='text-center space-y-4'>
          <p className='text-sm uppercase tracking-[0.3em] text-emerald-600/80'>
            Welcome, {landlordName.split(' ')[0]}
          </p>
          <h1 className='text-4xl md:text-5xl font-bold text-slate-900 leading-tight'>
            Let&apos;s get your dashboard set up
          </h1>
          <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
            Follow these steps to start managing tenants and rent payments
          </p>
        </div>

        {/* Quick start steps */}
        <div className='grid gap-4 max-w-xl mx-auto'>
          <Link
            href='/admin/products/new'
            className='group relative rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-200'
          >
            <div className='flex items-start gap-4'>
              <div className='h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-200 transition-colors'>
                <Building2 className='h-6 w-6' />
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-slate-900 mb-1'>
                  1. Add your first property
                </h3>
                <p className='text-sm text-slate-600'>
                  Create a building with units and rent amounts
                </p>
              </div>
            </div>
          </Link>

          <Link
            href='/admin/branding'
            className='group relative rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-violet-400 hover:bg-violet-50/50 transition-all duration-200'
          >
            <div className='flex items-start gap-4'>
              <div className='h-12 w-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center group-hover:bg-violet-200 transition-colors'>
                <Palette className='h-6 w-6' />
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-slate-900 mb-1'>
                  2. Customize your branding
                </h3>
                <p className='text-sm text-slate-600'>
                  Upload your logo and set your brand colors
                </p>
              </div>
            </div>
          </Link>

          <Link
            href='/admin/branding'
            className='group relative rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-cyan-400 hover:bg-cyan-50/50 transition-all duration-200'
          >
            <div className='flex items-start gap-4'>
              <div className='h-12 w-12 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-200 transition-colors'>
                <Globe className='h-6 w-6' />
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-slate-900 mb-1'>
                  3. Set up your subdomain
                </h3>
                <p className='text-sm text-slate-600'>
                  Get a custom URL for tenants to apply and view properties
                </p>
              </div>
            </div>
          </Link>

          <Link
            href='/admin/contractors'
            className='group relative rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-orange-400 hover:bg-orange-50/50 transition-all duration-200'
          >
            <div className='flex items-start gap-4'>
              <div className='h-12 w-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-200 transition-colors'>
                <HardHat className='h-6 w-6' />
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-slate-900 mb-1'>
                  4. Add contractors
                </h3>
                <p className='text-sm text-slate-600'>
                  Manage maintenance contractors and work orders
                </p>
              </div>
            </div>
          </Link>

          <Link
            href='/admin/payouts'
            className='group relative rounded-2xl border-2 border-slate-200 bg-white p-6 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200'
          >
            <div className='flex items-start gap-4'>
              <div className='h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200 transition-colors'>
                <CreditCard className='h-6 w-6' />
              </div>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-slate-900 mb-1'>
                  5. Connect payouts
                </h3>
                <p className='text-sm text-slate-600'>
                  Link your bank to cash out collected rent
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Skip option */}
        <div className='text-center'>
          <Link
            href='/admin/overview'
            className='inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors'
          >
            Skip for now and explore the dashboard
          </Link>
        </div>

        {/* PM University callout */}
        <div className='max-w-xl mx-auto rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-6'>
          <div className='flex items-start gap-4'>
            <div className='h-12 w-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0'>
              <GraduationCap className='h-6 w-6' />
            </div>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-slate-900 mb-1'>
                New to the platform?
              </h3>
              <p className='text-sm text-slate-600 mb-3'>
                PM University has step-by-step guides for everything — from setting up Stripe to understanding tenant cards and running investor reports.
              </p>
              <Link
                href='/admin/university'
                className='inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors'
              >
                Open PM University →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminOnboardingPage;
