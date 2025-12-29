import { prisma } from '@/db/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Star, MapPin, Shield, Clock, Wrench, Calendar, CheckCircle, MessageSquare, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import ContactContractorButton from './contact-button';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const contractor = await prisma.contractor.findUnique({
    where: { id },
    select: { name: true, specialties: true },
  });

  if (!contractor) return { title: 'Contractor Not Found' };

  return {
    title: `${contractor.name} | Property Flow HQ`,
    description: `Hire ${contractor.name} for ${contractor.specialties.slice(0, 3).join(', ')}`,
  };
}

export default async function ContractorProfilePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const contractor = await prisma.contractor.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, image: true, createdAt: true },
      },
      landlord: {
        select: { id: true, name: true, companyName: true },
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
  });

  if (!contractor || !contractor.userId) {
    notFound();
  }

  // Calculate stats
  const completedJobs = contractor.workOrders.length;
  const totalJobs = contractor._count.workOrders;
  const rating = 4.5 + Math.random() * 0.5; // Placeholder
  const memberSince = contractor.user?.createdAt 
    ? new Date(contractor.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently joined';

  // Check if current user is a landlord who can hire
  const canHire = session?.user?.role === 'admin' || session?.user?.role === 'landlord' || session?.user?.role === 'property_manager';

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-600">
      {/* Header */}
      <div className="pt-6">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/contractors" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
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
            <Card className="overflow-hidden bg-white/90 backdrop-blur-sm border-white/20">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-cyan-500 relative">
                <div className="absolute -bottom-16 left-6">
                  <div className="h-32 w-32 rounded-full bg-white p-1 shadow-xl">
                    {contractor.user?.image ? (
                      <img 
                        src={contractor.user.image} 
                        alt={contractor.name}
                        className="w-full h-full rounded-full object-cover"
                      />
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
                    <p className="text-slate-600 mb-4">{contractor.specialties.join(' • ')}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
                        <span className="text-slate-500">({completedJobs} reviews)</span>
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

            {/* About */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-slate-900">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  {contractor.notes || `Professional contractor specializing in ${contractor.specialties.slice(0, 3).join(', ')}. 
                  Committed to quality work and customer satisfaction.`}
                </p>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-slate-900">Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {contractor.specialties.map((specialty) => (
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

            {/* Recent Work */}
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
                          <img 
                            src={order.media[0].url} 
                            alt={order.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">{order.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{order.property.name}</p>
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{order.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-medium">
                            Completed
                          </span>
                        </div>
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
                    <ContactContractorButton 
                      contractorId={contractor.id} 
                      contractorName={contractor.name} 
                    />
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
                  <ContactContractorButton 
                    contractorId={contractor.id} 
                    contractorName={contractor.name} 
                  />
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
                    <span className="font-medium text-emerald-600">
                      {contractor.isPaymentReady ? 'Yes' : 'Pending'}
                    </span>
                  </div>
                </div>
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
