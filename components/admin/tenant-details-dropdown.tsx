'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Phone, Mail, FileText, Calendar, Home, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import LandlordSignButton from '@/app/admin/leases/[id]/landlord-docusign-sign-button';

type TenantDetails = {
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

export default function TenantDetailsDropdown({ tenant }: { tenant: TenantDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="border-white/10 bg-slate-800/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-lg">{tenant.name}</h3>
              {tenant.needsLandlordSignature && (
                <div className="relative">
                  <Bell className="h-5 w-5 text-amber-400 animate-pulse" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-0">
                    !
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Home className="h-3 w-3 text-slate-400" />
              <p className="text-slate-300 text-sm">{tenant.unitName}</p>
              <Badge variant="outline" className="border-emerald-400/40 text-emerald-200 text-xs">
                {tenant.status}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-300 hover:text-white"
          >
            {isExpanded ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4 pt-4 border-t border-white/10">
            {/* Contact Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h4>
              <div className="space-y-1.5 pl-6">
                {tenant.phone ? (
                  <a
                    href={`tel:${tenant.phone}`}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {tenant.phone}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">No phone number</p>
                )}
                <a
                  href={`mailto:${tenant.email}`}
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {tenant.email}
                </a>
              </div>
            </div>

            {/* Lease Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Lease Information
              </h4>
              <div className="space-y-1.5 pl-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Move-in Date:</span>
                  <span className="text-white font-medium">{formatDate(tenant.startDate)}</span>
                </div>
                {tenant.endDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Lease End:</span>
                    <span className="text-white font-medium">{formatDate(tenant.endDate)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Monthly Rent:</span>
                  <span className="text-white font-medium">{formatCurrency(tenant.rentAmount)}</span>
                </div>
              </div>
            </div>

            {/* Signature Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Signature Status
              </h4>
              <div className="space-y-1.5 pl-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Tenant Signed:</span>
                  {tenant.tenantSignedAt ? (
                    <Badge variant="outline" className="border-green-400/40 text-green-200 text-xs">
                      ✓ {formatDate(tenant.tenantSignedAt)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-400/40 text-slate-300 text-xs">
                      Pending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Landlord Signed:</span>
                  {tenant.landlordSignedAt ? (
                    <Badge variant="outline" className="border-green-400/40 text-green-200 text-xs">
                      ✓ {formatDate(tenant.landlordSignedAt)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-400/40 text-amber-200 text-xs">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Lease Signing Alert */}
            {tenant.needsLandlordSignature && (
              <div className="rounded-lg border-2 border-amber-400/50 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-semibold text-amber-200 text-sm mb-1">
                      Lease Requires Your Signature
                    </h5>
                    <p className="text-xs text-amber-100/80 mb-3">
                      {tenant.name} signed this lease on {formatDate(tenant.tenantSignedAt)}. 
                      Please review and sign to complete the agreement.
                    </p>
                    <LandlordSignButton leaseId={tenant.leaseId} />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href={`/admin/leases/${tenant.leaseId}`}>
                <Button variant="outline" size="sm" className="border-white/20 text-black">
                  <FileText className="h-3 w-3 mr-1" />
                  View Full Lease
                </Button>
              </Link>
              <Link href={`/admin/tenant-messages?tenantId=${tenant.tenantId}`}>
                <Button variant="outline" size="sm" className="border-white/20 text-black">
                  <Mail className="h-3 w-3 mr-1" />
                  Send Message
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
