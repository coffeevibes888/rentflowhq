import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default async function ContractorJobsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'contractor') {
    return redirect('/sign-in');
  }

  // Get contractor profile
  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!contractorProfile) {
    return redirect('/contractor/profile');
  }

  // Get all jobs
  const jobs = await prisma.contractorJob.findMany({
    where: { contractorId: contractorProfile.id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      _count: {
        select: {
          timeEntries: true,
          expenses: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate stats
  const stats = {
    total: jobs.length,
    active: jobs.filter(j => ['scheduled', 'in_progress'].includes(j.status)).length,
    quoted: jobs.filter(j => j.status === 'quoted').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  const statusColors: Record<string, string> = {
    quoted: 'bg-amber-500/30 text-amber-200',
    approved: 'bg-green-500/30 text-green-200',
    scheduled: 'bg-blue-500/30 text-blue-200',
    in_progress: 'bg-violet-500/30 text-violet-200',
    on_hold: 'bg-orange-500/30 text-orange-200',
    completed: 'bg-emerald-500/30 text-emerald-200',
    invoiced: 'bg-cyan-500/30 text-cyan-200',
    paid: 'bg-green-600/30 text-green-300',
    canceled: 'bg-red-500/30 text-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Jobs</h1>
          <p className="text-white/70 mt-1">Manage all your projects and jobs</p>
        </div>
        <div className="flex gap-3">
          <Link href="/contractor/jobs/new">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-white/70">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-violet-300">{stats.active}</p>
            <p className="text-sm text-white/70">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-300">{stats.quoted}</p>
            <p className="text-sm text-white/70">Quoted</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-300">{stats.completed}</p>
            <p className="text-sm text-white/70">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">All Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg mb-4">No jobs yet</p>
              <Link href="/contractor/jobs/new">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/contractor/jobs/${job.id}`}
                  className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white truncate">{job.title}</h3>
                        <Badge className={statusColors[job.status] || 'bg-gray-500/30 text-gray-200'}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                        <span className="font-mono">{job.jobNumber}</span>
                        {job.customer && <span>{job.customer.name}</span>}
                        {job.jobType && <span>{job.jobType}</span>}
                        {job.address && <span>{job.address}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      {job.estimatedCost && (
                        <p className="text-lg font-semibold text-emerald-300">
                          {formatCurrency(Number(job.estimatedCost))}
                        </p>
                      )}
                      {job.estimatedStartDate && (
                        <p className="text-sm text-white/60">
                          Start: {new Date(job.estimatedStartDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
