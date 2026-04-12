'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type TenantOption = {
  leaseId: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  unitName: string;
  status: string;
  startDate: string;
  endDate?: string;
  rentAmount: number;
  needsLandlordSignature?: boolean;
  tenantSignedAt?: string;
  landlordSignedAt?: string;
};

export default function EvictionFlow({
  tenants,
  propertyId,
}: {
  tenants: TenantOption[];
  propertyId: string;
}) {
  const { toast } = useToast();
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.tenantId || '');
  const [reason, setReason] = useState('');
  const [amountOwed, setAmountOwed] = useState('');
  const [deadline, setDeadline] = useState('');
  const [portalUrl, setPortalUrl] = useState('https://www.nvcourts.gov/');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFlow, setShowFlow] = useState(false);

  const tenant = useMemo(
    () => tenants.find((t) => t.tenantId === selectedTenantId) ?? tenants[0],
    [selectedTenantId, tenants]
  );

  const handleStartEviction = async () => {
    if (!tenant) {
      toast({ variant: 'destructive', description: 'Select a tenant first.' });
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/evictions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.tenantId,
          leaseId: tenant.leaseId,
          propertyId,
          reason,
          amountOwed,
          deadline,
          portalUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to start eviction');
      }
      toast({ description: 'Eviction notice created. Tenant will be notified.' });
    } catch (error: any) {
      toast({ variant: 'destructive', description: error?.message || 'Failed to start eviction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!tenants.length) {
    return (
      <Card className="border-white/10 bg-slate-800/60">
        <CardContent className="py-6 text-sm text-slate-300">
          No active tenants found for this property yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Label className="text-slate-300">Select tenant</Label>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="w-full bg-slate-800 border-white/10 text-white md:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-white border-white/10">
              {tenants.map((t) => (
                <SelectItem key={t.tenantId} value={t.tenantId}>
                  {t.name} — {t.unitName} ({t.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {tenant && (
          <div className="rounded-xl border border-white/10 bg-slate-800/60 p-4 text-sm text-slate-200 w-full md:w-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-white">{tenant.name}</div>
                <p className="text-slate-300 text-xs mt-1">{tenant.unitName}</p>
              </div>
              {tenant.needsLandlordSignature && (
                <div className="relative">
                  <Bell className="h-5 w-5 text-amber-400 animate-pulse" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-0">
                    !
                  </Badge>
                </div>
              )}
            </div>
            <p className="text-slate-300 text-xs">{tenant.email}</p>
            {tenant.phone && <p className="text-slate-300 text-xs">{tenant.phone}</p>}
            {tenant.needsLandlordSignature && (
              <p className="text-amber-400 text-xs mt-2 font-medium">
                Lease requires your signature
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Link href={`/admin/leases/${tenant.leaseId}`}>
                <Button variant="outline" size="sm" className="border-white/20 text-black">
                  View Lease
                </Button>
              </Link>
              <Button variant="secondary" size="sm" className="text-black" onClick={() => setShowFlow(true)}>
                Start Eviction
              </Button>
            </div>
          </div>
        )}
      </div>

      {showFlow ? (
        <Card className="border-white/10 bg-slate-800/60">
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Reason</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Non-payment of rent, violation of lease terms, nuisance, etc."
                  className="bg-slate-900 border-white/10 text-white"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Amount owed</Label>
                <Input
                  value={amountOwed}
                  onChange={(e) => setAmountOwed(e.target.value)}
                  placeholder="$0.00"
                  className="bg-slate-900 border-white/10 text-white"
                />
                <Label className="text-slate-200 mt-2">Deadline to cure or vacate</Label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-slate-900 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">State eviction portal link</Label>
              <Input
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
                placeholder="https://your-state-eviction-portal.example"
                className="bg-slate-900 border-white/10 text-white"
              />
              <p className="text-[11px] text-slate-400">
                Provide the official state or county portal where the eviction notice will be filed.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleStartEviction} disabled={isSubmitting}>
                {isSubmitting ? 'Starting...' : 'Generate & notify'}
              </Button>
              <Button variant="outline" className="border-white/20" onClick={handlePrint}>
                Print
              </Button>
              <Button asChild variant="secondary">
                <a href={portalUrl || '#'} target="_blank" rel="noreferrer">
                  Open state portal
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-800/40 p-4 text-sm text-slate-300">
          Click <span className="font-semibold text-white">Start Eviction</span> to open the flow.
        </div>
      )}
    </div>
  );
}
