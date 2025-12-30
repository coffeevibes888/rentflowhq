import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord, updateCurrentLandlordSubdomain } from '@/lib/actions/landlord.actions';

export const metadata: Metadata = {
  title: 'Property Management Settings',
};

const AdminSettingsPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  const landlord = landlordResult.success ? landlordResult.landlord : null;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com';
  const isLocalhost = rootDomain.includes('localhost');

  const handleSubdomainUpdate = async (formData: FormData) => {
    'use server';
    await updateCurrentLandlordSubdomain(formData);
  };

  return (
    <main className='w-full space-y-4'>
      <div className='space-y-1'>
        <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-white'>Settings</h1>
        <p className='text-xs text-slate-300/80'>
          Core settings have moved. Use the links below to manage branding, communications, or legal defaults.
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl p-3 sm:p-4 space-y-2'>
          <h2 className='text-sm sm:text-base font-semibold text-white'>Subscription & Billing</h2>
          <p className='text-[10px] sm:text-xs text-slate-300/80'>
            Manage your subscription plan, view usage, and upgrade.
          </p>
          <Link
            href='/admin/settings/subscription'
            className='inline-flex items-center justify-center rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500'
          >
            Manage Subscription
          </Link>
        </div>

        <div className='rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-xl p-3 sm:p-4 space-y-2'>
          <h2 className='text-sm sm:text-base font-semibold text-white'>Amenities</h2>
          <p className='text-[10px] sm:text-xs text-slate-300/80'>
            Manage property and unit amenities like washer/dryer, pool, gym.
          </p>
          <Link
            href='/admin/settings/amenities'
            className='inline-flex items-center justify-center rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500'
          >
            Manage Amenities
          </Link>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-3 sm:p-4 space-y-2'>
          <h2 className='text-sm sm:text-base font-semibold text-white'>Branding & Portal</h2>
          <p className='text-[10px] sm:text-xs text-slate-300/80'>
            Update logo, company profile, and tenant portal URL slug.
          </p>
          <Link
            href='/admin/branding'
            className='inline-flex items-center justify-center rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500'
          >
            Go to Branding
          </Link>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-3 sm:p-4 space-y-2'>
          <h2 className='text-sm sm:text-base font-semibold text-white'>Communications</h2>
          <p className='text-[10px] sm:text-xs text-slate-300/80'>
            Notification preferences live in Communications.
          </p>
          <Link
            href='/admin/communications'
            className='inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500'
          >
            Go to Communications
          </Link>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-3 sm:p-4 space-y-2'>
          <h2 className='text-sm sm:text-base font-semibold text-white'>Leasing & Legal</h2>
          <p className='text-[10px] sm:text-xs text-slate-300/80'>
            Leasing defaults and legal notice defaults are under Legal Documents.
          </p>
          <Link
            href='/admin/legal-documents'
            className='inline-flex items-center justify-center rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500'
          >
            Go to Legal Documents
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AdminSettingsPage;

