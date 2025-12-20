import { requireAdmin } from '@/lib/auth-guard';
import {
  getOrCreateCurrentLandlord,
  uploadLandlordLogo,
  updateCustomDomain,
  updateLandlordBrandingProfile,
  uploadLandlordHeroImages,
  uploadLandlordAboutMedia,
} from '@/lib/actions/landlord.actions';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SubdomainForm from '@/components/admin/subdomain-form';
import DomainSearch from '@/components/admin/domain-search';
import { Image, Globe, Palette, Sparkles, UserCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Branding & Domain',
};

const AdminBrandingPage = async (props: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) => {
  await requireAdmin();

  const resolvedSearchParams = (await props.searchParams) || {};
  const errorMessage = resolvedSearchParams.error ? decodeURIComponent(resolvedSearchParams.error) : null;
  const successMessage = resolvedSearchParams.success ? decodeURIComponent(resolvedSearchParams.success) : null;

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    redirect(`/admin?error=${encodeURIComponent(landlordResult.message || 'Unable to determine landlord')}`);
  }

  const landlord = landlordResult.landlord as typeof landlordResult.landlord & {
    companyName?: string | null;
    companyEmail?: string | null;
    companyPhone?: string | null;
    companyAddress?: string | null;
    themeColor?: string | null;
    heroImages?: string[] | null;
    aboutBio?: string | null;
    aboutPhoto?: string | null;
    aboutGallery?: string[] | null;
  };
  
  // Base URL for production (path-based routing, not subdomain)
  const rawBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.rooms4rentlv.com';
  let baseUrl = 'https://www.rooms4rentlv.com';
  try {
    const normalizedRaw = rawBaseUrl.startsWith('http') ? rawBaseUrl : `https://${rawBaseUrl}`;
    const parsed = new URL(normalizedRaw);
    baseUrl = parsed.origin;
  } catch {
    // fallback to default
  }

  const handleLogoUpload = async (formData: FormData) => {
    'use server';
    const result = await uploadLandlordLogo(formData);
    if (!result.success) {
      redirect(`/admin/branding?error=${encodeURIComponent(result.message || 'Failed to upload logo')}`);
    }
    redirect('/admin/branding?success=Logo%20updated');
  };

  const handleHeroImagesUpload = async (formData: FormData) => {
    'use server';
    const result = await uploadLandlordHeroImages(formData);
    if (!result.success) {
      redirect(`/admin/branding?error=${encodeURIComponent(result.message || 'Failed to upload hero images')}`);
    }
    redirect('/admin/branding?success=Hero%20images%20updated');
  };

  const handleAboutMediaUpload = async (formData: FormData) => {
    'use server';
    const result = await uploadLandlordAboutMedia(formData);
    if (!result.success) {
      redirect(`/admin/branding?error=${encodeURIComponent(result.message || 'Failed to upload about media')}`);
    }
    redirect('/admin/branding?success=About%20media%20updated');
  };

  const themeOptions: { value: string; label: string; swatch: string }[] = [
    { value: 'violet', label: 'Violet pulse', swatch: 'from-violet-500 to-fuchsia-500' },
    { value: 'emerald', label: 'Emerald dusk', swatch: 'from-emerald-500 to-teal-400' },
    { value: 'blue', label: 'Blue horizon', swatch: 'from-blue-500 to-cyan-400' },
    { value: 'rose', label: 'Rose quartz', swatch: 'from-rose-500 to-pink-400' },
    { value: 'amber', label: 'Amber glow', swatch: 'from-amber-500 to-orange-400' },
  ];

  const handleCustomDomainUpdate = async (formData: FormData) => {
    'use server';
    const result = await updateCustomDomain(formData);
    if (!result.success) {
      redirect(`/admin/branding?error=${encodeURIComponent(result.message || 'Failed to update custom domain')}`);
    }
    redirect('/admin/branding?success=Domain%20updated');
  };

  const handleBrandingProfileUpdate = async (formData: FormData) => {
    'use server';
    const result = await updateLandlordBrandingProfile(formData);
    if (!result.success) {
      redirect(`/admin/branding?error=${encodeURIComponent(result.message || 'Failed to update branding profile')}`);
    }
    redirect('/admin/branding?success=Profile%20updated');
  };

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-8'>
        {(errorMessage || successMessage) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              errorMessage
                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {errorMessage || successMessage}
          </div>
        )}
        <div>
          <h1 className='text-3xl md:text-4xl font-bold font-large text-white mb-2'>Branding & Domain</h1>
          <p className='text-sm text-black font-bold'>
            Customize your public tenant portal with your logo, subdomain, and optional custom domain.
          </p>
        </div>

        {/* Logo Section */}
        <section className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-black'>Logo</h2>
              <p className='text-xs text-slate-300/80'>
                Upload your company logo to display on your public tenant portal. Recommended size: 200x200px.
              </p>
            </div>

          <div className='flex items-center gap-4'>
            <div className='relative h-16 w-16 rounded-lg border border-white/10 overflow-hidden bg-slate-900/80 flex items-center justify-center'>
              {landlord.logoUrl ? (
                <img
                  src={landlord.logoUrl}
                  alt={`${landlord.name} logo`}
                  className='h-full w-full object-contain'
                />
              ) : (
                <span className='text-xs text-slate-400'>No logo yet</span>
              )}
            </div>
            <div className='text-sm text-slate-200/90'>
              <p className='font-medium text-slate-50'>Current logo</p>
              <p className='text-xs text-black'>Displayed on your tenant portal</p>
            </div>
          </div>

          <form action={handleLogoUpload} className='space-y-3'>
            <div>
              <label className='block text-sm font-medium text-black mb-2'>Upload Logo</label>
              <input
                type='file'
                name='logo'
                accept='image/jpeg,image/png,image/svg+xml,image/webp'
                className='block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/5 file:text-violet-200/80 file:ring-1 file:ring-white/10 hover:file:bg-white/10'
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
                className='inline-flex items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500/30 transition-colors ring-1 ring-emerald-400/40'
              >
                Request custom logo design ($99)
              </button>
            </div>
          </form>

            <p className='text-xs text-black font-bold'>
              We'll design a professional logo for your brand (1 revision included). Delivered within 3 business days.
            </p>
          </div>
        </section>

        {/* Company Profile Section */}
        <section className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
          <div className='h-9 w-9 rounded-lg bg-white/5 text-violet-200/80 flex items-center justify-center shrink-0 ring-1 ring-white/10'>
            <Palette className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-slate-50'>Company profile</h2>
              <p className='text-xs text-slate-300/80'>
                This profile powers your tenant portal brand (APP_NAME) and hero content. Use your management company info, not the owner.
              </p>
            </div>
            <form action={handleBrandingProfileUpdate} className='grid gap-4 md:grid-cols-2 text-sm'>
              <div className='space-y-2'>
                <label className='block text-xs font-medium text-slate-200/90'>Management company name</label>
                <input
                  name='companyName'
                  defaultValue={landlord.companyName || ''}
                  className='w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder:text-slate-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400'
                  placeholder='Acme Property Management LLC'
                  required
                />
              </div>
              <div className='space-y-2'>
                <label className='block text-xs font-medium text-slate-200/90'>Primary contact email</label>
                <input
                  name='companyEmail'
                  defaultValue={landlord.companyEmail || ''}
                  className='w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder:text-slate-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400'
                  placeholder='leasing@company.com'
                  type='email'
                />
              </div>
              <div className='space-y-2'>
                <label className='block text-xs font-medium text-slate-200/90'>Office phone</label>
                <input
                  name='companyPhone'
                  defaultValue={landlord.companyPhone || ''}
                  className='w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder:text-slate-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400'
                  placeholder='(555) 123-4567'
                />
              </div>
              <div className='space-y-2 md:col-span-2'>
                <label className='block text-xs font-medium text-slate-200/90'>Office address</label>
                <input
                  name='companyAddress'
                  defaultValue={landlord.companyAddress || ''}
                  className='w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder:text-slate-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400'
                  placeholder='Street, city, state, ZIP'
                />
              </div>
              <div className='md:col-span-2 flex flex-wrap gap-3'>
                <button
                  type='submit'
                  className='inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white hover:bg-violet-400 transition-colors'
                >
                  Save profile
                </button>
                <p className='text-xs text-slate-300/80'>
                  Used across your tenant portal headers, hero, and metadata.
                </p>
              </div>
            </form>
          </div>
        </section>

        {/* Hero Media Section */}
        <section className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
          <div className='h-9 w-9 rounded-lg bg-white/5 text-violet-200/80 flex items-center justify-center shrink-0 ring-1 ring-white/10'>
            <Sparkles className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-slate-50'>Hero images</h2>
              <p className='text-xs text-slate-300/80'>
                Upload up to 3 hero images for your public portal hero section. JPG, PNG, SVG, or WebP up to 5MB each.
              </p>
            </div>

            {landlord.heroImages?.length ? (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                {landlord.heroImages.map((src, idx) => (
                  <div key={idx} className='relative h-32 rounded-lg border border-white/10 overflow-hidden bg-slate-900/70'>
                    <img src={src} alt={`Hero ${idx + 1}`} className='h-full w-full object-cover' />
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-xs text-slate-400'>No hero images yet.</p>
            )}

            <form action={handleHeroImagesUpload} className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-slate-200/90 mb-2'>Upload hero images</label>
                <input
                  type='file'
                  name='heroImages'
                  accept='image/jpeg,image/png,image/svg+xml,image/webp'
                  multiple
                  className='block w-full text-sm text-slate-300/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/5 file:text-violet-200/80 file:ring-1 file:ring-white/10 hover:file:bg-white/10'
                  required
                />
                <p className='text-[11px] text-slate-400 mt-1'>Max 3 images. Larger uploads will be ignored.</p>
              </div>
              <button
                type='submit'
                className='inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white hover:bg-violet-400 transition-colors'
              >
                Save hero images
              </button>
            </form>
          </div>
        </section>

        {/* About Me Section */}
        <section className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
          <div className='h-9 w-9 rounded-lg bg-white/5 text-violet-200/80 flex items-center justify-center shrink-0 ring-1 ring-white/10'>
            <UserCircle className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-slate-50'>About me / team</h2>
              <p className='text-xs text-slate-300/80'>
                Tell visitors about your management style, experience, and team. Add a primary headshot plus an optional gallery.
              </p>
            </div>

            <form action={handleBrandingProfileUpdate} className='space-y-3 text-sm'>
              <div className='space-y-2'>
                <label className='block text-xs font-medium text-slate-200/90'>About bio</label>
                <textarea
                  name='aboutBio'
                  defaultValue={landlord.aboutBio || ''}
                  className='w-full rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-50 placeholder:text-slate-400 focus:border-violet-400 focus:ring-1 focus:ring-violet-400'
                  rows={4}
                  placeholder='Share your story, specialties, and what tenants can expect.'
                />
              </div>
              <button
                type='submit'
                className='inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white hover:bg-violet-400 transition-colors'
              >
                Save bio
              </button>
            </form>

            <div className='space-y-3'>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <div className='rounded-lg border border-white/10 bg-slate-900/70 p-3'>
                  <p className='text-xs text-slate-300/80 mb-2'>Primary photo</p>
                  <div className='relative h-32 rounded-md overflow-hidden border border-white/10 bg-slate-950/50'>
                    {landlord.aboutPhoto ? (
                      <img src={landlord.aboutPhoto} alt='About photo' className='h-full w-full object-cover' />
                    ) : (
                      <div className='h-full w-full flex items-center justify-center text-slate-500 text-xs'>No photo</div>
                    )}
                  </div>
                </div>
                <div className='sm:col-span-2 rounded-lg border border-white/10 bg-slate-900/70 p-3'>
                  <p className='text-xs text-slate-300/80 mb-2'>Gallery</p>
                  {landlord.aboutGallery?.length ? (
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                      {landlord.aboutGallery.map((src, idx) => (
                        <div key={idx} className='relative h-24 rounded-md overflow-hidden border border-white/10 bg-slate-950/50'>
                          <img src={src} alt={`Gallery ${idx + 1}`} className='h-full w-full object-cover' />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-xs text-slate-400'>No gallery images yet.</p>
                  )}
                </div>
              </div>

              <form action={handleAboutMediaUpload} className='space-y-3'>
                <div className='grid gap-3 md:grid-cols-2 text-sm'>
                  <div>
                    <label className='block text-sm font-medium text-slate-200/90 mb-2'>Upload primary photo</label>
                    <input
                      type='file'
                      name='aboutPhoto'
                      accept='image/jpeg,image/png,image/svg+xml,image/webp'
                      className='block w-full text-sm text-slate-300/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/5 file:text-violet-200/80 file:ring-1 file:ring-white/10 hover:file:bg-white/10'
                    />
                    <p className='text-[11px] text-slate-400 mt-1'>Optional. Replaces existing headshot.</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-200/90 mb-2'>Upload gallery images</label>
                    <input
                      type='file'
                      name='aboutGallery'
                      accept='image/jpeg,image/png,image/svg+xml,image/webp'
                      multiple
                      className='block w-full text-sm text-slate-300/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/5 file:text-violet-200/80 file:ring-1 file:ring-white/10 hover:file:bg-white/10'
                    />
                    <p className='text-[11px] text-slate-400 mt-1'>Up to 6 images. Larger uploads will be ignored.</p>
                  </div>
                </div>
                <button
                  type='submit'
                  className='inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white hover:bg-violet-400 transition-colors'
                >
                  Save about media
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Portal Slug Section */}
        <section className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
          <div className='h-9 w-9 rounded-lg bg-white/5 text-violet-200/80 flex items-center justify-center shrink-0 ring-1 ring-white/10'>
            <Globe className='h-4 w-4' />
          </div>
          <div className='flex-1 space-y-4'>
            <div className='space-y-1'>
              <h2 className='text-sm font-semibold text-slate-50'>Portal URL Slug</h2>
              <p className='text-xs text-slate-300/80'>
                Your unique URL slug where tenants can view listings, apply, and pay rent online.
              </p>
            </div>

          <SubdomainForm currentSubdomain={landlord.subdomain} baseUrl={baseUrl} />

            {landlord.subdomain && (
              <p className='text-xs text-slate-200/90'>
                Your tenant portal:{' '}
                <a
                  href={`${baseUrl}/${landlord.subdomain}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-mono text-violet-200/80 hover:text-violet-100 transition-colors'
                >
                  {`${baseUrl}/${landlord.subdomain}`}
                </a>
              </p>
            )}
          </div>
        </section>

        {/* Custom Domain Section */}
        <section className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
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
              <div className='rounded-lg bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm hover:border-violet-400/60 transition-colors shadow-2xl drop-shadow-2xl'>
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
