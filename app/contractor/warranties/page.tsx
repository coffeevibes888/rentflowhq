import { Metadata } from 'next';
import { requireContractor } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Warranties | Contractor Portal',
};

export default async function WarrantiesPage() {
  const session = await requireContractor();
  const { id: userId } = session.user;

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!contractorProfile) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Warranties</h1>
        <p className="text-muted-foreground">Contractor profile not found.</p>
      </div>
    );
  }

  // Fetch warranties
  const warranties = await prisma.$queryRaw`
    SELECT w.*, c.name as customerName 
    FROM "ContractorWarranty" w
    LEFT JOIN "ContractorCustomer" c ON w."customerId" = c.id
    WHERE w."contractorId" = ${contractorProfile.id}
    ORDER BY w."endDate" ASC
  `;

  const warrantyList = Array.isArray(warranties) ? warranties : [];

  const now = new Date();
  const activeCount = warrantyList.filter((w: any) => w.status === 'active' && new Date(w.endDate) > now).length;
  const expiringSoon = warrantyList.filter((w: any) => {
    if (w.status !== 'active') return false;
    const end = new Date(w.endDate);
    const ninetyDays = new Date(now);
    ninetyDays.setDate(ninetyDays.getDate() + 90);
    return end <= ninetyDays && end > now;
  }).length;
  const expiredCount = warrantyList.filter((w: any) => new Date(w.endDate) <= now).length;
  const claimedCount = warrantyList.filter((w: any) => w.status === 'claimed').length;

  return (
    <div className="relative rounded-2xl border border-rose-200 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-100 via-orange-50 to-rose-100" />
      <div className="relative p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warranties & Service Agreements</h1>
          <p className="text-slate-600">Track warranty coverage and service agreements</p>
        </div>
        <Link href="/contractor/warranties/new">
          <Button className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            New Warranty
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">Expiring Soon</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{expiringSoon}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium">Expired</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{expiredCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-orange-50 border-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-rose-600" />
              <span className="text-sm font-medium">Claims</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{claimedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Warranties List */}
      <Card className="border-rose-100 shadow-md">
        <CardHeader>
          <CardTitle>All Warranties</CardTitle>
        </CardHeader>
        <CardContent>
          {warrantyList.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No warranties tracked yet</h3>
              <p className="text-muted-foreground mb-4">
                Add warranties to track coverage periods and auto-remind customers
              </p>
              <Link href="/contractor/warranties/new">
                <Button className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Warranty
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-rose-100">
              {warrantyList.map((w: any) => {
                const endDate = new Date(w.endDate);
                const isExpired = endDate <= now;
                const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={w.id} className="py-4 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{w.title}</h3>
                        <Badge variant={isExpired ? 'destructive' : 'default'}>
                          {isExpired ? 'Expired' : `${daysRemaining} days left`}
                        </Badge>
                        <Badge variant="outline">{w.warrantyType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{w.customerName}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Started: {new Date(w.startDate).toLocaleDateString()}</span>
                        <span>Ends: {endDate.toLocaleDateString()}</span>
                        <span>{w.durationMonths} months</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/contractor/warranties/${w.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
