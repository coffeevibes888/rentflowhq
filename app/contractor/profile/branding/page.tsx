import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import {
  getOrCreateContractorProfile,
  updateContractorProfile,
  uploadContractorProfilePhoto,
  uploadContractorCoverPhoto,
  uploadContractorPortfolioImages,
} from '@/lib/actions/contractor-profile.actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Palette, 
  Camera, 
  Image as ImageIcon, 
  User, 
  MapPin, 
  Star, 
  Link2,
  Briefcase,
  Shield,
  Eye,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { ContractorSpecialtiesSelector } from '@/components/contractor/specialties-selector';
import { ContractorServiceAreasInput } from '@/components/contractor/service-areas-input';
import { ContractorPortfolioGallery } from '@/components/contractor/portfolio-gallery';

export const metadata: Metadata = {
  title: 'Branding & Profile | Contractor Dashboard',
};

export default async function ContractorBrandingPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return redirect('/sign-in');
    }

    if (session.user.role !== 'contractor') {
      return redirect('/');
    }

    const resolvedSearchParams = (await searchParams) || {};
    const errorMessage = resolvedSearchParams.error ? decodeURIComponent(resolvedSearchParams.error) : null;
    const successMessage = resolvedSearchParams.success ? decodeURIComponent(resolvedSearchParams.success) : null;

    let profileResult;
    try {
      profileResult = await getOrCreateContractorProfile();
    } catch (profileError: any) {
      console.error('Error loading contractor profile:', profileError);
      profileResult = { 
        success: false, 
        message: profileError?.message || 'Failed to load profile' 
      };
    }
    
    if (!profileResult.success || !profileResult.profile) {
      // Show a helpful error page instead of redirecting
      return (
        <main className="w-full px-4 py-8 md:px-0">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-amber-500/10 border-amber-400/30">
              <CardContent className="p-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Profile Setup Required</h1>
                <p className="text-slate-300 mb-4">
                  {profileResult.message || 'Unable to load your contractor profile. This feature may require a database migration.'}
                </p>
                <p className="text-sm text-slate-400 mb-4">
                  If you&apos;re a developer, run: <code className="bg-slate-800 px-2 py-1 rounded">npx prisma migrate dev</code>
                </p>
                <Link href="/contractor/dashboard">
                  <Button className="mt-4">Back to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      );
    }

    const profile = profileResult.profile;
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.propertyflowhq.com';
  const publicProfileUrl = `${baseUrl}/${profile.slug}`;

  const handleProfileUpdate = async (formData: FormData) => {
    'use server';
    const result = await updateContractorProfile(formData);
    if (!result.success) {
      redirect(`/contractor/profile/branding?error=${encodeURIComponent(result.message || 'Failed to update')}`);
    }
    redirect('/contractor/profile/branding?success=Profile%20updated');
  };

  const handleProfilePhotoUpload = async (formData: FormData) => {
    'use server';
    const result = await uploadContractorProfilePhoto(formData);
    if (!result.success) {
      redirect(`/contractor/profile/branding?error=${encodeURIComponent(result.message || 'Failed to upload')}`);
    }
    redirect('/contractor/profile/branding?success=Photo%20updated');
  };

  const handleCoverPhotoUpload = async (formData: FormData) => {
    'use server';
    const result = await uploadContractorCoverPhoto(formData);
    if (!result.success) {
      redirect(`/contractor/profile/branding?error=${encodeURIComponent(result.message || 'Failed to upload')}`);
    }
    redirect('/contractor/profile/branding?success=Cover%20photo%20updated');
  };

  const handlePortfolioUpload = async (formData: FormData) => {
    'use server';
    const result = await uploadContractorPortfolioImages(formData);
    if (!result.success) {
      redirect(`/contractor/profile/branding?error=${encodeURIComponent(result.message || 'Failed to upload')}`);
    }
    redirect('/contractor/profile/branding?success=Portfolio%20images%20added');
  };

  return (
    <main className="w-full px-4 py-8 md:px-0">
      <div className="max-w-6xl mx-auto space-y-8">
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Branding & Profile</h1>
          <p className="text-sm text-slate-300">
            Customize your public marketplace profile to attract more clients.
          </p>
        </div>

        {/* Public Profile Link - Featured Section */}
        <section className="rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 border-2 border-violet-400/50 p-6 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
            <Star className="h-3 w-3" />
            YOUR PUBLIC PROFILE
          </div>
          
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 ring-2 ring-white/20">
              <Link2 className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <h2 className="text-xl font-bold text-white">Your Marketplace Profile</h2>
              <p className="text-sm text-violet-100">
                This is your public profile where clients can view your work, read reviews, and request quotes. Share this link to get more business!
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-white/10 rounded-lg px-4 py-3 border border-white/20">
              <p className="text-white font-mono text-sm truncate">{publicProfileUrl}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/${profile.slug}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-violet-600 hover:bg-violet-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Link>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>

          {!profile.isPublic && (
            <div className="rounded-lg bg-amber-500/20 border border-amber-400/40 p-3">
              <p className="text-sm text-amber-100 font-medium">
                ⚠️ Your profile is currently hidden. Enable public visibility below to appear in the marketplace.
              </p>
            </div>
          )}
        </section>

        {/* Marketplace Visibility Status */}
        <section className="rounded-xl bg-slate-800/50 border border-white/10 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Marketplace Visibility</h2>
              <p className="text-sm text-slate-300">Control whether your profile appears in the contractor marketplace.</p>
            </div>
          </div>

          <div className={`rounded-lg p-4 ${profile.isPublic && profile.acceptingNewWork ? 'bg-emerald-500/20 border border-emerald-400/30' : 'bg-amber-500/20 border border-amber-400/30'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-3 w-3 rounded-full ${profile.isPublic && profile.acceptingNewWork ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`font-semibold ${profile.isPublic && profile.acceptingNewWork ? 'text-emerald-200' : 'text-amber-200'}`}>
                {profile.isPublic && profile.acceptingNewWork ? 'Visible in Marketplace' : 'Hidden from Marketplace'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={profile.isPublic ? 'text-emerald-300' : 'text-red-300'}>
                  {profile.isPublic ? '✓' : '✗'}
                </span>
                <span className="text-slate-300">Public Profile: {profile.isPublic ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={profile.acceptingNewWork ? 'text-emerald-300' : 'text-red-300'}>
                  {profile.acceptingNewWork ? '✓' : '✗'}
                </span>
                <span className="text-slate-300">Accepting New Work: {profile.acceptingNewWork ? 'Yes' : 'No'}</span>
              </div>
            </div>
            {(!profile.isPublic || !profile.acceptingNewWork) && (
              <p className="text-amber-200/80 text-sm mt-3">
                Both &quot;Public Profile&quot; and &quot;Accepting New Work&quot; must be enabled for your profile to appear in the marketplace.
              </p>
            )}
          </div>

          <form action={handleProfileUpdate} className="flex flex-wrap gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isPublic"
                value="true"
                defaultChecked={profile.isPublic}
                className="h-5 w-5 rounded border-white/20 bg-slate-900/50 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-white">Public Profile</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="acceptingNewWork"
                value="true"
                defaultChecked={profile.acceptingNewWork}
                className="h-5 w-5 rounded border-white/20 bg-slate-900/50 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-white">Accepting New Work</span>
            </label>
            <Button type="submit" className="bg-violet-500 hover:bg-violet-400">
              Update Visibility
            </Button>
          </form>
        </section>

        {/* Profile Photo Section */}
        <section className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-6 space-y-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Profile Photo</h2>
              <p className="text-sm text-slate-200">Your profile photo appears on your marketplace card and profile page.</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 rounded-full border-4 border-white/20 overflow-hidden bg-slate-900/50">
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User className="h-10 w-10 text-slate-400" />
                </div>
              )}
            </div>
            <form action={handleProfilePhotoUpload} className="flex-1 space-y-3">
              <input
                type="file"
                name="profilePhoto"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                required
              />
              <Button type="submit" className="bg-violet-500 hover:bg-violet-400">
                Upload Photo
              </Button>
            </form>
          </div>
        </section>

        {/* Cover Photo Section */}
        <section className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-6 space-y-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Cover Photo</h2>
              <p className="text-sm text-slate-200">A banner image that appears at the top of your profile page.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative h-40 rounded-lg border-2 border-dashed border-white/20 overflow-hidden bg-slate-900/50">
              {profile.coverPhoto ? (
                <img src={profile.coverPhoto} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-slate-400 text-sm">No cover photo</p>
                </div>
              )}
            </div>
            <form action={handleCoverPhotoUpload} className="flex items-center gap-3">
              <input
                type="file"
                name="coverPhoto"
                accept="image/jpeg,image/png,image/webp"
                className="block flex-1 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                required
              />
              <Button type="submit" className="bg-violet-500 hover:bg-violet-400">
                Upload Cover
              </Button>
            </form>
          </div>
        </section>

        {/* Business Info Section */}
        <section className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-6 space-y-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Business Information</h2>
              <p className="text-sm text-slate-200">Tell clients about your business and services.</p>
            </div>
          </div>

          <form action={handleProfileUpdate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Business Name</label>
              <Input
                name="businessName"
                defaultValue={profile.businessName}
                className="bg-slate-900/50 border-white/20 text-white"
                placeholder="Your Business Name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Display Name</label>
              <Input
                name="displayName"
                defaultValue={profile.displayName}
                className="bg-slate-900/50 border-white/20 text-white"
                placeholder="How you want to be called"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-white">Tagline</label>
              <Input
                name="tagline"
                defaultValue={profile.tagline || ''}
                className="bg-slate-900/50 border-white/20 text-white"
                placeholder="Licensed Plumber - 15 Years Experience"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Email</label>
              <Input
                name="email"
                type="email"
                defaultValue={profile.email}
                className="bg-slate-900/50 border-white/20 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Phone</label>
              <Input
                name="phone"
                defaultValue={profile.phone || ''}
                className="bg-slate-900/50 border-white/20 text-white"
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Website</label>
              <Input
                name="website"
                defaultValue={profile.website || ''}
                className="bg-slate-900/50 border-white/20 text-white"
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Years of Experience</label>
              <Input
                name="yearsExperience"
                type="number"
                defaultValue={profile.yearsExperience || ''}
                className="bg-slate-900/50 border-white/20 text-white"
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-white">Bio</label>
              <Textarea
                name="bio"
                defaultValue={profile.bio || ''}
                className="bg-slate-900/50 border-white/20 text-white min-h-[120px]"
                placeholder="Tell clients about your experience, specialties, and what makes you different..."
                maxLength={2000}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="bg-violet-500 hover:bg-violet-400">
                Save Business Info
              </Button>
            </div>
          </form>
        </section>

        {/* Location & Service Area */}
        <section className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-6 space-y-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Location & Service Area</h2>
              <p className="text-sm text-slate-200">Where you're based and areas you serve.</p>
            </div>
          </div>

          <form action={handleProfileUpdate} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">City</label>
              <Input
                name="baseCity"
                defaultValue={profile.baseCity || ''}
                className="bg-slate-900/50 border-white/20 text-white"
                placeholder="Las Vegas"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">State</label>
              <Input
                name="baseState"
                defaultValue={profile.baseState || ''}
                className="bg-slate-900/50 border-white/20 text-white"
                placeholder="NV"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Service Radius (miles)</label>
              <Input
                name="serviceRadius"
                type="number"
                defaultValue={profile.serviceRadius || ''}
                className="bg-slate-900/50 border-white/20 text-white"
                min={0}
                max={500}
                placeholder="25"
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" className="bg-violet-500 hover:bg-violet-400">
                Save Location
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-white/10">
            <ContractorServiceAreasInput 
              currentAreas={profile.serviceAreas || []} 
            />
          </div>
        </section>

        {/* Specialties */}
        <section className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-6 space-y-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Palette className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Specialties</h2>
              <p className="text-sm text-slate-200">Select the services you offer.</p>
            </div>
          </div>

          <ContractorSpecialtiesSelector 
            currentSpecialties={profile.specialties || []} 
          />
        </section>

        {/* Credentials */}
        <section className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-6 space-y-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Credentials & Verification</h2>
              <p className="text-sm text-slate-200">Add your license and insurance info to build trust.</p>
            </div>
          </div>

          <form action={handleProfileUpdate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">License Number</label>
              <Input
                name="licenseNumber"
                defaultValue={profile.licenseNumber || ''}
                className="bg-slate-900/50 border-white/20 text-white"
                placeholder="Enter your license number"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">License State</label>
              <Input
                name="licenseState"
                defaultValue={profile.licenseState || ''}
                className="bg-slate-900/50 border-white/20 text-white"
                placeholder="NV"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${profile.insuranceVerified ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-slate-900/50 text-slate-400 border border-white/10'}`}>
                {profile.insuranceVerified ? '✓ Insurance Verified' : '○ Insurance Not Verified'}
              </div>
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${profile.backgroundChecked ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-slate-900/50 text-slate-400 border border-white/10'}`}>
                {profile.backgroundChecked ? '✓ Background Checked' : '○ Background Not Checked'}
              </div>
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${profile.identityVerified ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30' : 'bg-slate-900/50 text-slate-400 border border-white/10'}`}>
                {profile.identityVerified ? '✓ Identity Verified' : '○ Identity Not Verified'}
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="bg-violet-500 hover:bg-violet-400">
                Save Credentials
              </Button>
            </div>
          </form>
        </section>

        {/* Portfolio Gallery */}
        <section className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-6 space-y-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Portfolio Gallery</h2>
              <p className="text-sm text-slate-200">Showcase your best work to attract clients. Up to 12 images.</p>
            </div>
          </div>

          <ContractorPortfolioGallery 
            images={profile.portfolioImages || []} 
          />

          <form action={handlePortfolioUpload} className="flex items-center gap-3 pt-4 border-t border-white/10">
            <input
              type="file"
              name="portfolioImages"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="block flex-1 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
              required
            />
            <Button type="submit" className="bg-violet-500 hover:bg-violet-400">
              Add Images
            </Button>
          </form>
        </section>

        {/* Why Choose Me - Feature Cards */}
        <section className="rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 border-2 border-violet-400/50 p-6 space-y-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Star className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Why Choose Me? Cards</h2>
              <p className="text-sm text-slate-200">Customize the 6 feature cards that appear on your public profile page. Tell clients why they should hire you!</p>
            </div>
          </div>

          <form action={handleProfileUpdate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-3">
                <p className="text-sm font-medium text-violet-200">Card 1</p>
                <Input
                  name="featureCard1Title"
                  defaultValue={profile.featureCard1Title || 'Quality Workmanship'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Title"
                />
                <Textarea
                  name="featureCard1Description"
                  defaultValue={profile.featureCard1Description || 'Professional results backed by years of experience.'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Description"
                  rows={2}
                />
              </div>
              {/* Card 2 */}
              <div className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-3">
                <p className="text-sm font-medium text-violet-200">Card 2</p>
                <Input
                  name="featureCard2Title"
                  defaultValue={profile.featureCard2Title || 'Transparent Pricing'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Title"
                />
                <Textarea
                  name="featureCard2Description"
                  defaultValue={profile.featureCard2Description || 'Upfront quotes with no hidden fees.'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Description"
                  rows={2}
                />
              </div>
              {/* Card 3 */}
              <div className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-3">
                <p className="text-sm font-medium text-violet-200">Card 3</p>
                <Input
                  name="featureCard3Title"
                  defaultValue={profile.featureCard3Title || 'Licensed & Insured'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Title"
                />
                <Textarea
                  name="featureCard3Description"
                  defaultValue={profile.featureCard3Description || 'Fully licensed and insured for your protection.'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Description"
                  rows={2}
                />
              </div>
              {/* Card 4 */}
              <div className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-3">
                <p className="text-sm font-medium text-violet-200">Card 4</p>
                <Input
                  name="featureCard4Title"
                  defaultValue={profile.featureCard4Title || 'On-Time Service'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Title"
                />
                <Textarea
                  name="featureCard4Description"
                  defaultValue={profile.featureCard4Description || 'Punctual and reliable. We show up when promised.'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Description"
                  rows={2}
                />
              </div>
              {/* Card 5 */}
              <div className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-3">
                <p className="text-sm font-medium text-violet-200">Card 5</p>
                <Input
                  name="featureCard5Title"
                  defaultValue={profile.featureCard5Title || 'Easy Communication'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Title"
                />
                <Textarea
                  name="featureCard5Description"
                  defaultValue={profile.featureCard5Description || 'Quick responses and clear updates throughout.'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Description"
                  rows={2}
                />
              </div>
              {/* Card 6 */}
              <div className="rounded-lg border border-white/20 bg-white/5 p-4 space-y-3">
                <p className="text-sm font-medium text-violet-200">Card 6</p>
                <Input
                  name="featureCard6Title"
                  defaultValue={profile.featureCard6Title || 'Professional Service'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Title"
                />
                <Textarea
                  name="featureCard6Description"
                  defaultValue={profile.featureCard6Description || 'Clean, courteous, and professional from start to finish.'}
                  className="bg-slate-900/50 border-white/20 text-white"
                  placeholder="Description"
                  rows={2}
                />
              </div>
            </div>
            <Button type="submit" className="bg-violet-500 hover:bg-violet-400">
              Save Feature Cards
            </Button>
          </form>
        </section>

        {/* Subdomain Settings */}
        <section className="rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 border-2 border-emerald-400/50 p-6 space-y-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Custom Branded Page (Optional)</h2>
              <p className="text-sm text-slate-200">
                Create a custom branded landing page separate from your marketplace profile. 
                Great for sharing on business cards or marketing materials.
              </p>
            </div>
          </div>

          <form action={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Custom URL</label>
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-sm">propertyflowhq.com/c/</span>
                <Input
                  name="subdomain"
                  defaultValue={profile.subdomain || ''}
                  className="bg-slate-900/50 border-white/20 text-white flex-1"
                  placeholder="your-business-name"
                  pattern="[a-z0-9-]+"
                />
              </div>
              <p className="text-xs text-white/60">Lowercase letters, numbers, and hyphens only</p>
            </div>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-400">
              Save Custom URL
            </Button>
          </form>

          {profile.subdomain && (
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-white mb-2">Your custom branded page is live at:</p>
              <a 
                href={`${baseUrl}/c/${profile.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-200 hover:text-emerald-100 underline"
              >
                {baseUrl}/c/{profile.subdomain}
              </a>
            </div>
          )}
        </section>

        {/* Pricing */}
        <section className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-6 space-y-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Star className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Pricing & Availability</h2>
              <p className="text-sm text-slate-200">Set your rates and availability status.</p>
            </div>
          </div>

          <form action={handleProfileUpdate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Hourly Rate ($)</label>
              <Input
                name="hourlyRate"
                type="number"
                defaultValue={profile.hourlyRate ? Number(profile.hourlyRate) : ''}
                className="bg-slate-900/50 border-white/20 text-white"
                min={0}
                step={0.01}
                placeholder="75.00"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Minimum Job Size ($)</label>
              <Input
                name="minimumJobSize"
                type="number"
                defaultValue={profile.minimumJobSize ? Number(profile.minimumJobSize) : ''}
                className="bg-slate-900/50 border-white/20 text-white"
                min={0}
                step={0.01}
                placeholder="100.00"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-white">Availability Notes</label>
              <Textarea
                name="availabilityNotes"
                defaultValue={profile.availabilityNotes || ''}
                className="bg-slate-900/50 border-white/20 text-white"
                placeholder="e.g., Available weekdays 8am-6pm, emergency calls accepted"
                maxLength={500}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="bg-violet-500 hover:bg-violet-400">
                Save Pricing
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
  } catch (error: any) {
    console.error('ContractorBrandingPage error:', error);
    return (
      <main className="w-full px-4 py-8 md:px-0">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-red-500/10 border-red-400/30">
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
              <p className="text-slate-300 mb-4">
                {error?.message || 'An unexpected error occurred while loading the profile page.'}
              </p>
              <Link href="/contractor/dashboard">
                <Button className="mt-4">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }
}
