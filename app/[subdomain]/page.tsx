import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import SubdomainHero from '@/components/subdomain/subdomain-hero';
import ContractorSubdomainHero from '@/components/contractor-subdomain/contractor-hero';
import { ContractorMessageWidget } from '@/components/contractor-subdomain/contractor-message-widget';
import { ContractorQuoteButton } from '@/components/contractor/quote-button';
import { ContractorStats } from '@/components/contractor-subdomain/contractor-stats';
import { ServiceAreaBadge } from '@/components/contractor-subdomain/service-area-badge';
import { QuickActions } from '@/components/contractor-subdomain/quick-actions';
import { TrustBadges } from '@/components/contractor-subdomain/trust-badges';
import { detectSubdomainEntity, getContractorSubdomainPath } from '@/lib/utils/subdomain-detection';
import {
  CheckCircle2,
  CreditCard,
  Smartphone,
  Building2,
  Zap,
  Shield,
  Clock,
  DollarSign,
  ArrowRight,
  Briefcase,
  Star,
  MapPin,
  User,
  Calendar,
  Bed,
  Bath,
  Square,
  Phone,
  Mail,
  Home,
} from 'lucide-react';

// Icon mapping for contractor feature cards
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

/**
 * Unified subdomain page that handles landlords, agents, and contractors
 * Detects entity type and renders appropriate content with same visual styling
 */
export default async function SubdomainRootPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  
  // Detect whether this subdomain belongs to a landlord, agent, or contractor
  const entity = await detectSubdomainEntity(subdomain);
  
  if (entity.type === 'not_found') {
    notFound();
  }

  // Render landlord page
  if (entity.type === 'landlord') {
    return <LandlordSubdomainPage landlord={entity.data} subdomain={subdomain} />;
  }

  // Render agent page
  if (entity.type === 'agent') {
    return <AgentSubdomainPage agent={entity.data} subdomain={subdomain} />;
  }

  // Render contractor page
  return <ContractorSubdomainPage contractorData={entity.data} subdomain={subdomain} />;
}


// ============================================================================
// LANDLORD SUBDOMAIN PAGE
// ============================================================================

