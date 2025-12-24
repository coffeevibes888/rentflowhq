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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  getLandlordWallet,
  getPayoutMethods,
  cashOutToBank,
  deletePayoutMethod,
} from '@/lib/actions/landlord-wallet.actions';
import { BankAccountWizard } from './bank-account-wizard';
import {
  Wallet,
  ArrowDownToLine,
  Zap,
  Clock,
  Building2,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface WalletData {
  id: string;
  availableBalance: number;
  pendingBalance: number;
  lastPayoutAt: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  createdAt: string;
}

interface PayoutMethod {
  id: string;
  stripePaymentMethodId: string;
  type: string;
  accountHolderName: string | null;
  last4: string;
  bankName: string | null;
  accountType: string | null;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface PendingPayment {
  id: string;
  amount: number;
  tenantName: string;
  propertyName: string;
  paidAt: string | null;
}

export function WalletDashboard() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [showCashOutDialog, setShowCashOutDialog] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [walletResult, methodsResult] = await Promise.all([
        getLandlordWallet(),
        getPayoutMethods(),
      ]);

      if (walletResult.success && walletResult.wallet) {
        setWallet(walletResult.wallet);
        setTransactions(walletResult.recentTransactions || []);
        setPendingPayments(walletResult.pendingPayments || []);
      }

      if (methodsResult.success) {
        setPayoutMethods(methodsResult.methods);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load wallet data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCashOut = async (instant: boolean) => {
    if (!wallet || wallet.availableBalance <= 0) return;

    setIsCashingOut(true);
    try {
      const result = await cashOutToBank({ instant });

      if (result.success) {
        toast({
          title: 'Cash out initiated!',
          description: result.message,
        });
        setShowCashOutDialog(false);
        loadData();
      } else {
        toast({
          variant: 'destructive',
          title: 'Cash out failed',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process cash out',
      });
    } finally {
      setIsCashingOut(false);
    }
  };

  const handleDeletePayoutMethod = async (methodId: string) => {
    try {
      const result = await deletePayoutMethod(methodId);
      if (result.success) {
        toast({ description: 'Payout method removed' });
        loadData();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove payout method',
      });
    }
  };

  const defaultMethod = payoutMethods.find((m) => m.isDefault && m.isVerified);
  const hasVerifiedMethod = payoutMethods.some((m) => m.isVerified);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(wallet?.availableBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Ready to cash out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(wallet?.pendingBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Processing (7-day hold)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Payout</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wallet?.lastPayoutAt
                ? new Date(wallet.lastPayoutAt).toLocaleDateString()
                : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {wallet?.lastPayoutAt ? 'Most recent cash out' : 'No payouts yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Out Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            Cash Out
          </CardTitle>
          <CardDescription>
            Transfer your available balance to your bank account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasVerifiedMethod ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Add a bank account to receive payouts</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Connect your bank account to start receiving rent payments.
                  </p>
                  <BankAccountWizard
                    onComplete={loadData}
                    trigger={
                      <Button size="sm" className="mt-3">
                        <Building2 className="mr-2 h-4 w-4" />
                        Add Bank Account
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Available to cash out</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(wallet?.availableBalance || 0)}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => setShowCashOutDialog(true)}
                  disabled={!wallet || wallet.availableBalance <= 0}
                >
                  Cash Out to Bank
                </Button>
              </div>

              {defaultMethod && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>
                    Payout to {defaultMethod.bankName} ****{defaultMethod.last4}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payout Methods */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payout Methods</CardTitle>
            <CardDescription>Manage your bank accounts for receiving payouts</CardDescription>
          </div>
          <BankAccountWizard onComplete={loadData} />
        </CardHeader>
        <CardContent>
          {payoutMethods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No payout methods added yet
            </p>
          ) : (
            <div className="space-y-3">
              {payoutMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {method.type === 'card' ? (
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {method.bankName || 'Bank Account'} ****{method.last4}
                        </span>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        {method.isVerified ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Verification
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.accountType ? `${method.accountType.charAt(0).toUpperCase() + method.accountType.slice(1)} Account` : 'Account'}
                        {method.accountHolderName && ` • ${method.accountHolderName}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePayoutMethod(method.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{tx.description || tx.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`font-medium ${
                      tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Out Dialog */}
      <Dialog open={showCashOutDialog} onOpenChange={setShowCashOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cash Out to Bank</DialogTitle>
            <DialogDescription>
              Choose how you want to receive your funds
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(wallet?.availableBalance || 0)}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              {/* Standard Payout */}
              <button
                onClick={() => handleCashOut(false)}
                disabled={isCashingOut}
                className="w-full p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Standard (3-5 days)</p>
                      <p className="text-sm text-muted-foreground">Free</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Free</Badge>
                </div>
              </button>

              {/* Instant Payout */}
              <button
                onClick={() => handleCashOut(true)}
                disabled={isCashingOut}
                className="w-full p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Instant (Minutes)</p>
                      <p className="text-sm text-muted-foreground">To debit card</p>
                    </div>
                  </div>
                  <Badge variant="outline">$2.00 fee</Badge>
                </div>
              </button>
            </div>

            {defaultMethod && (
              <p className="text-sm text-muted-foreground text-center">
                Funds will be sent to {defaultMethod.bankName} ****{defaultMethod.last4}
              </p>
            )}
          </div>

          {isCashingOut && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Processing...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WalletDashboard;
