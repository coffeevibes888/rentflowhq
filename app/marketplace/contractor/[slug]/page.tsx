import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContractorProfileBySlug } from '@/lib/actions/contractor-profile.actions';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Shield, 
  CheckCircle2, 
  Clock,
  Briefcase,
  User,
  ArrowLeft,
  Zap,
  DollarSign,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractorQuoteButton } from '@/components/contractor/quote-button';

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

interface ContractorProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ContractorProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getContractorProfileBySlug(slug);
  
  if (!result.success || !result.profile) {
    return { title: 'Contractor Not Found' };
  }

  const profile = result.profile;
  return {
    title: `${profile.businessName} | Contractor Profile`,
    description: profile.tagline || `${profile.businessName} - ${profile.specialties.slice(0, 3).join(', ')}`,
  };
}

export default async function ContractorProfilePage({ params }: ContractorProfilePageProps) {
  const { slug } = await params;
  const result = await getContractorProfileBySlug(slug);

  if (!result.success || !result.profile) {
    notFound();
  }

  const profile = result.profile;
  const reviews = profile.reviews || [];

  const formatPrice = (price: any) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(Number(price));
  };

  // Build feature cards from contractor's custom content or defaults
  const featureCards = [
    {
      icon: profile.featureCard1Icon || 'zap',
      title: profile.featureCard1Title || 'Quality Workmanship',
      description: profile.featureCard1Description || 'Professional results backed by years of experience.',
    },
    {
      icon: profile.featureCard2Icon || 'dollar-sign',
      title: profile.featureCard2Title || 'Transparent Pricing',
      description: profile.featureCard2Description || 'Upfront quotes with no hidden fees.',
    },
    {
      icon: profile.featureCard3Icon || 'shield',
      title: profile.featureCard3Title || 'Licensed & Insured',
      description: profile.featureCard3Description || 'Fully licensed and insured for your protection.',
    },
    {
      icon: profile.featureCard4Icon || 'clock',
      title: profile.featureCard4Title || 'On-Time Service',
      description: profile.featureCard4Description || 'Punctual and reliable. We show up when promised.',
    },
  ].filter(card => card.title);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section with Cover Photo */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-64 md:h-80 relative overflow-hidden">
          {profile.coverPhoto ? (
            <Image
              src={profile.coverPhoto}
              alt={`${profile.businessName} cover`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Back button */}
          <div className="absolute top-4 left-4 z-10">
            <Link href="/marketplace">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Header - Overlapping Cover */}
        <div className="container mx-auto px-4 -mt-24 relative z-10">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Photo */}
              <div className="relative shrink-0">
                <div className="h-32 w-32 md:h-40 md:w-40 rounded-2xl border-4 border-white/20 overflow-hidden bg-slate-800 shadow-2xl">
                  {profile.profilePhoto ? (
                    <Image src={profile.profilePhoto} alt="" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-16 w-16 text-slate-500" />
                    </div>
                  )}
                </div>
                {profile.isAvailable && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white shadow-lg">Available</Badge>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                  {profile.businessName}
                </h1>
                {profile.tagline && (
                  <p className="text-slate-300 text-lg mb-4">{profile.tagline}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1.5 rounded-full">
                    <Star className="h-5 w-5 text-amber-400 fill-current" />
                    <span className="font-bold text-white">{profile.avgRating.toFixed(1)}</span>
                    <span className="text-slate-300">({profile.totalReviews} reviews)</span>
                  </div>
                  {(profile.baseCity || profile.baseState) && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="h-4 w-4" />
                      {[profile.baseCity, profile.baseState].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {profile.yearsExperience && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="h-4 w-4" />
                      {profile.yearsExperience} years experience
                    </div>
                  )}
                </div>

                {/* Verification Badges */}
                <div className="flex flex-wrap gap-2">
                  {profile.licenseNumber && (
                    <Badge variant="outline" className="gap-1 border-emerald-400/30 text-emerald-300 bg-emerald-500/10">
                      <CheckCircle2 className="h-3 w-3" /> Licensed
                    </Badge>
                  )}
                  {profile.insuranceVerified && (
                    <Badge variant="outline" className="gap-1 border-blue-400/30 text-blue-300 bg-blue-500/10">
                      <Shield className="h-3 w-3" /> Insured
                    </Badge>
                  )}
                  {profile.backgroundChecked && (
                    <Badge variant="outline" className="gap-1 border-emerald-400/30 text-emerald-300 bg-emerald-500/10">
                      <CheckCircle2 className="h-3 w-3" /> Background Checked
                    </Badge>
                  )}
                  {profile.identityVerified && (
                    <Badge variant="outline" className="gap-1 border-emerald-400/30 text-emerald-300 bg-emerald-500/10">
                      <CheckCircle2 className="h-3 w-3" /> Identity Verified
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quick Actions - Desktop */}
              <div className="hidden lg:flex flex-col gap-3 min-w-[200px]">
                <ContractorQuoteButton 
                  contractorSlug={profile.slug}
                  contractorName={profile.businessName}
                />
                {profile.email && (
                  <a href={`mailto:${profile.email}`}>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      <Mail className="h-4 w-4 mr-2" />
                      {profile.email}
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {profile.bio && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-4">About</h2>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
              </section>
            )}

            {/* Services */}
            {profile.specialties.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-violet-400" />
                  Services Offered
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-4 py-2 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Portfolio */}
            {profile.portfolioImages.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-4">Portfolio</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.portfolioImages.map((url, idx) => (
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
              </section>
            )}

            {/* Why Choose Me */}
            {featureCards.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-6">Why Choose {profile.displayName}?</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {featureCards.map((card, idx) => {
                    const IconComponent = iconMap[card.icon] || Briefcase;
                    const colorClass = iconColors[card.icon] || iconColors.briefcase;
                    
                    return (
                      <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${colorClass}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-white">{card.title}</h3>
                        <p className="text-sm text-slate-400">{card.description}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400" />
                  Reviews ({profile.totalReviews})
                </h2>
                <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1.5 rounded-full">
                  <Star className="h-5 w-5 text-amber-400 fill-current" />
                  <span className="font-bold text-white">{profile.avgRating.toFixed(1)}</span>
                </div>
              </div>
              
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-white/10 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                          {review.reviewer?.image ? (
                            <Image src={review.reviewer.image} alt="" width={40} height={40} className="object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-white">{review.reviewer?.name || 'Anonymous'}</span>
                            <span className="text-sm text-slate-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.overallRating
                                    ? 'text-amber-400 fill-current'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                            {review.isVerified && (
                              <Badge variant="outline" className="ml-2 text-xs border-emerald-400/30 text-emerald-300">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified Job
                              </Badge>
                            )}
                          </div>
                          {review.title && (
                            <p className="font-medium text-white mb-1">{review.title}</p>
                          )}
                          <p className="text-slate-300">{review.content}</p>
                          
                          {review.contractorResponse && (
                            <div className="mt-3 pl-4 border-l-2 border-violet-400/50 bg-violet-500/10 rounded-r-lg p-3">
                              <p className="text-sm font-medium text-violet-300 mb-1">Response from {profile.displayName}</p>
                              <p className="text-sm text-slate-300">{review.contractorResponse}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quote Card - Mobile */}
            <div className="lg:hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6">
              <ContractorQuoteButton 
                contractorSlug={profile.slug}
                contractorName={profile.businessName}
              />
            </div>

            {/* Pricing Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 sticky top-4">
              <div className="text-center mb-6">
                {profile.hourlyRate && (
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-violet-400">
                      {formatPrice(profile.hourlyRate)}
                    </span>
                    <span className="text-slate-400">/hour</span>
                  </div>
                )}
                {profile.minimumJobSize && (
                  <p className="text-sm text-slate-400">
                    Minimum job: {formatPrice(profile.minimumJobSize)}
                  </p>
                )}
              </div>

              <div className="hidden lg:block mb-6">
                <ContractorQuoteButton 
                  contractorSlug={profile.slug}
                  contractorName={profile.businessName}
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                {profile.phone && (
                  <a 
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-3 text-slate-300 hover:text-violet-400 transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    {profile.phone}
                  </a>
                )}
                {profile.email && (
                  <a 
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-3 text-slate-300 hover:text-violet-400 transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    {profile.email}
                  </a>
                )}
                {profile.website && (
                  <a 
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-300 hover:text-violet-400 transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                    Website
                  </a>
                )}
              </div>

              {profile.availabilityNotes && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-slate-400">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {profile.availabilityNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Stats Card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6">
              <h3 className="font-semibold text-white mb-4">Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-2xl font-bold text-violet-400">{profile.completedJobs}</p>
                  <p className="text-xs text-slate-400">Jobs Completed</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-2xl font-bold text-violet-400">{(profile.onTimeRate * 100).toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">On-Time Rate</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-2xl font-bold text-violet-400">{(profile.responseRate * 100).toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">Response Rate</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-2xl font-bold text-violet-400">{(profile.repeatClientRate * 100).toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">Repeat Clients</p>
                </div>
              </div>
            </div>

            {/* Service Areas */}
            {profile.serviceAreas.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-violet-400" />
                  Service Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.serviceAreas.map((area) => (
                    <Badge key={area} variant="outline" className="border-white/20 text-slate-300">
                      {area}
                    </Badge>
                  ))}
                </div>
                {profile.serviceRadius && (
                  <p className="text-sm text-slate-400 mt-3">
                    Serves within {profile.serviceRadius} miles of {profile.baseCity || 'base location'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
