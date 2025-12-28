import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Wrench, ClipboardList, DollarSign, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ContractorDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'contractor') {
    return redirect('/');
  }

  // Get contractor profile
  const contractor = await prisma.contractor.findFirst({
    where: { userId: session.user.id },
    include: {
      workOrders: {
        where: { status: { in: ['pending', 'in_progress'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          property: { select: { name: true } },
        },
      },
      _count: {
        select: { workOrders: true },
      },
    },
  });

  const stats = [
    {
      title: 'Active Work Orders',
      value: contractor?.workOrders.length || 0,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Jobs',
      value: contractor?._count.workOrders || 0,
      icon: Wrench,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {contractor?.name || session.user.name?.split(' ')[0] || 'Contractor'}!
        </h1>
        <p className="text-slate-600 mt-1">Manage your work orders and payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Active Work Orders */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle>Active Work Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {!contractor || contractor.workOrders.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No active work orders</p>
              <p className="text-sm text-slate-400 mt-1">
                Work orders will appear here when assigned by property managers
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contractor.workOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{order.title}</p>
                    <p className="text-sm text-slate-500">{order.property.name}</p>
                  </div>
                  <span className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
                  `}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      {!contractor && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-amber-800">
              <strong>Note:</strong> You're not yet connected to any property managers. 
              Once a property manager invites you, you'll be able to receive work orders here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
