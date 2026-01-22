import { prisma } from '@/db/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Star, MapPin, Shield, Clock, Wrench, Calendar, CheckCircle, ArrowLeft, DollarSign, Award, Phone, Globe, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import ContactContractorButton from './contact-button';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  // Check if id is a valid UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  // Try ContractorProfile first (by ID or slug)
  let profile = await prisma.contractorProfile.findFirst({
    where: isUUID ? { OR: [{ id }, { slug: id }] } : { slug: id },
    select: { displayName: true, businessName: true, specialties: true, tagline: true },
  });

  if (profile) {
    const name = profile.displayName || profile.businessName;
    return {
      title: `${name} | Property Flow HQ`,
      description: profile.tagline || `Hire ${name} for ${profile.specialties.slice(0, 3).join(', ')}`,
    };
  }

  // Fall back to Contractor table
  const contractor = isUUID ? await prisma.contractor.findUnique({
    where: { id },
    select: { name: true, specialties: true },
  }) : null;

  if (!contractor) return { title: 'Contractor Not Found' };

  return {
    title: `${contractor.name} | Property Flow HQ`,
    description: `Hire ${contractor.name} for ${contractor.specialties.slice(0, 3).join(', ')}`,
  };
}

export default async function ContractorProfilePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  // Check if id is a valid UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // Try to find ContractorProfile by ID or slug first
  const profile = await prisma.contractorProfile.findFirst({
    where: isUUID ? {
      OR: [
        { id: id },
        { slug: id },
      ],
    } : {
      slug: id,
    },
    include: {
      user: {
        select: { id: true, name: true, image: true, createdAt: true },
      },
      reviewsReceived: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: {
            select: { name: true, image: true },
          },
        },
      },
    },
  });

  // If no ContractorProfile found, try Contractor table
  if (!profile) {
    const contractor = isUUID ? await prisma.contractor.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, image: true, createdAt: true },
        },
        workOrders: {
          where: { status: 'completed' },
          orderBy: { completedAt: 'desc' },
          take: 5,
          include: {
            property: { select: { name: true } },
            media: { where: { phase: 'after' }, take: 1 },
          },
        },
        _count: {
          select: { workOrders: true },
        },
      },
    }) : null;

    if (!contractor || !contractor.userId) {
      notFound();
    }

    // Render Contractor view
    const completedJobs = contractor.workOrders.length;
    const totalJobs = contractor._count.workOrders;
    const rating = 4.5;
    const memberSince = contractor.user?.createdAt 
      ? new Date(contractor.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Recently joined';
    const canHire = session?.user?.role === 'admin' || session?.user?.role === 'landlord' || session?.user?.role === 'property_manager';

    return (
      <div className="min-h-screen bg-white">
        <div className="pt-6 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Link href="/contractors" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Contractors
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="overflow-hidden bg-white/90 backdrop-blur-sm border-white/20">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-500 relative">
                  <div className="absolute -bottom-16 left-6">
                    <div className="h-32 w-32 rounded-full bg-white p-1 shadow-xl">
                      {contractor.user?.image ? (
                        <img src={contractor.user.image} alt={contractor.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-4xl font-bold">
                          {contractor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <CardContent className="pt-20 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-slate-900">{contractor.name}</h1>
                        {contractor.isPaymentReady && (
                          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-1">
                            <Shield className="h-3 w-3" /> Verified Pro
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 mb-4">{contractor.specialties.join(' • ')}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
                          <span className="text-slate-500">({completedJobs} jobs)</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Wrench className="h-4 w-4" />
                          {totalJobs} jobs completed
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="h-4 w-4" />
                          Member since {memberSince}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-slate-900">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    {contractor.notes || `Professional contractor specializing in ${contractor.specialties.slice(0, 3).join(', ')}. Committed to quality work and customer satisfaction.`}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-slate-900">Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {contractor.specialties.map((specialty) => (
                      <div key={specialty} className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <span className="text-slate-700">{specialty}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {contractor.workOrders.length > 0 && (
                <Card className="bg-white/90 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-slate-900">Recent Work</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contractor.workOrders.map((order) => (
                        <div key={order.id} className="flex gap-4 p-4 rounded-lg bg-slate-50">
                          {order.media[0] && (
                            <img src={order.media[0].url} alt={order.title} className="w-24 h-24 rounded-lg object-cover" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">{order.title}</h4>
                            <p className="text-sm text-slate-500 mt-1">{order.property.name}</p>
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{order.description}</p>
                          </div>
                          <span className="px-2 py-1 h-fit rounded bg-emerald-100 text-emerald-700 text-xs font-medium">Completed</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="sticky top-6 bg-white/90 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-slate-500 mb-1">Response Time</p>
                    <p className="text-lg font-semibold text-slate-900 flex items-center justify-center gap-2">
                      <Clock className="h-5 w-5 text-emerald-500" />
                      Usually responds in 1 hour
                    </p>
                  </div>

                  {session ? (
                    <div className="space-y-3">
                      <ContactContractorButton contractorId={contractor.id} contractorName={contractor.name} />
                      {canHire && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/admin/contractors/hire/${contractor.id}`}>
                            <Wrench className="h-4 w-4 mr-2" />
                            Send Job Offer
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ContactContractorButton contractorId={contractor.id} contractorName={contractor.name} />
                  )}

                  <div className="mt-6 pt-6 border-t space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Jobs Completed</span>
                      <span className="font-medium text-slate-900">{totalJobs}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Rating</span>
                      <span className="font-medium text-slate-900 flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Verified</span>
                      <span className={`font-medium ${contractor.isPaymentReady ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {contractor.isPaymentReady ? 'Yes' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <div className="h-16" />
      </div>
    );
  }

  const name = profile.displayName || profile.businessName;
  const memberSince = profile.user?.createdAt 
    ? new Date(profile.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently joined';

  // Check if current user can hire
  const canHire = session?.user?.role === 'admin' || session?.user?.role === 'landlord' || session?.user?.role === 'property_manager';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-6 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/contractors" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Contractors
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-violet-50 border-2 border-slate-200 shadow-lg">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-500 relative">
                {profile.coverPhoto && (
                  <img src={profile.coverPhoto} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute -bottom-16 left-6">
                  <div className="h-32 w-32 rounded-full bg-white p-1 shadow-xl">
                    {profile.profilePhoto || profile.user?.image ? (
                      <img 
                        src={profile.profilePhoto || profile.user?.image || ''} 
                        alt={name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-4xl font-bold">
                        {name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <CardContent className="pt-20 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
                      {profile.identityVerified && (
                        <span className="px-2 py-1 rounded bg-gradient-to-r from-sky-300 via-cyan-300 to-indigo-600 text-emerald-700 text-xs font-medium flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Verified Pro
                        </span>
                      )}
                    </div>
                    {profile.tagline && (
                      <p className="text-slate-600 mb-2">{profile.tagline}</p>
                    )}
                    <p className="text-slate-500 mb-4">{profile.specialties.join(' • ')}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-slate-900">{profile.avgRating.toFixed(1)}</span>
                        <span className="text-slate-500">({profile.totalReviews} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Wrench className="h-4 w-4" />
                        {profile.completedJobs} jobs completed
                      </div>
                      {profile.baseCity && profile.baseState && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="h-4 w-4" />
                          {profile.baseCity}, {profile.baseState}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="h-4 w-4" />
                        Member since {memberSince}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 border-2 border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  {profile.bio || `Professional contractor specializing in ${profile.specialties.slice(0, 3).join(', ')}. 
                  Committed to quality work and customer satisfaction.`}
                </p>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900">Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.specialties.map((specialty) => (
                    <div 
                      key={specialty}
                      className="flex items-center gap-2 p-3 rounded-lg bg-slate-50"
                    >
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <span className="text-slate-700">{specialty}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio */}
            {profile.portfolioImages.length > 0 && (
              <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900">Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.portfolioImages.slice(0, 6).map((img, idx) => (
                      <img 
                        key={idx}
                        src={img} 
                        alt={`Portfolio ${idx + 1}`}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {profile.reviewsReceived.length > 0 && (
              <Card className="bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 border-2 border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900">Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.reviewsReceived.map((review) => (
                      <div key={review.id} className="p-4 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-3 mb-2">
                          {review.customer.image ? (
                            <img src={review.customer.image} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                              {review.customer.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900">{review.customer.name}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < review.overallRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.content && (
                          <p className="text-slate-600">{review.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-6 bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 border-2 border-slate-200 shadow-lg">
              <CardContent className="p-6">
                {profile.hourlyRate && (
                  <div className="text-center mb-4 pb-4 border-b">
                    <p className="text-sm text-slate-500 mb-1">Starting at</p>
                    <p className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-1">
                      <DollarSign className="h-6 w-6" />
                      {parseFloat(profile.hourlyRate.toString()).toFixed(0)}/hr
                    </p>
                  </div>
                )}

                <div className="text-center mb-6">
                  <p className="text-sm text-slate-500 mb-1">Response Time</p>
                  <p className="text-lg font-semibold text-slate-900 flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-500" />
                    {profile.responseRate > 90 ? 'Usually responds in 1 hour' : 
                     profile.responseRate > 70 ? 'Usually responds in 4 hours' : 
                     'Usually responds in 24 hours'}
                  </p>
                </div>

                {session ? (
                  <div className="space-y-3">
                    <ContactContractorButton 
                      contractorId={profile.id} 
                      contractorName={name} 
                    />
                    {canHire && (
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/admin/contractors/hire/${profile.id}`}>
                          <Wrench className="h-4 w-4 mr-2" />
                          Send Job Offer
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <ContactContractorButton 
                    contractorId={profile.id} 
                    contractorName={name} 
                  />
                )}

                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Jobs Completed</span>
                    <span className="font-medium text-slate-900">{profile.completedJobs}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Rating</span>
                    <span className="font-medium text-slate-900 flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {profile.avgRating.toFixed(1)}
                    </span>
                  </div>
                  {profile.yearsExperience && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Experience</span>
                      <span className="font-medium text-slate-900">{profile.yearsExperience} years</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Verified</span>
                    <span className={`font-medium ${profile.identityVerified ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {profile.identityVerified ? 'Yes' : 'Pending'}
                    </span>
                  </div>
                  {profile.insuranceVerified && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Insured</span>
                      <span className="font-medium text-emerald-600">Yes</span>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                {(profile.phone || profile.website) && (
                  <div className="mt-6 pt-6 border-t space-y-2">
                    {profile.phone && (
                      <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600">
                        <Phone className="h-4 w-4" />
                        {profile.phone}
                      </a>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600">
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Padding */}
      <div className="h-16" />
    </div>
  );
}
