import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, CheckCircle, Clock, AlertCircle, Info, ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default async function ContractorWorkOrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'contractor') {
    return redirect('/');
  }

  const contractors = await prisma.contractor.findMany({
    where: { userId: session.user.id },
    select: { id: true, landlordId: true },
  });

  const contractorIds = contractors.map(c => c.id);

  const workOrders = await prisma.workOrder.findMany({
    where: { contractorId: { in: contractorIds } },
    orderBy: { createdAt: 'desc' },
    include: {
      property: { select: { name: true, address: true } },
      landlord: { select: { name: true, companyName: true } },
    },
  });

  const statusGroups = {
    pending: workOrders.filter(wo => wo.status === 'assigned' || wo.status === 'draft'),
    inProgress: workOrders.filter(wo => wo.status === 'in_progress'),
    completed: workOrders.filter(wo => ['completed', 'approved', 'paid'].includes(wo.status)),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Work Orders</h1>
        <p className="text-slate-600 mt-1">Jobs assigned to you by property managers</p>
      </div>

      {/* Explainer Banner */}
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 shrink-0">
            <Info className="h-4 w-4 text-blue-600" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900">What are Work Orders?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Work orders are created by <span className="font-semibold">property managers and landlords</span> when they need maintenance or repairs done on their properties. They assign work orders directly to you, or post them as open bids where you can compete for the job. Payment is held in escrow and released when the work is approved.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Building2 className="h-3.5 w-3.5" />
                <span>Comes from property managers</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Escrow-protected payments</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Looking for your own client projects? Those are in <Link href="/contractor/jobs" className="text-blue-600 hover:text-blue-700 underline font-medium">Jobs</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300 border-black shadow-2xl overflow-hidden backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-slate-900" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{statusGroups.pending.length}</p>
              <p className="text-xs text-slate-700">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300 border-black shadow-2xl overflow-hidden backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-slate-900" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{statusGroups.inProgress.length}</p>
              <p className="text-xs text-slate-700">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300 border-black shadow-2xl overflow-hidden backdrop-blur-md">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-slate-900" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{statusGroups.completed.length}</p>
              <p className="text-xs text-slate-700">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Orders List */}
      <Card className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300 border-black shadow-2xl overflow-hidden backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-slate-900">All Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {workOrders.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-700 text-lg font-semibold">No work orders yet</p>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                Work orders appear here when property managers assign maintenance or repair jobs to you. You can also browse and bid on open jobs in the marketplace.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Link
                  href="/contractors?view=jobs"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Browse Open Jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {workOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/contractor/work-orders/${order.id}`}
                  className="block p-4 rounded-lg bg-white/30 hover:bg-white/40 transition-colors border border-slate-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{order.title}</h3>
                        <span className={`
                          px-2 py-0.5 rounded text-xs font-medium
                          ${order.priority === 'urgent' ? 'bg-red-100 text-red-700' : ''}
                          ${order.priority === 'high' ? 'bg-orange-100 text-orange-700' : ''}
                          ${order.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${order.priority === 'low' ? 'bg-slate-100 text-slate-600' : ''}
                        `}>
                          {order.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 truncate">{order.description}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {order.property.name} • {order.landlord.companyName || order.landlord.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-green-700">
                        {order.agreedPrice ? formatCurrency(Number(order.agreedPrice)) : 'TBD'}
                      </p>
                      <span className={`
                        inline-block px-2 py-1 rounded text-xs font-medium mt-1
                        ${order.status === 'draft' ? 'bg-slate-100 text-slate-700' : ''}
                        ${order.status === 'assigned' ? 'bg-amber-100 text-amber-700' : ''}
                        ${order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : ''}
                        ${order.status === 'completed' ? 'bg-cyan-100 text-cyan-700' : ''}
                        ${order.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${order.status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                      `}>
                        {order.status.replace('_', ' ')}
                      </span>
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
