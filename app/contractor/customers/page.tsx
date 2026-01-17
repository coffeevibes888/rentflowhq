import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Mail, Phone, Briefcase } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-white/70 mt-1">Manage your customer relationships</p>
        </div>
        <Link href="/contractor/customers/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-white/70">Total Customers</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-300">{stats.active}</p>
            <p className="text-sm text-white/70">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-300">{stats.leads}</p>
            <p className="text-sm text-white/70">Leads</p>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-300">{stats.inactive}</p>
            <p className="text-sm text-white/70">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg mb-4">No customers yet</p>
              <Link href="/contractor/customers/new">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
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
                  className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{customer.name}</h3>
                      <Badge className={`${statusColors[customer.status]} mt-1`}>
                        {customer.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/60">
                      <Briefcase className="h-3 w-3" />
                      <span>{customer._count.jobs} jobs</span>
                    </div>
                  </div>

                  {customer.totalSpent > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-sm text-white/60">Lifetime Value</p>
                      <p className="text-lg font-semibold text-emerald-300">
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
