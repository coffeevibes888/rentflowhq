import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock,
  Users,
  FileText,
  Image as ImageIcon,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { JobStatusBadge } from '@/components/contractor/job-status-badge';
import { JobTimeline } from '@/components/contractor/job-timeline';
import { JobExpenses } from '@/components/contractor/job-expenses';
import { JobTimeEntries } from '@/components/contractor/job-time-entries';

export default async function JobDetailPage({
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

  const job = await prisma.contractorJob.findFirst({
    where: {
      id,
      contractorId: contractorProfile.id,
    },
    include: {
      customer: true,
      timeEntries: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
            },
          },
        },
        orderBy: { clockIn: 'desc' },
      },
      expenses: {
        orderBy: { expenseDate: 'desc' },
      },
      changeOrders: {
        orderBy: { createdAt: 'desc' },
      },
      jobMilestones: {
        orderBy: { order: 'asc' },
      },
      jobNotes: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Calculate totals
  const totalHours = job.timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60;
  const totalExpenses = job.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const profitMargin = job.estimatedCost && job.actualCost 
    ? ((Number(job.estimatedCost) - Number(job.actualCost)) / Number(job.estimatedCost)) * 100
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contractor/jobs">
            <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{job.title}</h1>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="text-white/70 mt-1">Job #{job.jobNumber}</p>
          </div>
        </div>
        <Link href={`/contractor/jobs/${job.id}/edit`}>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <Edit className="h-4 w-4 mr-2" />
            Edit Job
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <DollarSign className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {job.estimatedCost ? formatCurrency(Number(job.estimatedCost)) : 'TBD'}
                </p>
                <p className="text-sm text-white/70">Estimated Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Clock className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalHours.toFixed(1)}h</p>
                <p className="text-sm text-white/70">Hours Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <FileText className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
                <p className="text-sm text-white/70">Total Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <TrendingUp className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {profitMargin !== null ? `${profitMargin.toFixed(1)}%` : 'N/A'}
                </p>
                <p className="text-sm text-white/70">Profit Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.description && (
                <div>
                  <p className="text-sm text-white/70 mb-1">Description</p>
                  <p className="text-white">{job.description}</p>
                </div>
              )}

              {job.jobType && (
                <div>
                  <p className="text-sm text-white/70 mb-1">Job Type</p>
                  <Badge className="bg-violet-500/30 text-violet-200">{job.jobType}</Badge>
                </div>
              )}

              {(job.address || job.city || job.state) && (
                <div>
                  <p className="text-sm text-white/70 mb-1">Location</p>
                  <div className="flex items-start gap-2 text-white">
                    <MapPin className="h-4 w-4 mt-0.5 text-white/70" />
                    <div>
                      {job.address && <p>{job.address}</p>}
                      {(job.city || job.state) && (
                        <p>{[job.city, job.state, job.zipCode].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(job.estimatedStartDate || job.estimatedEndDate) && (
                <div>
                  <p className="text-sm text-white/70 mb-1">Timeline</p>
                  <div className="flex items-center gap-2 text-white">
                    <Calendar className="h-4 w-4 text-white/70" />
                    <span>
                      {job.estimatedStartDate && new Date(job.estimatedStartDate).toLocaleDateString()}
                      {job.estimatedEndDate && ` - ${new Date(job.estimatedEndDate).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
              )}

              {job.notes && (
                <div>
                  <p className="text-sm text-white/70 mb-1">Notes</p>
                  <p className="text-white/90 text-sm">{job.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Entries */}
          <JobTimeEntries jobId={job.id} timeEntries={job.timeEntries} />

          {/* Expenses */}
          <JobExpenses jobId={job.id} expenses={job.expenses} />

          {/* Change Orders */}
          {job.changeOrders.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Change Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.changeOrders.map((order) => (
                    <div key={order.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-white">{order.title}</h4>
                        <Badge className={
                          order.status === 'approved' 
                            ? 'bg-green-500/30 text-green-200'
                            : order.status === 'rejected'
                            ? 'bg-red-500/30 text-red-200'
                            : 'bg-amber-500/30 text-amber-200'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/70 mb-2">{order.description}</p>
                      <p className="text-emerald-300 font-semibold">
                        +{formatCurrency(Number(order.additionalCost))}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          {job.customer && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-white">{job.customer.name}</p>
                  {job.customer.email && (
                    <a href={`mailto:${job.customer.email}`} className="text-sm text-violet-300 hover:underline">
                      {job.customer.email}
                    </a>
                  )}
                  {job.customer.phone && (
                    <a href={`tel:${job.customer.phone}`} className="block text-sm text-violet-300 hover:underline">
                      {job.customer.phone}
                    </a>
                  )}
                </div>
                <Link href={`/contractor/customers/${job.customer.id}`}>
                  <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                    View Customer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Estimated Cost</span>
                <span className="font-semibold text-white">
                  {job.estimatedCost ? formatCurrency(Number(job.estimatedCost)) : 'TBD'}
                </span>
              </div>
              {job.laborCost && (
                <div className="flex justify-between">
                  <span className="text-white/70">Labor</span>
                  <span className="text-white">{formatCurrency(Number(job.laborCost))}</span>
                </div>
              )}
              {job.materialCost && (
                <div className="flex justify-between">
                  <span className="text-white/70">Materials</span>
                  <span className="text-white">{formatCurrency(Number(job.materialCost))}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-white/70">Actual Expenses</span>
                <span className="text-amber-300 font-semibold">{formatCurrency(totalExpenses)}</span>
              </div>
              {job.actualCost && (
                <div className="flex justify-between">
                  <span className="text-white/70">Actual Cost</span>
                  <span className="text-white font-semibold">{formatCurrency(Number(job.actualCost))}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                <Clock className="h-4 w-4 mr-2" />
                Log Time
              </Button>
              <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                <FileText className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
              <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                <ImageIcon className="h-4 w-4 mr-2" />
                Upload Photos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
