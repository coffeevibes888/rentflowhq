import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Wrench, ClipboardList, DollarSign, Building2, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default async function ContractorDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'contractor') {
    return redirect('/');
  }

  // Get contractor profile(s) - a contractor can work with multiple landlords
  const contractors = await prisma.contractor.findMany({
    where: { userId: session.user.id },
    include: {
      landlord: {
        select: { id: true, name: true, companyName: true }
      },
      workOrders: {
        where: { status: { in: ['assigned', 'in_progress'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          property: { select: { name: true, address: true } },
        },
      },
      _count: {
        select: { workOrders: true },
      },
    },
  });

  // Aggregate stats across all landlord relationships
  const activeWorkOrders = contractors.reduce((sum, c) => sum + c.workOrders.length, 0);
  const totalJobs = contractors.reduce((sum, c) => sum + c._count.workOrders, 0);
  const landlordCount = contractors.length;

  // Get all active work orders for display
  const allActiveOrders = contractors.flatMap(c => 
    c.workOrders.map(wo => ({ ...wo, landlordName: c.landlord.companyName || c.landlord.name }))
  ).slice(0, 5);

  // Calculate earnings (completed work orders)
  const completedOrders = await prisma.workOrder.findMany({
    where: {
      contractorId: { in: contractors.map(c => c.id) },
      status: 'completed',
    },
    select: { agreedPrice: true, actualCost: true },
  });

  const totalEarnings = completedOrders.reduce((sum, o) => 
    sum + Number(o.actualCost || o.agreedPrice || 0), 0
  );

  const stats = [
    {
      title: 'Active Jobs',
      value: activeWorkOrders,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/contractor/work-orders',
    },
    {
      title: 'Total Jobs',
      value: totalJobs,
      icon: Wrench,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      href: '/contractor/work-orders',
    },
    {
      title: 'Landlords',
      value: landlordCount,
      icon: Building2,
      color: 'text-violet-600',
      bgColor: 'bg-violet-100',
      href: '/contractor/landlords',
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(totalEarnings),
      icon: DollarSign,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      href: '/contractor/payouts',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {session.user.name?.split(' ')[0] || 'Contractor'}!
        </h1>
        <p className="text-slate-600 mt-1">Here's an overview of your work</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:border-violet-400/60 transition-colors cursor-pointer">
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
            </Link>
          );
        })}
      </div>

      {/* Active Work Orders */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-900">Active Work Orders</CardTitle>
          <Link href="/contractor/work-orders" className="text-sm text-violet-600 hover:text-violet-500">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {allActiveOrders.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No active work orders</p>
              <p className="text-sm text-slate-400 mt-1">
                Work orders will appear here when assigned by property managers
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allActiveOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/contractor/work-orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{order.title}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {order.property.name} • {order.landlordName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 font-medium">
                      {formatCurrency(Number(order.agreedPrice))}
                    </span>
                    <span className={`
                      px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                      ${order.status === 'assigned' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
                    `}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/contractor/estimates">
          <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer shadow-xl">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-white mb-2" />
              <p className="text-sm font-medium text-white">Create Estimate</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contractor/time-tracking">
          <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer shadow-xl">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto text-white mb-2" />
              <p className="text-sm font-medium text-white">Track Time</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contractor/portfolio">
          <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer shadow-xl">
            <CardContent className="p-4 text-center">
              <Wrench className="h-8 w-8 mx-auto text-white mb-2" />
              <p className="text-sm font-medium text-white">Upload Work</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contractor/payouts">
          <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer shadow-xl">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-white mb-2" />
              <p className="text-sm font-medium text-white">View Payouts</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Not Connected Notice */}
      {contractors.length === 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-amber-800">
              <strong>Note:</strong> You're not yet connected to any property managers. 
              If you have an invite code, you can enter it in your profile settings. 
              Otherwise, property managers can find you in the contractor marketplace.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