async function LandlordSubdomainPage({ 
  landlord, 
  subdomain 
}: { 
  landlord: any; 
  subdomain: string;
}) {
  const session = await auth();

  // Note: We allow landlords to view their own portal (for preview purposes)
  // Only redirect tenants who already have an active lease with this landlord
  if (session?.user?.id && session.user.role === 'tenant') {
    const tenantLease = await prisma.lease.findFirst({
      where: {
        tenantId: session.user.id,
        status: 'active',
        unit: {
          property: {
            landlordId: landlord.id,
          },
        },
      },
    }).catch(() => null);

    if (tenantLease) {
      redirect('/user/dashboard');
    }
  }

  // Get available properties (excluding deleted ones)
  const properties = await prisma.property.findMany({
    where: {
      landlordId: landlord.id,
      status: { not: 'deleted' },
      units: {
        some: {
          isAvailable: true,
        },
      },
    },
    include: {
      units: {
        where: { isAvailable: true },
        take: 3,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const brandName = landlord.companyName || landlord.name;
  const brandEmail = landlord.companyEmail || landlord.owner?.email;
  const brandPhone = landlord.companyPhone || landlord.owner?.phoneNumber;
  const brandAddress = landlord.companyAddress;
  const heroImages = landlord.heroImages || [];
  const heroMedia = heroImages.length
    ? heroImages
    : properties.flatMap((property) => property.units.flatMap((u: any) => u.images || [])).slice(0, 3);

  return (
    <main className="flex-1 w-full">
      {/* Hero Section - Conversion Focused */}
      <SubdomainHero
        brandName={brandName}
        brandEmail={brandEmail}
        brandPhone={brandPhone}
        brandAddress={brandAddress}
        heroMedia={heroMedia}
        subdomain={subdomain}
      />

      {/* Property Listings Section */}
      <section id="properties" className="w-full py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Available Properties
              </h2>
              <Link
                href={`/${subdomain}/sign-in`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-all hover:scale-105 shadow-lg"
              >
                Apply Now
              </Link>
            </div>
            <p className="text-lg text-slate-700">
              Browse our available units and find your perfect home
            </p>
          </div>

          {properties.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm px-4 py-12 text-center shadow-lg">
              <p className="text-slate-700 mb-4">No properties are currently available.</p>
              <p className="text-sm text-slate-500">
                Please check back soon or contact us for more information.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} subdomain={subdomain} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Payment Methods Section */}
      <section className="w-full py-12 px-4 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              Pay Rent Your Way
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <PaymentMethod icon={CreditCard} title="Credit/Debit Card" desc="Instant payments" color="violet" />
              <PaymentMethod icon={Smartphone} title="Venmo" desc="Send from your phone" color="emerald" />
              <PaymentMethod icon={Smartphone} title="CashApp" desc="Quick & easy" color="cyan" />
              <PaymentMethod icon={Building2} title="Bank Transfer" desc="Automatic payments" color="blue" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Why Choose {landlord.name}?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard icon={Zap} title="Fast Application Process" desc="Apply online in minutes. No paperwork, no hassle. Get approved quickly and move in faster." color="violet" />
            <FeatureCard icon={DollarSign} title="No Application Fees" desc="Apply completely free. No hidden costs, no surprises. What you see is what you get." color="emerald" />
            <FeatureCard icon={Shield} title="Secure Online Payments" desc="Pay rent securely online. Set up automatic payments and never worry about late fees." color="blue" />
            <FeatureCard icon={Clock} title="24/7 Maintenance" desc="Submit maintenance requests anytime, day or night. Track status and get updates in real-time." color="amber" />
            <FeatureCard icon={Smartphone} title="Mobile-Friendly Portal" desc="Access everything from your phone. Pay rent, submit requests, view documents - all in one app." color="purple" />
            <FeatureCard icon={Building2} title="Professional Management" desc="Experienced property management team dedicated to making your rental experience smooth and stress-free." color="cyan" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Find Your New Home?
            </h2>
            <p className="text-lg text-slate-200/90 mb-8">
              Apply online in minutes. No application fees. Get approved and move in faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/${subdomain}/sign-in`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-violet-600 hover:bg-violet-50 transition-all hover:scale-105 shadow-lg"
              >
                Start Your Application
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={`/${subdomain}/sign-in`}
                className="inline-flex items-center justify-center rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                Already Applied? Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


// ============================================================================
// CONTRACTOR SUBDOMAIN PAGE
// ============================================================================

async function ContractorSubdomainPage({ 
  contractorData, 
  subdomain 
}: { 
  contractorData: any; 
  subdomain: string;
}) {
  // Use contractorData directly - reviews relation not available in schema
  const contractor = contractorData;
  
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

  // Use root path for unified routing
  const basePath = `/${subdomain}`;

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
        contractorId={contractor.id}
        contractorImage={contractor.profilePhoto}
        isAvailable={contractor.isAvailable ?? true}
        avgRating={contractor.avgRating}
        totalReviews={contractor.totalReviews}
      />

      {/* Floating Message Widget */}
      <ContractorMessageWidget
        contractorId={contractor.id}
        contractorName={brandName}
        contractorImage={contractor.profilePhoto}
        contractorEmail={contractor.email}
        contractorPhone={contractor.phone}
        subdomain={subdomain}
        isAvailable={contractor.isAvailable ?? true}
        responseTime="Usually responds within 2 hours"
      />

      {/* Service Area Badge */}
      <div className="w-full py-6 px-4">
        <div className="max-w-6xl mx-auto flex justify-center">
          <ServiceAreaBadge
            baseCity={contractor.baseCity}
            baseState={contractor.baseState}
            serviceRadius={contractor.serviceRadius}
            serviceAreas={contractor.serviceAreas}
          />
        </div>
      </div>

      {/* Stats Section */}
      {(contractor.totalReviews > 0 || contractor.completedJobs > 0) && (
        <ContractorStats
          avgRating={contractor.avgRating}
          totalReviews={contractor.totalReviews}
          completedJobs={contractor.completedJobs}
          responseRate={contractor.responseRate}
          onTimeRate={contractor.onTimeRate}
          yearsExperience={contractor.yearsExperience}
        />
      )}

      {/* Reviews Section - Moved Higher */}
      {/* {contractor.reviews.length > 0 && (
        <section className="w-full py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Customer Reviews
                </h2>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/30">
                  <Star className="h-5 w-5 text-amber-400 fill-current" />
                  <span className="text-xl font-bold text-white">{contractor.avgRating.toFixed(1)}</span>
                  <span className="text-slate-400">({contractor.totalReviews})</span>
                </div>
              </div>
              <p className="text-lg text-slate-300">
                See what our customers are saying
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contractor.reviews.map((review: any) => (
                <div key={review.id} className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-6 space-y-4 hover:border-violet-400/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                        {review.reviewer?.image ? (
                          <Image src={review.reviewer.image} alt="" width={48} height={48} className="object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{review.reviewer?.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.overallRating ? 'text-amber-400 fill-current' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.isVerified && (
                      <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </div>
                    )}
                  </div>
                  {review.title && <p className="font-semibold text-white text-lg">{review.title}</p>}
                  <p className="text-sm text-slate-300 leading-relaxed">{review.content}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )} */}

      {/* Booking Section */}
      <section id="booking" className="w-full py-16 px-4 bg-slate-900/40">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Schedule Your Appointment
              </h2>
              <p className="text-lg text-slate-300">
                Book a time that works for you. Fast, easy, and convenient.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Choose Date & Time</h3>
                <p className="text-sm text-slate-400">Pick a slot that fits your schedule</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Instant Confirmation</h3>
                <p className="text-sm text-slate-400">Get confirmed immediately</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Flexible Rescheduling</h3>
                <p className="text-sm text-slate-400">Change anytime if needed</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${subdomain}/schedule`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-violet-500/25 transition-all"
              >
                <Calendar className="h-5 w-5" />
                Book Now
              </Link>
              <div className="sm:w-auto">
                <ContractorQuoteButton
                  contractorSlug={contractor.slug}
                  contractorName={brandName}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges
        insuranceVerified={contractor.insuranceVerified}
        backgroundChecked={contractor.backgroundChecked}
        identityVerified={contractor.identityVerified}
        licenseNumber={contractor.licenseNumber}
        licenseState={contractor.licenseState}
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
              {contractor.specialties.map((specialty: string) => (
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
        <section className="w-full py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Our Work
              </h2>
              <p className="text-lg text-slate-300">
                Quality craftsmanship you can see
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {contractor.portfolioImages.slice(0, 8).map((url: string, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                  <Image
                    src={url}
                    alt={`Portfolio ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
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
      {/* {contractor.reviews.length > 0 && (
        <section className="w-full py-12 px-4 bg-slate-900/40">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 md:p-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  More Reviews
                </h2>
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-amber-400 fill-current" />
                  <span className="text-2xl font-bold text-white">{contractor.avgRating.toFixed(1)}</span>
                  <span className="text-slate-400">({contractor.totalReviews} total)</span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contractor.reviews.slice(6).map((review: any) => (
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
                href={`${basePath}/contact`}
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


// ============================================================================
// AGENT SUBDOMAIN PAGE
// ============================================================================

async function AgentSubdomainPage({ 
  agent, 
  subdomain 
}: { 
  agent: any; 
  subdomain: string;
}) {
  const session = await auth();

  // Get agent's active listings with open houses
  const listings = await prisma.agentListing.findMany({
    where: {
      agentId: agent.id,
      status: 'active',
    },
    include: {
      openHouses: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        orderBy: { date: 'asc' },
        take: 1,
      },
    },
    orderBy: { isFeatured: 'desc' },
    take: 6,
  });

  // Get upcoming open houses for all listings
  const upcomingOpenHouses = await prisma.agentOpenHouse.findMany({
    where: {
      agentId: agent.id,
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          images: true,
          address: true,
        },
      },
    },
    orderBy: { date: 'asc' },
    take: 3,
  });

  const brandName = agent.companyName || agent.name;
  const heroImages = agent.heroImages?.length ? agent.heroImages : listings.flatMap((l: any) => l.images || []).slice(0, 3);
  const themeColor = agent.themeColor || 'amber';

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative h-[500px] w-full overflow-hidden">
        {heroImages.length > 0 ? (
          <div className="absolute inset-0 grid grid-cols-3 gap-1">
            {heroImages.slice(0, 3).map((img: string, idx: number) => (
              <div key={idx} className="relative">
                <Image src={img} alt={`Hero ${idx + 1}`} fill className="object-cover" priority={idx === 0} />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {agent.logoUrl && (
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                <Image src={agent.logoUrl} alt={brandName} fill className="object-contain p-2" />
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              {brandName}
            </h1>
            {agent.brokerage && (
              <p className="text-xl text-white/90">{agent.brokerage}</p>
            )}
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {agent.aboutBio?.slice(0, 150) || `Helping you find your perfect home in ${agent.serviceAreas?.join(', ') || 'your area'}`}
            </p>
            
            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-6 mt-6">
              {agent.yearsExperience && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{agent.yearsExperience}+</p>
                  <p className="text-sm text-white/70">Years Experience</p>
                </div>
              )}
              {agent.totalSales > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{agent.totalSales}</p>
                  <p className="text-sm text-white/70">Homes Sold</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{agent.totalListings || listings.length}</p>
                <p className="text-sm text-white/70">Active Listings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Info Bar */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-200">
                {agent.user?.image ? (
                  <Image src={agent.user.image} alt={agent.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-300">
                    <User className="h-8 w-8 text-slate-500" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{agent.name}</h2>
                {agent.licenseNumber && (
                  <p className="text-sm text-slate-500">Lic # {agent.licenseNumber}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {agent.companyPhone && (
                <a 
                  href={`tel:${agent.companyPhone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </a>
              )}
              {agent.user?.email && (
                <a 
                  href={`mailto:${agent.user.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Open Houses Section */}
      {upcomingOpenHouses.length > 0 && (
        <section className="bg-amber-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-amber-600" />
              Upcoming Open Houses
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {upcomingOpenHouses.map((oh: any) => {
                const address = oh.listing.address as any;
                return (
                  <Link
                    key={oh.id}
                    href={`/listings/${oh.listing.id}`}
                    className="bg-white rounded-xl border border-amber-200 p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-center bg-amber-100 rounded-lg p-2 min-w-[60px]">
                        <p className="text-xs text-amber-600 font-semibold uppercase">
                          {new Date(oh.date).toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                        <p className="text-xl font-bold text-amber-700">
                          {new Date(oh.date).getDate()}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 line-clamp-1">{oh.listing.title}</p>
                        <p className="text-sm text-slate-500">{address?.city}, {address?.state}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">
                      {oh.startTime} - {oh.endTime}
                    </p>
                    {oh.isVirtual && (
                      <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Virtual Available
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Listings */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Featured Listings</h2>
            <Link href={`/${subdomain}/listings`} className="text-amber-600 font-medium hover:underline">
              View All Listings →
            </Link>
          </div>
          
          {listings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing: any) => (
                <AgentListingCard key={listing.id} listing={listing} subdomain={subdomain} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Home className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">No Active Listings</h3>
              <p className="text-slate-500 mt-1">Check back soon for new properties</p>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      {(agent.aboutBio || agent.aboutPhoto) && (
        <section className="py-12 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {agent.aboutPhoto && (
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
                  <Image src={agent.aboutPhoto} alt={agent.name} fill className="object-cover" />
                </div>
              )}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">About {agent.name}</h2>
                {agent.aboutBio && (
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">{agent.aboutBio}</p>
                )}
                
                {/* Specializations */}
                {agent.specializations?.length > 0 && (
                  <div className="pt-4">
                    <h3 className="font-semibold text-slate-900 mb-2">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {agent.specializations.map((spec: string) => (
                        <span key={spec} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Areas */}
                {agent.serviceAreas?.length > 0 && (
                  <div className="pt-2">
                    <h3 className="font-semibold text-slate-900 mb-2">Service Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {agent.serviceAreas.map((area: string) => (
                        <span key={area} className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-sm">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {agent.languages?.length > 0 && (
                  <div className="pt-2">
                    <h3 className="font-semibold text-slate-900 mb-2">Languages</h3>
                    <p className="text-slate-600">{agent.languages.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Find Your Dream Home?</h2>
            <p className="text-lg mb-8 opacity-90">
              Let {agent.name} help you navigate the real estate market
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {agent.companyPhone && (
                <a 
                  href={`tel:${agent.companyPhone}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-amber-600 rounded-full font-bold hover:bg-amber-50 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Call {agent.companyPhone}
                </a>
              )}
              {agent.user?.email && (
                <a 
                  href={`mailto:${agent.user.email}`}
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-full font-bold hover:bg-white/10 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  Send Email
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Agent Listing Card Component
function AgentListingCard({ listing, subdomain }: { listing: any; subdomain: string }) {
  const address = listing.address as any;
  const hasOpenHouse = listing.openHouses?.length > 0;
  
  return (
    <Link 
      href={`/${subdomain}/listings/${listing.id}`}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all"
    >
      <div className="relative aspect-[4/3]">
        {listing.images?.[0] ? (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Home className="h-12 w-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-amber-600 text-white">
            For {listing.listingType === 'sale' ? 'Sale' : 'Rent'}
          </Badge>
          {hasOpenHouse && (
            <Badge className="bg-emerald-600 text-white">
              <Calendar className="h-3 w-3 mr-1" />
              Open House
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-2xl font-bold text-white">
            {formatCurrency(Number(listing.price))}
            {listing.listingType === 'rent' && <span className="text-sm font-normal">/mo</span>}
          </p>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-slate-900 line-clamp-1">{listing.title}</h3>
        <p className="text-sm text-slate-500">
          {address?.city}, {address?.state} {address?.zip}
        </p>
        <div className="flex items-center gap-4 text-sm text-slate-600 pt-2">
          {listing.bedrooms !== null && (
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {listing.bedrooms} bd
            </span>
          )}
          {listing.bathrooms !== null && (
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {Number(listing.bathrooms)} ba
            </span>
          )}
          {listing.sizeSqFt && (
            <span className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              {listing.sizeSqFt.toLocaleString()} sqft
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}


// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function PropertyCard({ property, subdomain }: { property: any; subdomain: string }) {
  const unitCount = property.units.length;
  const firstUnit = property.units[0];
  const propertyImage = property.units.find((u: any) => u.images?.length > 0)?.images?.[0] || null;
  const isApartmentComplex = property.type === 'apartment' && unitCount > 3;
  
  const minRent = isApartmentComplex 
    ? Math.min(...property.units.map((u: any) => Number(u.rentAmount) || 0).filter((r: number) => r > 0))
    : null;
  const maxRent = isApartmentComplex
    ? Math.max(...property.units.map((u: any) => Number(u.rentAmount) || 0))
    : null;
  const bedRange = isApartmentComplex
    ? {
        min: Math.min(...property.units.map((u: any) => u.bedrooms || 0)),
        max: Math.max(...property.units.map((u: any) => u.bedrooms || 0))
      }
    : null;
  
  return (
    <Link
      href={`/${subdomain}/properties/${property.slug}`}
      className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col hover:border-violet-400 transition-all hover:scale-[1.02]"
    >
      <div className="relative h-56 w-full bg-slate-100">
        {propertyImage ? (
          <Image src={propertyImage} alt={property.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
            <Building2 className="h-16 w-16" />
          </div>
        )}
        {isApartmentComplex && (
          <div className="absolute top-3 left-3 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Apartment Community
          </div>
        )}
      </div>
      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div>
          <h3 className="font-bold text-slate-900 text-xl mb-2">{property.name}</h3>
          {property.address && 
           typeof property.address === 'object' && 
           !Array.isArray(property.address) &&
           'street' in property.address && (
            <p className="text-sm text-slate-600">
              {String((property.address as { street?: string }).street || '')}
            </p>
          )}
        </div>
        
        {isApartmentComplex ? (
          <>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              {bedRange && (
                <span>
                  {bedRange.min === bedRange.max 
                    ? (bedRange.min === 0 ? 'Studio' : `${bedRange.min} bed${bedRange.min !== 1 ? 's' : ''}`)
                    : `${bedRange.min === 0 ? 'Studio' : bedRange.min} - ${bedRange.max} beds`}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-violet-600">
              {minRent && maxRent && minRent !== maxRent ? (
                <>
                  {formatCurrency(minRent)} - {formatCurrency(maxRent)}
                  <span className="text-sm font-normal text-slate-500">/mo</span>
                </>
              ) : (
                <>
                  Starting at {formatCurrency(minRent || 0)}
                  <span className="text-sm font-normal text-slate-500">/mo</span>
                </>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {unitCount} unit{unitCount !== 1 ? 's' : ''} available
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              {firstUnit && (
                <>
                  {firstUnit.bedrooms && Number(firstUnit.bedrooms) > 0 && (
                    <span>{Number(firstUnit.bedrooms)} bed{Number(firstUnit.bedrooms) !== 1 ? 's' : ''}</span>
                  )}
                  {firstUnit.bathrooms && Number(firstUnit.bathrooms) > 0 && (
                    <span>{Number(firstUnit.bathrooms)} bath{Number(firstUnit.bathrooms) !== 1 ? 's' : ''}</span>
                  )}
                </>
              )}
            </div>
            {firstUnit?.rentAmount && (
              <div className="text-2xl font-bold text-violet-600">
                {formatCurrency(Number(firstUnit.rentAmount))}
                <span className="text-sm font-normal text-slate-500">/month</span>
              </div>
            )}
            {unitCount > 1 && (
              <p className="text-xs text-slate-500">
                {unitCount} unit{unitCount !== 1 ? 's' : ''} available
              </p>
            )}
          </>
        )}
        
        <div className="mt-auto">
          <span className="text-violet-600 text-sm font-medium hover:underline">
            {isApartmentComplex ? 'View Floor Plans & Availability →' : 'View Details & Schedule Tour →'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function PaymentMethod({ 
  icon: Icon, 
  title, 
  desc, 
  color 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  desc: string; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    violet: 'bg-violet-500/20 border-violet-400/30 text-violet-300',
    emerald: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300',
    cyan: 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300',
    blue: 'bg-blue-500/20 border-blue-400/30 text-blue-300',
  };
  
  return (
    <div className="text-center space-y-3">
      <div className={`h-16 w-16 mx-auto rounded-xl flex items-center justify-center border ${colorClasses[color]}`}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-xs text-slate-300/80">{desc}</p>
    </div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  desc, 
  color 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  desc: string; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    violet: 'bg-violet-500/20 border-violet-400/30 text-violet-300',
    emerald: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300',
    blue: 'bg-blue-500/20 border-blue-400/30 text-blue-300',
    amber: 'bg-amber-500/20 border-amber-400/30 text-amber-300',
    purple: 'bg-purple-500/20 border-purple-400/30 text-purple-300',
    cyan: 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300',
  };
  
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
      <div className={`h-12 w-12 rounded-lg flex items-center justify-center border ${colorClasses[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-300/80">{desc}</p>
    </div>
  );
}
