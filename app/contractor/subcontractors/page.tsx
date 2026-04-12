import { Metadata } from 'next';
import { requireContractor } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Phone, Mail, Star, Plus, Shield, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Subcontractors | Contractor Portal',
};

export default async function SubcontractorsPage() {
  const session = await requireContractor();
  const { id: userId } = session.user;

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!contractorProfile) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Subcontractor Management</h1>
        <p className="text-muted-foreground">Contractor profile not found.</p>
      </div>
    );
  }

  // Fetch subcontractors - using raw query since new model may not be in Prisma client yet
  const subcontractors = await prisma.$queryRaw`
    SELECT * FROM "ContractorSubcontractor"
    WHERE "contractorId" = ${contractorProfile.id}
    ORDER BY "companyName" ASC
  `;

  const subs = Array.isArray(subcontractors) ? subcontractors : [];

  const activeCount = subs.filter((s: any) => s.status === 'active').length;
  const inactiveCount = subs.filter((s: any) => s.status === 'inactive').length;
  const expiringInsurance = subs.filter((s: any) => {
    if (!s.insuranceExpiry) return false;
    const expiry = new Date(s.insuranceExpiry);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expiry <= thirtyDays && s.status === 'active';
  }).length;

  return (
    <div className="relative rounded-2xl border border-rose-200 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-100 via-orange-50 to-rose-100" />
      <div className="relative p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subcontractors</h1>
          <p className="text-slate-600">Manage your subcontractor network</p>
        </div>
        <Link href="/contractor/subcontractors/new">
          <Button className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Add Subcontractor
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium">Active Subs</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium">Inactive</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{inactiveCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">Expiring Insurance</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{expiringInsurance}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-orange-50 border-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-rose-600" />
              <span className="text-sm font-medium">Avg Rating</span>
            </div>
            <div className="mt-2 text-2xl font-bold">
              {subs.length > 0
                ? (subs.reduce((acc: number, s: any) => acc + (s.rating || 0), 0) / subs.length).toFixed(1)
                : '0.0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subcontractors List */}
      <Card className="border-rose-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-900">Your Subcontractors</CardTitle>
        </CardHeader>
        <CardContent>
          {subs.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-900">No subcontractors yet</h3>
              <p className="text-slate-600 mb-4">
                Add subcontractors to assign them to jobs and track their work
              </p>
              <Link href="/contractor/subcontractors/new">
                <Button className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Subcontractor
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {subs.map((sub: any) => (
                <div key={sub.id} className="py-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{sub.companyName}</h3>
                      <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                        {sub.status}
                      </Badge>
                      {sub.insuranceExpiry && new Date(sub.insuranceExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Insurance Expiring
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{sub.contactName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {sub.email}
                      </span>
                      {sub.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {sub.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {sub.specialties?.map((specialty: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/contractor/subcontractors/${sub.id}`}>
                      <Button variant="outline" size="sm">View</Button>
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
