import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Mail, Phone, Briefcase, Lock, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { checkLimit } from '@/lib/services/contractor-feature-gate';
import { CustomersHeader } from '@/components/contractor/customers-header';

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'contractor') {
    return redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!contractorProfile) {
    return redirect('/contractor/profile');
  }

  // Determine subscription tier
  const tier = contractorProfile.subscriptionTier || 'starter';

  // Check if CRM feature is available
  const hasCRMAccess = tier === 'pro' || tier === 'enterprise';

  if (!hasCRMAccess) {
    return (
      <main className="w-full px-4 py-10 md:px-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-8 text-center">
            <Lock className="h-12 w-12 text-violet-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white mb-2">Customer CRM</h1>
            <p className="text-slate-300 mb-6">
              Customer relationship management features are available on the Pro plan. 
              Upgrade to manage customers, track communication history, and grow your business.
            </p>
            <Link
              href="/contractor/settings/subscription"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              <Zap className="h-5 w-5" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const customers = await prisma.contractorCustomer.findMany({
    where: { contractorId: contractorProfile.id },
    include: {
      _count: {
        select: {
          jobs: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get subscription limit info
  const limitInfo = await checkLimit(contractorProfile.id, 'customers');

  // Calculate stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'customer').length,
    leads: customers.filter(c => c.status === 'lead').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
  };

  const statusColors: Record<string, string> = {
    lead: 'bg-amber-500/30 text-amber-200',
    prospect: 'bg-blue-500/30 text-blue-200',
    customer: 'bg-emerald-500/30 text-emerald-200',
    inactive: 'bg-gray-500/30 text-gray-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <CustomersHeader limitInfo={limitInfo} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300 border-black shadow-2xl overflow-hidden backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-700">Total Customers</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300 border-black shadow-2xl overflow-hidden backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
            <p className="text-sm text-slate-700">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300 border-black shadow-2xl overflow-hidden backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-slate-900">{stats.leads}</p>
            <p className="text-sm text-slate-700">Leads</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300 border-black shadow-2xl overflow-hidden backdrop-blur-md">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-slate-900">{stats.inactive}</p>
            <p className="text-sm text-slate-700">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300 border-black shadow-2xl overflow-hidden backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-700" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/20 border border-slate-300 text-slate-900 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <Button variant="outline" className="border-slate-400 text-slate-900 hover:bg-white/20 font-bold">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-300 border-black shadow-2xl overflow-hidden backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-slate-900">All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-700 text-lg mb-4">No customers yet</p>
              <Link href="/contractor/customers/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-gray-900">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Customer
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/contractor/customers/${customer.id}`}
                  className="block p-4 rounded-lg bg-white/30 hover:bg-white/40 transition-colors border border-slate-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{customer.name}</h3>
                      <Badge className={`${statusColors[customer.status]} mt-1`}>
                        {customer.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-700">
                      <Briefcase className="h-3 w-3" />
                      <span>{customer._count.jobs} jobs</span>
                    </div>
                  </div>

                  {Number(customer.totalSpent) > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-300">
                      <p className="text-sm text-slate-700">Lifetime Value</p>
                      <p className="text-lg font-semibold text-green-700">
                        {formatCurrency(Number(customer.totalSpent))}
                      </p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
