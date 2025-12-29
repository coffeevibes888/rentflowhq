import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
        <p className="text-slate-600 mt-1">Manage and track your jobs</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{statusGroups.pending.length}</p>
              <p className="text-xs text-amber-700">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{statusGroups.inProgress.length}</p>
              <p className="text-xs text-blue-700">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">{statusGroups.completed.length}</p>
              <p className="text-xs text-emerald-700">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Orders List */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-slate-900">All Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {workOrders.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">No work orders yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Work orders will appear here when property managers assign jobs to you
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {workOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/contractor/work-orders/${order.id}`}
                  className="block p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
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
                      <p className="text-sm text-slate-500 truncate">{order.description}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {order.property.name} • {order.landlord.companyName || order.landlord.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-emerald-600">
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
