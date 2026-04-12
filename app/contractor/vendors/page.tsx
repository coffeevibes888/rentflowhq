import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  Star,
  ShoppingCart,
  Plus,
  Download,
  Search,
  Lock,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { VendorList } from '@/components/contractor/vendor-list';

export default async function VendorsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, businessName: true, subscriptionTier: true },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  const tier = contractorProfile.subscriptionTier || 'starter';
  const hasAccess = tier === 'pro' || tier === 'enterprise';

  if (!hasAccess) {
    return (
      <main className="w-full px-4 py-10 md:px-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-8 text-center">
            <Lock className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white mb-2">Vendor Management</h1>
            <p className="text-slate-300 mb-6">
              Vendor management is available on the Pro plan. Upgrade to track suppliers,
              manage purchase orders, and keep your supply chain organized.
            </p>
            <Link
              href="/contractor/settings/subscription"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              <Zap className="h-5 w-5" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Fetch vendors
  const vendors = await prisma.contractorVendor.findMany({
    where: { contractorId: contractorProfile.id },
    orderBy: { name: 'asc' },
  });

  // Calculate stats
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.isActive).length;
  const avgRating =
    vendors.reduce((sum, v) => sum + Number(v.rating || 0), 0) / totalVendors || 0;
  const totalOrders = vendors.reduce((sum, v) => sum + v.totalOrders, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Vendor Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage suppliers and track purchases
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-2 border-gray-200">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/contractor/vendors/new">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-2 border-black shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Store className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalVendors}</p>
              <p className="text-sm text-gray-600">Total Vendors</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeVendors}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {avgRating.toFixed(1)}
              </p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <ShoppingCart className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalOrders}
              </p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">All Vendors</h3>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-5">
          <VendorList vendors={vendors} />
        </div>
      </div>
    </div>
  );
}
