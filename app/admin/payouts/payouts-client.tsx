'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StripeConnectOnboarding from '@/components/admin/stripe-connect-onboarding';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Building2,
} from 'lucide-react';
import {
  consolidateMoveInPayments,
  getStatusLabel,
  type GroupedPayment,
} from '@/lib/utils/payment-grouping';

interface ConnectStatus {
  hasAccount: boolean;
  isOnboarded: boolean;
  canReceivePayouts: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  bankAccountLast4?: string | null;
}

interface RentPayment {
  id: string;
  amount: number;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  estimatedArrival: string | null;
  metadata?: Record<string, unknown> | null;
  dueDate?: string | null;
}

interface PayoutsClientProps {
  connectStatus: ConnectStatus | null;
  recentPayments: RentPayment[];
  totalReceived: number;
  pendingAmount: number;
  thisMonthAmount: number;
}

export default function PayoutsClient({
  connectStatus,
  recentPayments,
  totalReceived,
  pendingAmount,
  thisMonthAmount,
}: PayoutsClientProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string, estimatedArrival: string | null) => {
    const label = getStatusLabel(status);
    switch (status) {
      case 'paid':
        return (
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Deposited
            </span>
          </div>
        );
      case 'processing':
        return (
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              <Clock className="h-3 w-3" />
              {label}
            </span>
            {estimatedArrival && (
              <p className="text-xs text-slate-500 mt-1">Est. {estimatedArrival}</p>
            )}
          </div>
        );
      case 'pending':
        return (
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <Clock className="h-3 w-3" />
              {label}
            </span>
          </div>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {label}
          </span>
        );
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    if (method === 'us_bank_account' || method === 'ach') {
      return <Building2 className="h-5 w-5 text-slate-500" />;
    }
    return <CreditCard className="h-5 w-5 text-slate-500" />;
  };

  return (
    <main className="px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track rent payments from your tenants. Money is deposited directly to your bank.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* This Month */}
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">This Month</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(thisMonthAmount)}</p>
                  <p className="text-emerald-200 text-xs mt-1">Rent collected</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Transit */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">In Transit</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">
                    {formatCurrency(pendingAmount)}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">On the way to your bank</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Received */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Received</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(totalReceived)}</p>
                  <p className="text-slate-400 text-xs mt-1">All time</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onboarding or Payment History */}
        {!connectStatus?.canReceivePayouts ? (
          <StripeConnectOnboarding onComplete={() => window.location.reload()} />
        ) : (
          <div className="space-y-6">
            {/* How it works info */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Direct deposits enabled
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      When tenants pay rent, money goes directly to your bank account
                      {connectStatus.bankAccountLast4 && (
                        <span className="font-medium"> (****{connectStatus.bankAccountLast4})</span>
                      )}
                      . Card payments arrive in ~2 business days, ACH in ~5 business days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Payments</CardTitle>
                <CardDescription>
                  Rent payments from your tenants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentPayments.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No payments yet</p>
                    <p className="text-xs mt-1">
                      When tenants pay rent, payments will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      // Consolidate move-in payments for display
                      const groupedPayments = consolidateMoveInPayments(
                        recentPayments.map((p) => ({
                          id: p.id,
                          amount: p.amount,
                          status: p.status,
                          dueDate: p.dueDate || undefined,
                          paidAt: p.paidAt,
                          metadata: p.metadata,
                          tenantName: p.tenantName,
                          propertyName: p.propertyName,
                          unitName: p.unitNumber,
                          paymentMethod: p.paymentMethod,
                        }))
                      );
                      
                      return groupedPayments.map((grouped: GroupedPayment) => (
                        <div
                          key={grouped.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              {getPaymentMethodIcon(grouped.paymentMethod || null)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{formatCurrency(grouped.amount)}</p>
                                {grouped.type === 'move_in' && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                                    Move-in
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {grouped.tenantName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span>{grouped.propertyName}</span>
                                {grouped.unitName && (
                                  <>
                                    <span>•</span>
                                    <span>Unit {grouped.unitName}</span>
                                  </>
                                )}
                                {grouped.paidAt && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      {new Date(grouped.paidAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </>
                                )}
                              </div>
                              {/* Show breakdown for move-in payments */}
                              {grouped.type === 'move_in' && grouped.breakdown && (
                                <div className="text-[10px] text-slate-500 mt-1">
                                  {grouped.breakdown.firstMonth && <span>1st mo: {formatCurrency(grouped.breakdown.firstMonth)}</span>}
                                  {grouped.breakdown.lastMonth && <span> • Last mo: {formatCurrency(grouped.breakdown.lastMonth)}</span>}
                                  {grouped.breakdown.securityDeposit && <span> • Deposit: {formatCurrency(grouped.breakdown.securityDeposit)}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(grouped.status, null)}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
