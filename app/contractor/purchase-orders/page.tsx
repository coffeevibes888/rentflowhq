import { Metadata } from 'next';
import { requireContractor } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, ShoppingCart, Truck, DollarSign, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Purchase Orders | Contractor Portal',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  partially_received: 'bg-orange-100 text-orange-800',
  received: 'bg-green-100 text-green-800',
  canceled: 'bg-red-100 text-red-800',
};

export default async function PurchaseOrdersPage() {
  const session = await requireContractor();
  const { id: userId } = session.user;

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!contractorProfile) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Purchase Orders</h1>
        <p className="text-muted-foreground">Contractor profile not found.</p>
      </div>
    );
  }

  // Fetch purchase orders
  const purchaseOrders = await prisma.$queryRaw`
    SELECT po.*, v.name as vendorName 
    FROM "ContractorPurchaseOrder" po
    LEFT JOIN "ContractorVendor" v ON po."vendorId" = v.id
    WHERE po."contractorId" = ${contractorProfile.id}
    ORDER BY po."orderDate" DESC
  `;

  const pos = Array.isArray(purchaseOrders) ? purchaseOrders : [];

  const draftCount = pos.filter((p: any) => p.status === 'draft').length;
  const pendingCount = pos.filter((p: any) => ['sent', 'acknowledged'].includes(p.status)).length;
  const receivedCount = pos.filter((p: any) => p.status === 'received').length;
  const totalValue = pos.reduce((acc: number, p: any) => acc + Number(p.total || 0), 0);

  return (
    <div className="relative rounded-2xl border border-rose-200 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-100 via-orange-50 to-rose-100" />
      <div className="relative p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchase Orders</h1>
          <p className="text-slate-600">Track material orders and deliveries</p>
        </div>
        <Link href="/contractor/purchase-orders/new">
          <Button className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Create Purchase Order
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Draft POs</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{draftCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium">Pending Delivery</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Received</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{receivedCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-orange-50 border-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-rose-600" />
              <span className="text-sm font-medium">Total Value</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* PO List */}
      <Card className="border-rose-100 shadow-md">
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {pos.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No purchase orders yet</h3>
              <p className="text-muted-foreground mb-4">
                Create purchase orders to track material orders from vendors
              </p>
              <Link href="/contractor/purchase-orders/new">
                <Button className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First PO
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-rose-100">
              {pos.map((po: any) => (
                <div key={po.id} className="py-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{po.poNumber}</h3>
                      <Badge className={statusColors[po.status] || 'bg-gray-100'}>
                        {po.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {po.vendorName || 'No vendor assigned'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Order: {new Date(po.orderDate).toLocaleDateString()}</span>
                      {po.requiredDate && (
                        <span>Required: {new Date(po.requiredDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(po.total)}</div>
                    <Link href={`/contractor/purchase-orders/${po.id}`}>
                      <Button variant="outline" size="sm" className="mt-2">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
