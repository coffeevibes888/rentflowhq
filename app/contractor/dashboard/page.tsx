import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Wrench, ClipboardList, DollarSign, Building2, Clock, TrendingUp, Briefcase, Gavel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  // Get contractor's bids
  const myBids = await prisma.workOrderBid.findMany({
    where: {
      contractorId: { in: contractors.map(c => c.id) },
      status: 'pending',
    },
    include: {
      workOrder: {
        select: {
          id: true,
          title: true,
          budgetMin: true,
          budgetMax: true,
          property: { select: { name: true } },
          landlord: { select: { name: true, companyName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Get count of open jobs in marketplace
  const openJobsCount = await prisma.workOrder.count({
    where: {
      isOpenBid: true,
      status: 'open',
    },
  });

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {session.user.name?.split(' ')[0] || 'Contractor'}!
          </h1>
          <p className="text-slate-600 mt-1">Here's an overview of your work</p>
        </div>
        <div className="flex gap-3">
          <Link href="/contractors?view=jobs">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90">
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
          </Link>
          <Link href="/contractor/profile">
            <Button variant="outline">
              View Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:border-violet-400/60 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className={`p-2 lg:p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs lg:text-sm text-slate-500">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Open Jobs Banner */}
      {openJobsCount > 0 && (
        <Link href="/contractors?view=jobs">
          <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 border-white/20 hover:opacity-95 transition-opacity cursor-pointer">
            <CardContent className="p-4 lg:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="p-2 lg:p-3 rounded-lg bg-white/20">
                  <Briefcase className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg lg:text-xl">{openJobsCount} Open Jobs Available</p>
                  <p className="text-sm lg:text-base text-white/80">Browse and bid on new opportunities</p>
                </div>
              </div>
              <Badge className="bg-white text-blue-600 hover:bg-white/90 text-sm lg:text-base px-3 lg:px-4 py-1 lg:py-2">Browse Jobs →</Badge>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Main Content Grid - 3 columns on large screens */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Work Orders - spans 2 columns on large screens */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900">Active Work Orders</CardTitle>
            <Link href="/contractor/work-orders" className="text-sm text-violet-600 hover:text-violet-500">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {allActiveOrders.length === 0 ? (
              <div className="text-center py-8 lg:py-12">
                <ClipboardList className="h-12 w-12 lg:h-16 lg:w-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">No active work orders</p>
                <p className="text-sm text-slate-400 mt-1">
                  Work orders will appear here when assigned
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allActiveOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/contractor/work-orders/${order.id}`}
                    className="flex items-center justify-between p-3 lg:p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{order.title}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {order.property.name} • {order.landlordName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600 font-medium">
                        {formatCurrency(Number(order.agreedPrice || 0))}
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

        {/* My Bids */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Gavel className="h-5 w-5 text-cyan-600" />
              My Pending Bids
            </CardTitle>
            <Link href="/contractors?view=jobs" className="text-sm text-cyan-600 hover:text-cyan-500">
              Find more →
            </Link>
          </CardHeader>
          <CardContent>
            {myBids.length === 0 ? (
              <div className="text-center py-8">
                <Gavel className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No pending bids</p>
                <p className="text-sm text-slate-400 mt-1">
                  Browse open jobs and submit bids
                </p>
                <Link href="/contractors?view=jobs">
                  <Badge className="mt-4 bg-cyan-100 text-cyan-700 hover:bg-cyan-200 cursor-pointer">
                    Browse Open Jobs
                  </Badge>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myBids.map((bid) => (
                  <div
                    key={bid.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{bid.workOrder.title}</p>
                        <p className="text-sm text-slate-500 truncate">
                          {bid.workOrder.property.name}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-slate-500">
                        Budget: {bid.workOrder.budgetMin && bid.workOrder.budgetMax 
                          ? `${formatCurrency(Number(bid.workOrder.budgetMin))} - ${formatCurrency(Number(bid.workOrder.budgetMax))}`
                          : 'TBD'}
                      </span>
                      <span className="font-semibold text-cyan-600">
                        Your bid: {formatCurrency(Number(bid.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Full width grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/contractors?view=jobs">
            <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 border-white/20 hover:opacity-90 transition-opacity cursor-pointer shadow-xl h-full">
              <CardContent className="p-4 lg:p-6 text-center">
                <Briefcase className="h-8 w-8 lg:h-10 lg:w-10 mx-auto text-white mb-2" />
                <p className="text-sm lg:text-base font-medium text-white">Browse Jobs</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/contractor/work-orders">
            <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer shadow-xl h-full">
              <CardContent className="p-4 lg:p-6 text-center">
                <ClipboardList className="h-8 w-8 lg:h-10 lg:w-10 mx-auto text-white mb-2" />
                <p className="text-sm lg:text-base font-medium text-white">Work Orders</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/contractor/estimates">
            <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer shadow-xl h-full">
              <CardContent className="p-4 lg:p-6 text-center">
                <TrendingUp className="h-8 w-8 lg:h-10 lg:w-10 mx-auto text-white mb-2" />
                <p className="text-sm lg:text-base font-medium text-white">Estimates</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/contractor/time-tracking">
            <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer shadow-xl h-full">
              <CardContent className="p-4 lg:p-6 text-center">
                <Clock className="h-8 w-8 lg:h-10 lg:w-10 mx-auto text-white mb-2" />
                <p className="text-sm lg:text-base font-medium text-white">Track Time</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/contractor/portfolio">
            <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer shadow-xl h-full">
              <CardContent className="p-4 lg:p-6 text-center">
                <Wrench className="h-8 w-8 lg:h-10 lg:w-10 mx-auto text-white mb-2" />
                <p className="text-sm lg:text-base font-medium text-white">Portfolio</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/contractor/payouts">
            <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-white/20 hover:opacity-90 transition-opacity cursor-pointer shadow-xl h-full">
              <CardContent className="p-4 lg:p-6 text-center">
                <DollarSign className="h-8 w-8 lg:h-10 lg:w-10 mx-auto text-white mb-2" />
                <p className="text-sm lg:text-base font-medium text-white">Payouts</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Not Connected Notice */}
      {contractors.length === 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 lg:p-6">
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
