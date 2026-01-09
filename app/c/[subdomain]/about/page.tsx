import { prisma } from '@/db/prisma';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star, CheckCircle2, Shield, Clock, Briefcase } from 'lucide-react';

export default async function ContractorAboutPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const contractor = await prisma.contractorProfile.findUnique({
    where: { subdomain },
  });

  if (!contractor) {
    return notFound();
  }

  const brandName = contractor.businessName;
  const aboutBio =
    contractor.aboutBio ||
    contractor.bio ||
    `Learn more about ${brandName}. We provide quality workmanship with care, transparency, and responsive service.`;
  const aboutPhoto = contractor.aboutPhoto || contractor.profilePhoto || null;
  const gallery = contractor.aboutGallery?.length ? contractor.aboutGallery : contractor.portfolioImages?.slice(0, 6) || [];

  return (
    <main className="min-h-[70vh] w-full px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-white/70">About</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white">{brandName}</h1>
          <p className="text-sm text-white/80 max-w-2xl">
            Meet your contractor, understand how we operate, and see what makes our work special.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-lg">
              <p className="whitespace-pre-line text-white leading-relaxed text-base">{aboutBio}</p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 text-center">
                <p className="text-2xl font-bold text-white">{contractor.completedJobs}</p>
                <p className="text-xs text-white/70">Jobs Completed</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-5 w-5 text-amber-400 fill-current" />
                  <p className="text-2xl font-bold text-white">{contractor.avgRating.toFixed(1)}</p>
                </div>
                <p className="text-xs text-white/70">Rating</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 text-center">
                <p className="text-2xl font-bold text-white">{contractor.yearsExperience || '5+'}</p>
                <p className="text-xs text-white/70">Years Experience</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 text-center">
                <p className="text-2xl font-bold text-white">{(contractor.onTimeRate * 100).toFixed(0)}%</p>
                <p className="text-xs text-white/70">On-Time Rate</p>
              </div>
            </div>

            {/* Credentials */}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-lg space-y-4">
              <h2 className="text-lg font-semibold text-white">Credentials & Verification</h2>
              <div className="flex flex-wrap gap-3">
                {contractor.licenseNumber && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Licensed ({contractor.licenseState})
                  </div>
                )}
                {contractor.insuranceVerified && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm">
                    <Shield className="h-4 w-4" />
                    Insured
                  </div>
                )}
                {contractor.backgroundChecked && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-200 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Background Checked
                  </div>
                )}
                {contractor.identityVerified && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Identity Verified
                  </div>
                )}
              </div>
            </div>

            {gallery.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {gallery.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative h-32 sm:h-40 rounded-xl overflow-hidden border border-white/20 bg-white/10"
                    >
                      <Image src={src} alt={`Gallery ${idx + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 flex flex-col items-center gap-4 shadow-lg">
              {aboutPhoto ? (
                <div className="relative h-40 w-40 rounded-2xl overflow-hidden border border-white/20 bg-white/5">
                  <Image src={aboutPhoto} alt={`${brandName} photo`} fill className="object-cover" />
                </div>
              ) : (
                <div className="h-32 w-32 rounded-2xl border border-dashed border-white/30 flex items-center justify-center text-white/60 text-sm">
                  <Briefcase className="h-12 w-12" />
                </div>
              )}
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-white">{brandName}</p>
                <p className="text-xs text-white/70">Professional Contractor</p>
              </div>
            </div>

            {/* Specialties */}
            {contractor.specialties.length > 0 && (
              <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-lg space-y-3">
                <h2 className="text-lg font-semibold text-white">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {contractor.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Service Areas */}
            {contractor.serviceAreas.length > 0 && (
              <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-lg space-y-3">
                <h2 className="text-lg font-semibold text-white">Service Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {contractor.serviceAreas.map((area) => (
                    <span
                      key={area}
                      className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
                {contractor.serviceRadius && (
                  <p className="text-sm text-white/70">
                    Serving within {contractor.serviceRadius} miles of {contractor.baseCity || 'base location'}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
