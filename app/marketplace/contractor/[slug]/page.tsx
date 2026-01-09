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
  Calendar,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractorQuoteButton } from '@/components/contractor/quote-button';

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

  return (
    <main className="min-h-screen">
      {/* Cover Photo */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
        {profile.coverPhoto && (
          <Image
            src={profile.coverPhoto}
            alt={`${profile.businessName} cover`}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Link href="/marketplace">
            <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <Card className="overflow-visible">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Profile Photo */}
                  <div className="relative -mt-20 sm:-mt-16">
                    <div className="h-32 w-32 rounded-2xl border-4 border-white overflow-hidden bg-slate-200 shadow-xl">
                      {profile.profilePhoto ? (
                        <Image src={profile.profilePhoto} alt="" fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <User className="h-16 w-16 text-slate-400" />
                        </div>
                      )}
                    </div>
                    {profile.isAvailable && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <Badge className="bg-emerald-500 text-white">Available</Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 pt-2 sm:pt-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                      {profile.businessName}
                    </h1>
                    {profile.tagline && (
                      <p className="text-slate-600 mb-3">{profile.tagline}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-amber-400 fill-current" />
                        <span className="font-semibold">{profile.avgRating.toFixed(1)}</span>
                        <span className="text-slate-500">({profile.totalReviews} reviews)</span>
                      </div>
                      {(profile.baseCity || profile.baseState) && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="h-4 w-4" />
                          {[profile.baseCity, profile.baseState].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {profile.yearsExperience && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="h-4 w-4" />
                          {profile.yearsExperience} years experience
                        </div>
                      )}
                    </div>

                    {/* Verification Badges */}
                    <div className="flex flex-wrap gap-2">
                      {profile.licenseNumber && (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Licensed
                        </Badge>
                      )}
                      {profile.insuranceVerified && (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3 text-blue-500" /> Insured
                        </Badge>
                      )}
                      {profile.backgroundChecked && (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Background Checked
                        </Badge>
                      )}
                      {profile.identityVerified && (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Identity Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 whitespace-pre-wrap">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Specialties */}
            {profile.specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Services Offered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-sm py-1 px-3">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            {profile.portfolioImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {profile.portfolioImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={url}
                          alt={`Portfolio ${idx + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Reviews ({profile.totalReviews})
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-amber-400 fill-current" />
                    <span className="text-xl font-bold">{profile.avgRating.toFixed(1)}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No reviews yet</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                            {review.reviewer?.image ? (
                              <Image src={review.reviewer.image} alt="" fill className="object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{review.reviewer?.name || 'Anonymous'}</span>
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
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                              {review.isVerified && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                                  Verified Job
                                </Badge>
                              )}
                            </div>
                            {review.title && (
                              <p className="font-medium mb-1">{review.title}</p>
                            )}
                            <p className="text-slate-600">{review.content}</p>
                            
                            {review.contractorResponse && (
                              <div className="mt-3 pl-4 border-l-2 border-violet-200 bg-violet-50 rounded-r-lg p-3">
                                <p className="text-sm font-medium text-violet-700 mb-1">Response from {profile.displayName}</p>
                                <p className="text-sm text-slate-600">{review.contractorResponse}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quote Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  {profile.hourlyRate && (
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-violet-600">
                        {formatPrice(profile.hourlyRate)}
                      </span>
                      <span className="text-slate-500">/hour</span>
                    </div>
                  )}
                  {profile.minimumJobSize && (
                    <p className="text-sm text-slate-500">
                      Minimum job: {formatPrice(profile.minimumJobSize)}
                    </p>
                  )}
                </div>

                <ContractorQuoteButton 
                  contractorSlug={profile.slug}
                  contractorName={profile.businessName}
                />

                <div className="mt-4 pt-4 border-t space-y-3">
                  {profile.phone && (
                    <a 
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-3 text-slate-600 hover:text-violet-600 transition-colors"
                    >
                      <Phone className="h-5 w-5" />
                      {profile.phone}
                    </a>
                  )}
                  {profile.email && (
                    <a 
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-3 text-slate-600 hover:text-violet-600 transition-colors"
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
                      className="flex items-center gap-3 text-slate-600 hover:text-violet-600 transition-colors"
                    >
                      <Globe className="h-5 w-5" />
                      Website
                    </a>
                  )}
                </div>

                {profile.availabilityNotes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-slate-500">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {profile.availabilityNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Areas */}
            {profile.serviceAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Service Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.serviceAreas.map((area) => (
                      <Badge key={area} variant="outline">{area}</Badge>
                    ))}
                  </div>
                  {profile.serviceRadius && (
                    <p className="text-sm text-slate-500 mt-3">
                      Serves within {profile.serviceRadius} miles of {profile.baseCity || 'base location'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-violet-600">{profile.completedJobs}</p>
                    <p className="text-xs text-slate-500">Jobs Completed</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-violet-600">{(profile.onTimeRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">On-Time Rate</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-violet-600">{(profile.responseRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">Response Rate</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-violet-600">{(profile.repeatClientRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-slate-500">Repeat Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
