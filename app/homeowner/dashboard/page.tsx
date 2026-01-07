import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { 
  HousePlus, Wrench, Plus, Briefcase, Clock, CheckCircle, 
  MapPin, Camera, AlertCircle, Sparkles, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RecommendedContractors from '@/components/homeowner/recommended-contractors';

interface WorkOrder {
  id: string;
  title: string;
  category: string;
  status: string;
  bids: { id: string; status: string }[];
}

export default async function HomeownerDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'homeowner') {
    return redirect('/');
  }

  // Get homeowner profile with work orders
  let homeowner: any = null;
  try {
    homeowner = await prisma.homeowner.findUnique({
      where: { userId: session.user.id },
      include: {
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            bids: true,
          },
        },
      },
    });
  } catch {
    // Model doesn't exist yet - show empty state
  }

  const workOrders = homeowner?.workOrders || [];
  const activeJobs = workOrders.filter((wo: WorkOrder) => 
    ['open', 'assigned', 'in_progress'].includes(wo.status)
  ).length;
  
  const completedJobs = workOrders.filter((wo: WorkOrder) => wo.status === 'completed').length;
  const pendingBids = workOrders.reduce((sum: number, wo: WorkOrder) => 
    sum + wo.bids.filter((b: { status: string }) => b.status === 'pending').length, 0
  );

  // Check profile completeness
  const hasAddress = homeowner?.address && (homeowner.address as any)?.street;
  const hasImages = homeowner?.images?.length > 0;
  const hasHomeType = Boolean(homeowner?.homeType);
  const profileComplete = hasAddress && hasImages && hasHomeType;

  const stats = [
    {
      title: 'Active Jobs',
      value: activeJobs,
      icon: Wrench,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Bids',
      value: pendingBids,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Completed',
      value: completedJobs,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, {session.user.name?.split(' ')[0] || 'Homeowner'}!
            </h1>
            <p className="text-slate-600 mt-1">Manage your home and find contractors</p>
          </div>
          <Link href="/homeowner/jobs/new">
            <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Post a Job
            </Button>
          </Link>
        </div>

        {/* Profile Completion Banner */}
        {!profileComplete && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900">Complete your home profile</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Add your address and photos to help contractors understand your property better.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {!hasAddress && (
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        <MapPin className="h-3 w-3 mr-1" /> Add address
                      </Badge>
                    )}
                    {!hasImages && (
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        <Camera className="h-3 w-3 mr-1" /> Add photos
                      </Badge>
                    )}
                    {!hasHomeType && (
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        <HousePlus className="h-3 w-3 mr-1" /> Set home type
                      </Badge>
                    )}
                  </div>
                </div>
                <Link href="/homeowner/settings">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Home Card */}
        <Card className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Home Image */}
            <div className="md:w-1/3 relative">
              {hasImages ? (
                <div className="relative h-48 md:h-full">
                  <Image 
                    src={homeowner.images[0]} 
                    alt="My Home" 
                    fill 
                    className="object-cover"
                  />
                  {homeowner.images.length > 1 && (
                    <Badge className="absolute bottom-2 right-2 bg-black/60">
                      +{homeowner.images.length - 1} photos
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="h-48 md:h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No photos yet</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Home Details */}
            <div className="md:w-2/3 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {homeowner?.name || 'My Home'}
                  </h2>
                  {hasAddress && (
                    <p className="text-slate-600 flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {(homeowner.address as any).street}, {(homeowner.address as any).city}, {(homeowner.address as any).state}
                    </p>
                  )}
                </div>
                <Link href="/homeowner/settings">
                  <Button variant="outline" size="sm">Edit Home</Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {homeowner?.homeType && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Type</p>
                    <p className="font-medium text-slate-900 capitalize">
                      {homeowner.homeType.replace('_', ' ')}
                    </p>
                  </div>
                )}
                {homeowner?.bedrooms && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Bedrooms</p>
                    <p className="font-medium text-slate-900">{homeowner.bedrooms}</p>
                  </div>
                )}
                {homeowner?.bathrooms && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Bathrooms</p>
                    <p className="font-medium text-slate-900">{Number(homeowner.bathrooms)}</p>
                  </div>
                )}
                {homeowner?.squareFootage && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Sq. Ft.</p>
                    <p className="font-medium text-slate-900">{homeowner.squareFootage.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {homeowner?.interestedServices?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-2">Services Needed</p>
                  <div className="flex flex-wrap gap-2">
                    {homeowner.interestedServices.map((service: string) => (
                      <Badge key={service} variant="secondary" className="capitalize">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="bg-white/80 backdrop-blur-sm border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recommended Contractors */}
        <RecommendedContractors interestedServices={homeowner?.interestedServices || []} />

        {/* Recent Jobs */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900">Your Jobs</CardTitle>
            <Link href="/homeowner/jobs" className="text-sm text-sky-600 hover:text-sky-500">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {workOrders.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No jobs yet</h3>
                <p className="text-slate-500 mb-4">Post your first job to get bids from contractors</p>
                <Link href="/homeowner/jobs/new">
                  <Button className="bg-gradient-to-r from-sky-500 to-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {workOrders.map((job: WorkOrder) => (
                  <Link
                    key={job.id}
                    href={`/homeowner/jobs/${job.id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{job.title}</p>
                      <p className="text-sm text-slate-500 capitalize">{job.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {job.bids.length > 0 && (
                        <span className="text-sm text-slate-500">
                          {job.bids.length} bid{job.bids.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <Badge className={
                        job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        job.status === 'assigned' ? 'bg-violet-100 text-violet-700' :
                        'bg-amber-100 text-amber-700'
                      }>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/homeowner/jobs/new">
            <Card className="bg-gradient-to-r from-sky-500 to-blue-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Plus className="h-8 w-8 mx-auto text-white mb-2" />
                <p className="text-sm font-medium text-white">Post a Job</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/contractors">
            <Card className="bg-gradient-to-r from-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Wrench className="h-8 w-8 mx-auto text-white mb-2" />
                <p className="text-sm font-medium text-white">Find Contractors</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/homeowner/jobs">
            <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Briefcase className="h-8 w-8 mx-auto text-white mb-2" />
                <p className="text-sm font-medium text-white">My Jobs</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/homeowner/settings">
            <Card className="bg-gradient-to-r from-slate-600 to-slate-700 border-white/20 hover:opacity-90 transition-opacity cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <HousePlus className="h-8 w-8 mx-auto text-white mb-2" />
                <p className="text-sm font-medium text-white">My Home</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
