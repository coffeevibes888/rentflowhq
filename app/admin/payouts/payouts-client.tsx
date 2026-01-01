'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StripeConnectOnboarding from '@/components/admin/stripe-connect-onboarding';
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  CheckCircle2,
  Building2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import CashoutDialog from '@/components/admin/cashout-dialog';
import PropertyBankManager from '@/components/admin/property-bank-manager';

interface ConnectStatus {
  hasAccount: boolean;
  isOnboarded: boolean;
  canReceivePayouts: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  bankAccountLast4?: string | null;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  initiatedAt: string;
  paidAt: string | null;
  stripeTransferId: string | null;
  destinationPropertyId: string | null;
  destinationPropertyName: string | null;
  destinationLast4: string | null;
}

interface PropertyWithBankAccount {
  id: string;
  name: string;
  hasBankAccount: boolean;
  bankAccount: {
    last4: string;
    bankName: string | null;
    isVerified: boolean;
  } | null;
}

interface PayoutsClientProps {
  availableBalance: number;
  pendingBalance: number;
  connectStatus: ConnectStatus | null;
  payouts: Payout[];
  properties: PropertyWithBankAccount[];
}

export default function PayoutsClient({
  availableBalance,
  pendingBalance,
  connectStatus,
  payouts,
  properties,
}: PayoutsClientProps) {
  const [showCashOutDialog, setShowCashOutDialog] = useState(false);

  const canCashOut = connectStatus?.canReceivePayouts && availableBalance > 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </span>
        );
      case 'pending':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="h-3 w-3" />
            Processing
          </span>
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
            {status}
          </span>
        );
    }
  };

  return (
    <main className="px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payouts</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your earnings and cash out to your bank account.
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Available Balance */}
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Available Balance</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(availableBalance)}</p>
                  <p className="text-emerald-200 text-xs mt-1">Ready to cash out</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Balance */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600">
                    {formatCurrency(pendingBalance)}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">Processing (7-day hold)</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Earned */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Paid Out</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(payouts.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">{payouts.filter((p) => p.status === 'paid').length} payouts</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left Column - Payout Setup & Actions */}
          <div className="space-y-6">
            {/* Connect Onboarding or Cash Out */}
            {!connectStatus?.canReceivePayouts ? (
              <StripeConnectOnboarding onComplete={() => window.location.reload()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowDownToLine className="h-5 w-5 text-emerald-500" />
                    Cash Out
                  </CardTitle>
                  <CardDescription>
                    Transfer your available balance to your bank account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bank Account Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Bank Account</p>
                      <p className="text-xs text-slate-500">
                        {connectStatus.bankAccountLast4
                          ? `****${connectStatus.bankAccountLast4}`
                          : 'Connected via Stripe'}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>

                  {/* Cash Out Button */}
                  <Button
                    onClick={() => setShowCashOutDialog(true)}
                    disabled={!canCashOut}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                    size="lg"
                  >
                    <ArrowDownToLine className="h-4 w-4 mr-2" />
                    Cash Out {formatCurrency(availableBalance)}
                  </Button>

                  {availableBalance === 0 && (
                    <p className="text-xs text-center text-slate-500">
                      No balance available to cash out
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Payouts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No payouts yet</p>
                    <p className="text-xs mt-1">Your payout history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payouts.map((payout) => (
                      <div
                        key={payout.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            {payout.destinationPropertyId ? (
                              <Building2 className="h-5 w-5 text-slate-500" />
                            ) : (
                              <ArrowDownToLine className="h-5 w-5 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{formatCurrency(payout.amount)}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>
                                {new Date(payout.initiatedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              {payout.destinationPropertyName && (
                                <>
                                  <span>•</span>
                                  <span>{payout.destinationPropertyName}</span>
                                </>
                              )}
                              {payout.destinationLast4 && (
                                <>
                                  <span>•</span>
                                  <span>****{payout.destinationLast4}</span>
                                </>
                              )}
                              {!payout.destinationPropertyName && !payout.destinationLast4 && (
                                <>
                                  <span>•</span>
                                  <span>Default Account</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(payout.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Property Bank Accounts - moved here for better layout */}
            {connectStatus?.canReceivePayouts && (
              <PropertyBankManager
                properties={properties}
                onAccountAdded={() => window.location.reload()}
                onAccountRemoved={() => window.location.reload()}
              />
            )}
          </div>
        </div>
      </div>

      {/* Cash Out Dialog */}
      <CashoutDialog
        open={showCashOutDialog}
        onOpenChange={setShowCashOutDialog}
        availableBalance={availableBalance}
        properties={properties}
        defaultBankLast4={connectStatus?.bankAccountLast4}
        onSuccess={() => window.location.reload()}
      />
    </main>
  );
}
