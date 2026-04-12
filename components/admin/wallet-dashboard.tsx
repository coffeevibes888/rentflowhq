'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet,
  ArrowDownToLine,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  consolidateMoveInPayments,
  getStatusLabel,
  type GroupedPayment,
} from '@/lib/utils/payment-grouping';

interface PaymentSummary {
  totalReceived: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayments: number;
}

interface RecentPayment {
  id: string;
  amount: number;
  tenantName: string;
  propertyName: string;
  unitName: string;
  paidAt: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  dueDate?: string;
}

/**
 * Payment Dashboard - DIRECT PAYMENT MODEL
 * 
 * Rent payments go directly to landlord's Stripe Connect account.
 * This dashboard shows payment history and Connect account status.
 * No "wallet" or "cash out" - funds go straight to their bank.
 */
export function WalletDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [connectStatus, setConnectStatus] = useState<{
    isOnboarded: boolean;
    canReceivePayouts: boolean;
    status: string;
  } | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch Connect account status
      const statusRes = await fetch('/api/landlord/stripe/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setConnectStatus(statusData);
      }

      // Fetch payment summary
      const summaryRes = await fetch('/api/landlord/payments/summary');
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setPaymentSummary(summaryData.summary);
        setRecentPayments(summaryData.recentPayments || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSetupPayouts = () => {
    // Redirect to payouts setup page with embedded onboarding
    window.location.href = '/admin/payouts/setup';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSetUp = connectStatus?.isOnboarded && connectStatus?.canReceivePayouts;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Direct Payments</p>
              <p className="text-sm text-blue-700 mt-1">
                Rent payments go directly to your bank account via Stripe. No platform fees on rent - 
                it&apos;s included in your subscription. You&apos;ll only see Stripe&apos;s standard processing fees.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connect Account Status */}
      {!isSetUp && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              Complete Payout Setup
            </CardTitle>
            <CardDescription className="text-amber-700">
              Set up your bank account to receive rent payments directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 mb-4">
              Before tenants can pay rent, you need to connect your bank account. 
              This is a one-time setup through Stripe&apos;s secure onboarding.
            </p>
            <Button onClick={handleSetupPayouts}>
              <Building2 className="mr-2 h-4 w-4" />
              Set Up Payouts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(paymentSummary?.totalReceived || 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(paymentSummary?.thisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentSummary?.lastMonth 
                ? `${paymentSummary.thisMonth >= paymentSummary.lastMonth ? '+' : ''}${((paymentSummary.thisMonth - paymentSummary.lastMonth) / paymentSummary.lastMonth * 100).toFixed(0)}% vs last month`
                : 'Current period'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(paymentSummary?.pendingPayments || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payout Status</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isSetUp ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="text-amber-600 font-medium">Setup Required</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isSetUp ? 'Receiving payments' : 'Complete setup to receive'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Rent payments received from tenants</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View in Stripe
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No payments received yet
            </p>
          ) : (
            <div className="space-y-3">
              {(() => {
                // Consolidate move-in payments for display
                const groupedPayments = consolidateMoveInPayments(
                  recentPayments.map((p) => ({
                    id: p.id,
                    amount: p.amount,
                    status: p.status,
                    dueDate: p.dueDate,
                    paidAt: p.paidAt,
                    metadata: p.metadata,
                    tenantName: p.tenantName,
                    propertyName: p.propertyName,
                    unitName: p.unitName,
                  }))
                );
                
                return groupedPayments.map((grouped: GroupedPayment) => (
                  <div
                    key={grouped.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{grouped.tenantName}</span>
                        {grouped.type === 'move_in' && (
                          <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200">
                            Move-in
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {grouped.status === 'paid' ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1 text-green-600" /> Paid</>
                          ) : grouped.status === 'processing' ? (
                            <><Loader2 className="h-3 w-3 mr-1 animate-spin text-blue-600" /> {getStatusLabel(grouped.status)}</>
                          ) : (
                            getStatusLabel(grouped.status)
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {grouped.propertyName} - {grouped.unitName}
                      </p>
                      {grouped.paidAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(grouped.paidAt).toLocaleDateString()}
                        </p>
                      )}
                      {/* Show breakdown for move-in payments */}
                      {grouped.type === 'move_in' && grouped.breakdown && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {grouped.breakdown.firstMonth && <span>1st: {formatCurrency(grouped.breakdown.firstMonth)}</span>}
                          {grouped.breakdown.lastMonth && <span> • Last: {formatCurrency(grouped.breakdown.lastMonth)}</span>}
                          {grouped.breakdown.securityDeposit && <span> • Dep: {formatCurrency(grouped.breakdown.securityDeposit)}</span>}
                        </p>
                      )}
                    </div>
                    <span className="text-lg font-semibold text-green-600">
                      +{formatCurrency(grouped.amount)}
                    </span>
                  </div>
                ));
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Payments Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              1
            </div>
            <div>
              <p className="font-medium">Tenant pays rent</p>
              <p className="text-sm text-muted-foreground">
                Through your tenant portal via card or bank transfer
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              2
            </div>
            <div>
              <p className="font-medium">Money goes to your bank</p>
              <p className="text-sm text-muted-foreground">
                Directly via Stripe - no middleman, no platform fees
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              3
            </div>
            <div>
              <p className="font-medium">Funds arrive in 2-7 days</p>
              <p className="text-sm text-muted-foreground">
                Card payments: 2 days. Bank transfers: 5-7 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WalletDashboard;
