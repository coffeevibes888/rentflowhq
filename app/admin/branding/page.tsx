import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord, uploadLandlordLogo, updateCustomDomain } from '@/lib/actions/landlord.actions';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getRootDomainFromHost, getProtocol } from '@/lib/utils/domain-utils';
import SubdomainForm from '@/components/admin/subdomain-form';
import DomainSearch from '@/components/admin/domain-search';
import { Image, Globe, Palette } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Branding & Domain',
};

const AdminBrandingPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlord = landlordResult.landlord;
  
  // Get root domain from request headers (works in production)
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const rootDomain = getRootDomainFromHost(host);
  const protocol = getProtocol(host);

  const handleLogoUpload = async (formData: FormData) => {
    'use server';
    const result = await uploadLandlordLogo(formData);
    if (!result.success) {
      throw new Error(result.message || 'Failed to upload logo');
    }
    // Redirect to refresh the page with new logo
    redirect('/admin/branding');
  };

  const handleCustomDomainUpdate = async (formData: FormData) => {
    'use server';
    const result = await updateCustomDomain(formData);
    if (!result.success) {
      throw new Error(result.message || 'Failed to update custom domain');
    }
    // Redirect to refresh the page
    redirect('/admin/branding');
  };

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-8'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-50 mb-2'>Branding & Domain</h1>
          <p className='text-sm text-slate-300/80'>
            Customize your public tenant portal with your logo, subdomain, and optional custom domain.
          </p>
        </div>

        {/* Logo Section */}
        <section className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex items-start gap-3 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors'>
          <div className='h-9 w-9 rounded-lg bg-white/5 text-violet-200/80 flex items-center justify-center shrink-0 ring-1 ring-white/10'>
            <Image className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-slate-50'>Logo</h2>
              <p className='text-xs text-slate-300/80'>
                Upload your company logo to display on your public tenant portal. Recommended size: 200x200px.
              </p>
            </div>

          {landlord.logoUrl && (
            <div className='flex items-center gap-4'>
              <div className='relative h-16 w-16 rounded-lg border border-white/10 overflow-hidden bg-slate-900/80'>
                <img
                  src={landlord.logoUrl}
                  alt={`${landlord.name} logo`}
                  className='h-full w-full object-contain'
                />
              </div>
              <div className='text-sm text-slate-200/90'>
                <p className='font-medium text-slate-50'>Current logo</p>
                <p className='text-xs text-slate-300/80'>Displayed on your tenant portal</p>
              </div>
            </div>
          )}

          <form action={handleLogoUpload} className='space-y-3'>
            <div>
              <label className='block text-sm font-medium text-slate-200/90 mb-2'>Upload Logo</label>
              <input
                type='file'
                name='logo'
                accept='image/jpeg,image/png,image/svg+xml,image/webp'
                className='block w-full text-sm text-slate-300/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/5 file:text-violet-200/80 file:ring-1 file:ring-white/10 hover:file:bg-white/10'
                required
              />
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <button
                type='submit'
                className='inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white hover:bg-violet-400 transition-colors'
              >
                Upload logo
              </button>
              <button
                type='button'
                className='inline-flex items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 px-5 py-2 text-sm font-medium text-emerald-200/90 hover:bg-emerald-500/30 transition-colors ring-1 ring-emerald-400/40'
              >
                Request custom logo design ($99)
              </button>
            </div>
          </form>

            <p className='text-xs text-slate-300/80'>
              We'll design a professional logo for your brand (1 revision included). Delivered within 3 business days.
            </p>
          </div>
        </section>

        {/* Subdomain Section */}
        <section className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex items-start gap-3 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors'>
          <div className='h-9 w-9 rounded-lg bg-white/5 text-violet-200/80 flex items-center justify-center shrink-0 ring-1 ring-white/10'>
            <Globe className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-slate-50'>Subdomain</h2>
              <p className='text-xs text-slate-300/80'>
                Your free subdomain where tenants can view listings, apply, and pay rent online.
              </p>
            </div>

          <SubdomainForm currentSubdomain={landlord.subdomain} rootDomain={rootDomain} />

            {landlord.subdomain && (
              <p className='text-xs text-slate-200/90'>
                Current URL:{' '}
                <a
                  href={`${protocol}://${landlord.subdomain}.${rootDomain}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-mono text-violet-200/80 hover:text-violet-100 transition-colors'
                >
                  {`${protocol}://${landlord.subdomain}.${rootDomain}`}
                </a>
              </p>
            )}
          </div>
        </section>

        {/* Custom Domain Section */}
        <section className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex items-start gap-3 hover:border-violet-400/60 hover:bg-slate-900/90 transition-colors'>
          <div className='h-9 w-9 rounded-lg bg-white/5 text-violet-200/80 flex items-center justify-center shrink-0 ring-1 ring-white/10'>
            <Palette className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-slate-50'>Custom Domain</h2>
              <p className='text-xs text-slate-300/80'>
                Use your own domain (e.g., www.yourcompany.com) for your tenant portal. We'll host it for 2 years free.
              </p>
            </div>

          {landlord.customDomain ? (
            <div className='space-y-3'>
              <div className='rounded-lg border border-emerald-400/40 bg-emerald-500/20 p-4 ring-1 ring-emerald-400/40'>
                <p className='text-sm font-medium text-emerald-200/90'>Active custom domain</p>
                <p className='text-lg font-semibold text-emerald-200/90 mt-1'>{landlord.customDomain}</p>
                <p className='text-xs text-emerald-200/80 mt-2'>Hosting included until Dec 2026</p>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='rounded-lg border border-white/10 bg-slate-900/80 p-4 space-y-2'>
                <p className='text-sm font-semibold text-slate-50'>Premium feature</p>
                <p className='text-sm text-slate-200/90'>
                  Search and purchase your own domain. We handle DNS setup and provide 2 years of free hosting.
                </p>
                <ul className='text-xs text-slate-300/80 space-y-1 mt-2'>
                  <li>• Full DNS and SSL setup included</li>
                  <li>• 2 years of hosting completely free</li>
                  <li>• Professional email forwarding</li>
                  <li>• Priority support</li>
                </ul>
              </div>

              <DomainSearch />
            </div>
          )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminBrandingPage;
