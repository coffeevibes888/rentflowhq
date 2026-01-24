import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Plus,
  Download,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { InventoryList } from '@/components/contractor/inventory-list';

export default async function InventoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, businessName: true },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  // Fetch inventory items
  const items = await prisma.contractorInventoryItem.findMany({
    where: { contractorId: contractorProfile.id },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          contactName: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Calculate stats
  const totalItems = items.length;
  const totalValue = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitCost),
    0
  );
  const lowStockItems = items.filter(
    (item) => item.reorderPoint && item.quantity <= item.reorderPoint
  ).length;
  const outOfStockItems = items.filter((item) => item.quantity === 0).length;

  // Get low stock items for alerts
  const lowStockAlerts = items
    .filter((item) => item.reorderPoint && item.quantity <= item.reorderPoint)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Inventory Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track materials, supplies, and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-2 border-gray-200">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/contractor/inventory/new">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-2 border-black shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ${totalValue.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
              <p className="text-sm text-gray-600">Low Stock</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{outOfStockItems}</p>
              <p className="text-sm text-gray-600">Out of Stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 shadow-sm">
          <div className="p-5 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Low Stock Alerts
              </h3>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {lowStockAlerts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border-2 border-amber-200"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.category && `${item.category} • `}
                      SKU: {item.sku || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        item.quantity === 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }
                    >
                      {item.quantity} {item.unit}
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">
                      Reorder at {item.reorderPoint}
                    </p>
                  </div>
                  {item.vendor && (
                    <Link
                      href={`/contractor/vendors/${item.vendor.id}`}
                      className="ml-4"
                    >
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                      >
                        Reorder
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Inventory List */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">All Inventory</h3>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-5">
          <InventoryList items={items} />
        </div>
      </div>
    </div>
  );
}
