import { prisma } from '@/db/prisma';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default async function SubdomainAboutPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
  });

  if (!landlord) {
    return notFound();
  }

  const brandName = landlord.companyName || landlord.name;
  const aboutBio =
    landlord.aboutBio ||
    `Learn more about ${brandName}. We manage quality homes with care, transparency, and responsive service.`;
  const aboutPhoto = landlord.aboutPhoto || landlord.logoUrl || null;
  const gallery = landlord.aboutGallery || [];

  return (
    <main className="min-h-[70vh] w-full px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-white/70">About</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white">{brandName}</h1>
          <p className="text-sm text-white/80 max-w-2xl">
            Meet your property management team, understand how we operate, and see what makes our homes special.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-6 shadow-lg">
              <p className="whitespace-pre-line text-white leading-relaxed text-base">{aboutBio}</p>
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
                  Add a primary photo
                </div>
              )}
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-white">{brandName}</p>
                <p className="text-xs text-white/70">Property Management</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
