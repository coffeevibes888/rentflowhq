import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Briefcase, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { JobStatusBadge } from '@/components/contractor/job-status-badge';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id || session.user.role !== 'contractor') {
    return redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!contractorProfile) {
    return redirect('/contractor/profile');
  }

  const customer = await prisma.contractorCustomer.findFirst({
    where: {
      id,
      contractorId: contractorProfile.id,
    },
    include: {
      jobs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    lead: 'bg-amber-500/30 text-amber-200',
    prospect: 'bg-blue-500/30 text-blue-200',
    customer: 'bg-emerald-500/30 text-emerald-200',
    inactive: 'bg-gray-500/30 text-gray-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contractor/customers">
            <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{customer.name}</h1>
              <Badge className={statusColors[customer.status]}>
                {customer.status}
              </Badge>
            </div>
            <p className="text-white/70 mt-1">Customer since {new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white">
          <Edit className="h-4 w-4 mr-2" />
          Edit Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <DollarSign className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(Number(customer.totalSpent))}
                </p>
                <p className="text-sm text-white/70">Lifetime Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Briefcase className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{customer.totalJobs}</p>
                <p className="text-sm text-white/70">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-white/70 mb-1">Last Contact</p>
              <p className="text-white">
                {customer.lastContactedAt 
                  ? new Date(customer.lastContactedAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-white/70 mb-1">Last Job</p>
              <p className="text-white">
                {customer.lastJobAt 
                  ? new Date(customer.lastJobAt).toLocaleDateString()
                  : 'No jobs yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Jobs */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Jobs</CardTitle>
              <Link href={`/contractor/jobs/new?customerId=${customer.id}`}>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                  New Job
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {customer.jobs.length === 0 ? (
                <p className="text-white/70 text-center py-8">No jobs yet</p>
              ) : (
                <div className="space-y-3">
                  {customer.jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/contractor/jobs/${job.id}`}
                      className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{job.title}</h4>
                            <JobStatusBadge status={job.status} />
                          </div>
                          <p className="text-sm text-white/60">{job.jobNumber}</p>
                        </div>
                        {job.estimatedCost && (
                          <p className="text-lg font-semibold text-emerald-300">
                            {formatCurrency(Number(job.estimatedCost))}
                          </p>
                        )}
                      </div>
                      {job.estimatedStartDate && (
                        <p className="text-sm text-white/60">
                          Start: {new Date(job.estimatedStartDate).toLocaleDateString()}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-white/70 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/70">Email</p>
                    <a href={`mailto:${customer.email}`} className="text-white hover:text-violet-300">
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-white/70 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/70">Phone</p>
                    <a href={`tel:${customer.phone}`} className="text-white hover:text-violet-300">
                      {customer.phone}
                    </a>
                  </div>
                </div>
              )}

              {customer.address && typeof customer.address === 'object' && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-white/70 mt-0.5" />
                  <div>
                    <p className="text-sm text-white/70">Address</p>
                    <p className="text-white">
                      {(customer.address as any).street}<br />
                      {(customer.address as any).city}, {(customer.address as any).state} {(customer.address as any).zip}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {customer.tags.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map((tag, index) => (
                    <Badge key={index} className="bg-white/10 text-white">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/contractor/jobs/new?customerId=${customer.id}`}>
                <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                  Create Job
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                Send Email
              </Button>
              <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                Add Note
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
