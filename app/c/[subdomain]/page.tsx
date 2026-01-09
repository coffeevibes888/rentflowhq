import { prisma } from '@/db/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ContractorSubdomainHero from '@/components/contractor-subdomain/contractor-hero';
import { ContractorQuoteButton } from '@/components/contractor/quote-button';
import {
  Zap,
  Shield,
  Clock,
  DollarSign,
  Smartphone,
  Briefcase,
  Star,
  CheckCircle2,
  ArrowRight,
  MapPin,
  User,
} from 'lucide-react';

// Icon mapping for feature cards
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  'dollar-sign': DollarSign,
  shield: Shield,
  clock: Clock,
  smartphone: Smartphone,
  briefcase: Briefcase,
  star: Star,
  'check-circle': CheckCircle2,
  'map-pin': MapPin,
  user: User,
};

const iconColors: Record<string, string> = {
  zap: 'bg-violet-500/20 border-violet-400/30 text-violet-300',
  'dollar-sign': 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300',
  shield: 'bg-blue-500/20 border-blue-400/30 text-blue-300',
  clock: 'bg-amber-500/20 border-amber-400/30 text-amber-300',
  smartphone: 'bg-purple-500/20 border-purple-400/30 text-purple-300',
  briefcase: 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300',
  star: 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300',
  'check-circle': 'bg-green-500/20 border-green-400/30 text-green-300',
  'map-pin': 'bg-rose-500/20 border-rose-400/30 text-rose-300',
  user: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300',
};


export default async function ContractorSubdomainPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const contractor = await prisma.contractorProfile.findUnique({
    where: { subdomain },
    include: {
      reviews: {
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          reviewer: {
            select: { name: true, image: true },
          },
        },
      },
    },
  });

  if (!contractor) {
    notFound();
  }

  const brandName = contractor.businessName;
  const heroImages = contractor.heroImages?.length 
    ? contractor.heroImages 
    : contractor.portfolioImages?.slice(0, 3) || [];

  // Build feature cards from contractor's custom content or defaults
  const featureCards = [
    {
      icon: contractor.featureCard1Icon || 'zap',
      title: contractor.featureCard1Title || 'Quality Workmanship',
      description: contractor.featureCard1Description || 'Professional results backed by years of experience. Every job done right the first time.',
    },
    {
      icon: contractor.featureCard2Icon || 'dollar-sign',
      title: contractor.featureCard2Title || 'Transparent Pricing',
      description: contractor.featureCard2Description || 'Upfront quotes with no hidden fees. Know exactly what you\'re paying before work begins.',
    },
    {
      icon: contractor.featureCard3Icon || 'shield',
      title: contractor.featureCard3Title || 'Licensed & Insured',
      description: contractor.featureCard3Description || 'Fully licensed and insured for your protection and peace of mind.',
    },
    {
      icon: contractor.featureCard4Icon || 'clock',
      title: contractor.featureCard4Title || 'On-Time Service',
      description: contractor.featureCard4Description || 'Punctual and reliable. We respect your time and show up when promised.',
    },
    {
      icon: contractor.featureCard5Icon || 'smartphone',
      title: contractor.featureCard5Title || 'Easy Communication',
      description: contractor.featureCard5Description || 'Quick responses and clear updates throughout your project.',
    },
    {
      icon: contractor.featureCard6Icon || 'briefcase',
      title: contractor.featureCard6Title || 'Professional Service',
      description: contractor.featureCard6Description || 'Clean, courteous, and professional from start to finish.',
    },
  ];

  return (
    <main className="flex-1 w-full">
      {/* Hero Section */}
      <ContractorSubdomainHero
        brandName={brandName}
        tagline={contractor.tagline}
        brandEmail={contractor.email}
        brandPhone={contractor.phone}
        baseCity={contractor.baseCity}
        baseState={contractor.baseState}
        heroMedia={heroImages}
        subdomain={subdomain}
        slug={contractor.slug}
        specialties={contractor.specialties}
      />

      {/* Services Section */}
      {contractor.specialties.length > 0 && (
        <section id="services" className="w-full py-14 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Services Offered
              </h2>
              <p className="text-lg text-slate-700">
                Professional services tailored to your needs
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {contractor.specialties.map((specialty) => (
                <div
                  key={specialty}
                  className="px-5 py-3 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-800 font-medium shadow-sm hover:shadow-md transition-shadow"
                >
                  {specialty}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Portfolio Section */}
      {contractor.portfolioImages.length > 0 && (
        <section className="w-full py-12 px-4 bg-slate-900/40">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
                Our Work
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {contractor.portfolioImages.slice(0, 8).map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                    <Image
                      src={url}
                      alt={`Portfolio ${idx + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Section */}
      <section className="w-full py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Why Choose {brandName}?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featureCards.map((card, idx) => {
              const IconComponent = iconMap[card.icon] || Briefcase;
              const colorClass = iconColors[card.icon] || iconColors.briefcase;
              
              return (
                <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center border ${colorClass}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                  <p className="text-sm text-slate-300/80">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {contractor.reviews.length > 0 && (
        <section className="w-full py-12 px-4 bg-slate-900/40">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Customer Reviews
                </h2>
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-amber-400 fill-current" />
                  <span className="text-2xl font-bold text-white">{contractor.avgRating.toFixed(1)}</span>
                  <span className="text-slate-400">({contractor.totalReviews} reviews)</span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contractor.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                        {review.reviewer?.image ? (
                          <Image src={review.reviewer.image} alt="" width={40} height={40} className="object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{review.reviewer?.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= review.overallRating ? 'text-amber-400 fill-current' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.title && <p className="font-medium text-white">{review.title}</p>}
                    <p className="text-sm text-slate-300 line-clamp-3">{review.content}</p>
                    {review.isVerified && (
                      <div className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified Job
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="w-full py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-200/90 mb-8">
              Request a free quote today. No obligation, fast response.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-full max-w-xs">
                <ContractorQuoteButton
                  contractorSlug={contractor.slug}
                  contractorName={brandName}
                />
              </div>
              <Link
                href={`/c/${subdomain}/contact`}
                className="inline-flex items-center justify-center rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
