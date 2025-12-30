import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { HousePlus, Wrench, Plus, Briefcase, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

  // Try to get homeowner profile - may not exist if migration hasn't run
  let homeowner: { workOrders: WorkOrder[] } | null = null;
  try {
    homeowner = await (prisma as any).homeowner.findUnique({
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
            <p className="text-slate-600 mt-1">Manage your home projects and find contractors</p>
          </div>
          <Link href="/homeowner/jobs/new">
            <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Post a Job
            </Button>
          </Link>
        </div>

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
            <Card className="bg-gradient-to-r from-sky-500 to-blue-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer">
              <CardContent className="p-4 text-center">
                <Plus className="h-8 w-8 mx-auto text-white mb-2" />
                <p className="text-sm font-medium text-white">Post a Job</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/contractors?view=contractors">
            <Card className="bg-gradient-to-r from-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer">
              <CardContent className="p-4 text-center">
                <Wrench className="h-8 w-8 mx-auto text-white mb-2" />
                <p className="text-sm font-medium text-white">Find Contractors</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/homeowner/jobs">
            <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer">
              <CardContent className="p-4 text-center">
                <Briefcase className="h-8 w-8 mx-auto text-white mb-2" />
                <p className="text-sm font-medium text-white">My Jobs</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/homeowner/settings">
            <Card className="bg-gradient-to-r from-slate-600 to-slate-700 border-white/20 hover:opacity-90 transition-opacity cursor-pointer">
              <CardContent className="p-4 text-center">
                <HousePlus className="h-8 w-8 mx-auto text-white mb-2" />
                <p className="text-sm font-medium text-white">Settings</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
