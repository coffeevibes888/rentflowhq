import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, DollarSign, CreditCard, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { StripeConnectButton } from '@/components/contractor/stripe-connect-button';
import { OnboardingSuccessAlert } from '@/components/contractor/onboarding-success-alert';

export default async function ContractorPayoutsPage({
  searchParams,
}: {
  searchParams: { onboarding?: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'contractor') {
    return redirect('/');
  }

  // Get contractor profiles
  const contractors = await prisma.contractor.findMany({
    where: { userId: session.user.id },
    select: { 
      id: true, 
      stripeConnectAccountId: true,
      isPaymentReady: true,
    },
  });

  const contractorIds = contractors.map(c => c.id);
  const hasStripeSetup = contractors.some(c => c.isPaymentReady);

  // Get completed work orders (earnings)
  const completedOrders = await prisma.workOrder.findMany({
    where: {
      contractorId: { in: contractorIds },
      status: { in: ['completed', 'paid'] },
    },
    include: {
      landlord: { select: { name: true, companyName: true } },
      property: { select: { name: true } },
    },
    orderBy: { completedAt: 'desc' },
  });

  const totalEarnings = completedOrders.reduce((sum, o) => 
    sum + Number(o.actualCost || o.agreedPrice || 0), 0
  );

  const paidOrders = completedOrders.filter(o => o.status === 'paid');
  const pendingOrders = completedOrders.filter(o => o.status === 'completed');

  const totalPaid = paidOrders.reduce((sum, o) => 
    sum + Number(o.actualCost || o.agreedPrice || 0), 0
  );

  const pendingPayout = pendingOrders.reduce((sum, o) => 
    sum + Number(o.actualCost || o.agreedPrice || 0), 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Payouts</h1>
        <p className="text-slate-600 mt-1">Track your earnings and payments</p>
      </div>

      {/* Onboarding Success Message */}
      {searchParams.onboarding === 'complete' && (
        <OnboardingSuccessAlert />
      )}

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-gray-300 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900/80">Total Earnings</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalEarnings)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-gray-900/80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Pending Payout</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(pendingPayout)}</p>
              </div>
              <Wallet className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">Total Paid</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(totalPaid)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Setup */}
      {!hasStripeSetup && (
        <Card className="bg-violet-50 border-violet-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CreditCard className="h-10 w-10 text-violet-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Set Up Payments</h3>
                  <p className="text-sm text-slate-600">
                    Connect your bank account to receive payouts directly
                  </p>
                </div>
              </div>
              <StripeConnectButton />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-300">
        <CardHeader>
          <CardTitle className="text-slate-900">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {completedOrders.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">No payments yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Complete work orders to start earning
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50"
                >
                  <div>
                    <h3 className="font-medium text-slate-900">{order.title}</h3>
                    <p className="text-sm text-slate-500">
                      {order.property.name} • {order.landlord.companyName || order.landlord.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : 'Pending'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(Number(order.actualCost || order.agreedPrice))}
                    </p>
                    <span className={`
                      inline-block px-2 py-0.5 rounded text-xs font-medium
                      ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                    `}>
                      {order.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
