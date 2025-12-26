'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import {
  Users,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  FileText,
  FileSignature,
  Loader2,
} from 'lucide-react';
import { TenantActionsMenu } from './tenant-actions-menu';
import { EvictionNoticeModal } from './eviction-notice-modal';
import { DepartureModal } from './departure-modal';
import { TerminateLeaseModal } from './terminate-lease-modal';
import { DepositDispositionModal } from './deposit-disposition-modal';
import { EvictionHistoryPanel } from './eviction-history-panel';

interface EnhancedTenantCardProps {
  lease: any;
  isExpanded: boolean;
  onToggle: () => void;
  propertyId: string;
  onViewLease: () => void;
  onRefresh?: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    pending: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    overdue: 'bg-red-500/20 text-red-300 border-red-400/30',
    cancelled: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  };
  return (
    <Badge className={`${styles[status] || styles.pending} text-[10px] sm:text-xs`}>
      {status}
    </Badge>
  );
}

export function EnhancedTenantCard({
  lease,
  isExpanded,
  onToggle,
  propertyId,
  onViewLease,
  onRefresh,
}: EnhancedTenantCardProps) {
  const router = useRouter();
  const tenant = lease.tenant;
  const payments = lease.rentPayments || [];
  const paidPayments = payments.filter((p: any) => p.status === 'paid');
  const overduePayments = payments.filter((p: any) => p.status === 'overdue');
  const totalOwed = payments
    .filter((p: any) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  // Check if tenant has signed but landlord hasn't
  const tenantSignature = lease.signatureRequests?.find((sr: any) => sr.role === 'tenant');
  const landlordSignature = lease.signatureRequests?.find((sr: any) => sr.role === 'landlord');
  const tenantSigned = tenantSignature?.status === 'signed';
  const landlordSigned = landlordSignature?.status === 'signed';
  const needsLandlordSignature = tenantSigned && !landlordSigned;
  const isPendingSignature = lease.status === 'pending_signature';

  // Modal states
  const [showEvictionModal, setShowEvictionModal] = useState(false);
  const [showDepartureModal, setShowDepartureModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);

  // Tab state for expanded content
  const [activeTab, setActiveTab] = useState('overview');

  const handleRefresh = () => {
    onRefresh?.();
  };

  // Handle landlord signing
  const handleSignLease = async () => {
    setSigningLoading(true);
    try {
      const res = await fetch(`/api/leases/${lease.id}/sign-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'landlord' }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Failed to initiate signing');
        return;
      }

      const data = await res.json();
      const token = data.token || '';
      if (!token) {
        alert('Signing link missing');
        return;
      }
      
      router.push(`/sign/${token}`);
    } catch (error) {
      console.error('Sign error:', error);
      alert('An error occurred while initiating signing');
    } finally {
      setSigningLoading(false);
    }
  };

  // Calculate deposit amount (from lease or default)
  const depositAmount = lease.securityDeposit || lease.rentAmount || 0;

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden">
        {/* Header - Always visible */}
        <div className="w-full p-3 sm:p-4 flex items-center justify-between">
          <button
            onClick={onToggle}
            className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 flex items-center justify-center flex-shrink-0">
              {tenant?.image ? (
                <Image
                  src={tenant.image}
                  alt={tenant.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div className="text-left min-w-0">
              <p className="font-semibold text-white truncate">
                {tenant?.name || 'Unknown Tenant'}
              </p>
              <p className="text-xs text-slate-400">
                Unit {lease.unitName} • {formatCurrency(Number(lease.rentAmount))}/mo
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
            {overduePayments.length > 0 && (
              <Badge className="bg-red-500/20 text-red-300 border-red-400/30 text-[10px] sm:text-xs whitespace-nowrap">
                {formatCurrency(totalOwed)}{' '}
                <span className="hidden sm:inline">overdue</span>
              </Badge>
            )}
            {isPendingSignature && (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-[10px] sm:text-xs hidden sm:flex">
                {needsLandlordSignature ? 'Sign Now' : 'Pending'}
              </Badge>
            )}
            <TenantActionsMenu
              lease={lease}
              propertyId={propertyId}
              onStartEviction={() => setShowEvictionModal(true)}
              onRecordDeparture={() => setShowDepartureModal(true)}
              onTerminateLease={() => setShowTerminateModal(true)}
              onProcessDeposit={() => setShowDepositModal(true)}
              onViewNotices={() => setShowHistoryPanel(true)}
            />
            <button onClick={onToggle}>
              <ChevronRight
                className={`w-5 h-5 text-slate-400 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Expanded Content with Tabs */}
        {isExpanded && (
          <div className="border-t border-white/10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start bg-slate-900/40 rounded-none border-b border-white/10 p-1 h-auto">
                <TabsTrigger
                  value="overview"
                  className="text-xs sm:text-sm data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="text-xs sm:text-sm data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                >
                  Payments
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="text-xs sm:text-sm data-[state=active]:bg-slate-800 data-[state=active]:text-white"
                >
                  Documents
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="p-4 space-y-4 mt-0">
                {/* Verification Status */}
                {tenant?.verification && (
                  <div className="rounded-lg border border-blue-400/30 bg-blue-500/10 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Verified Tenant</p>
                          <p className="text-xs text-slate-400">
                            ID:{' '}
                            {tenant.verification.identityStatus === 'verified'
                              ? '✓'
                              : '○'}{' '}
                            • Income:{' '}
                            {tenant.verification.employmentStatus === 'verified'
                              ? '✓'
                              : '○'}
                          </p>
                        </div>
                      </div>
                      {tenant.verification.monthlyIncome && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Verified Income</p>
                          <p className="text-lg font-bold text-emerald-400">
                            ${tenant.verification.monthlyIncome.toLocaleString()}/mo
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300 truncate">
                      {tenant?.email || 'No email'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300">
                      {tenant?.phoneNumber || 'No phone'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300">
                      Move-in: {new Date(lease.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300">
                      Ends:{' '}
                      {lease.endDate
                        ? new Date(lease.endDate).toLocaleDateString()
                        : 'Month-to-month'}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center rounded-lg border border-white/10 bg-slate-900/40 p-3">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                      {paidPayments.length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400">On Time</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-red-400">
                      {overduePayments.length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400">Late</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {formatCurrency(totalOwed)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400">Balance</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {needsLandlordSignature ? (
                    <Button
                      size="sm"
                      onClick={handleSignLease}
                      disabled={signingLoading}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 text-xs sm:text-sm"
                    >
                      {signingLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
                      ) : (
                        <FileSignature className="w-4 h-4 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">Sign Lease Now</span>
                      <span className="sm:hidden">Sign</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={onViewLease}
                      className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 text-white hover:opacity-90 text-xs sm:text-sm"
                    >
                      <FileSignature className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">View Lease</span>
                      <span className="sm:hidden">Lease</span>
                    </Button>
                  )}
                  {tenant?.applicationId && (
                    <Link href={`/admin/applications/${tenant.applicationId}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-black text-xs sm:text-sm"
                      >
                        <FileText className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">View ID & Documents</span>
                        <span className="sm:hidden">Docs</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="p-4 space-y-4 mt-0">
                <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3 sm:p-4">
                  <h4 className="text-sm font-medium text-white mb-3">
                    Payment History
                  </h4>
                  {payments.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {payments.map((payment: any) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between text-xs sm:text-sm gap-2 py-2 border-b border-white/5 last:border-0"
                        >
                          <span className="text-slate-400">
                            {new Date(payment.dueDate).toLocaleDateString()}
                          </span>
                          <span className="text-slate-300">
                            {formatCurrency(Number(payment.amount))}
                          </span>
                          <StatusBadge status={payment.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No payment history
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="p-4 space-y-4 mt-0">
                <div className="space-y-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onViewLease}
                    className="w-full justify-start border-white/10 text-slate-300 hover:bg-slate-800"
                  >
                    <FileSignature className="w-4 h-4 mr-2" />
                    Lease Agreement
                  </Button>
                  {tenant?.applicationId && (
                    <Link
                      href={`/admin/applications/${tenant.applicationId}`}
                      className="block"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start border-white/10 text-slate-300 hover:bg-slate-800"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Application Documents
                      </Button>
                    </Link>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Modals */}
      <EvictionNoticeModal
        isOpen={showEvictionModal}
        onClose={() => setShowEvictionModal(false)}
        lease={lease}
        propertyId={propertyId}
        onSuccess={handleRefresh}
      />

      <DepartureModal
        isOpen={showDepartureModal}
        onClose={() => setShowDepartureModal(false)}
        lease={lease}
        onSuccess={handleRefresh}
      />

      <TerminateLeaseModal
        isOpen={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
        lease={lease}
        onSuccess={handleRefresh}
      />

      <DepositDispositionModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        lease={lease}
        depositAmount={Number(depositAmount)}
        outstandingBalance={totalOwed}
        onSuccess={handleRefresh}
      />

      <EvictionHistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        leaseId={lease.id}
        tenantName={tenant?.name || 'Unknown'}
      />
    </>
  );
}
