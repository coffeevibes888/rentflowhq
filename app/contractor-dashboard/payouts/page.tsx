import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Wallet, DollarSign, CreditCard, TrendingUp, Building2, ChevronRight } from 'lucide-react';
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

  const contractors = await prisma.contractorProfile.findMany({
    where: { userId: session.user.id },
    select: { id: true, stripeConnectAccountId: true, isPaymentReady: true },
  });

  const contractorIds = contractors.map((c) => c.id);
  const hasStripeSetup = contractors.some((c) => c.isPaymentReady);

  const completedOrders = await prisma.workOrder.findMany({
    where: { contractorId: { in: contractorIds }, status: { in: ['completed', 'paid'] } },
    include: {
      landlord: { select: { name: true, companyName: true } },
      property: { select: { name: true } },
    },
    orderBy: { completedAt: 'desc' },
  });

  const totalEarnings = completedOrders.reduce((sum, o) => sum + Number(o.actualCost || o.agreedPrice || 0), 0);
  const paidOrders = completedOrders.filter((o) => o.status === 'paid');
  const pendingOrders = completedOrders.filter((o) => o.status === 'completed');
  const totalPaid = paidOrders.reduce((sum, o) => sum + Number(o.actualCost || o.agreedPrice || 0), 0);
  const pendingPayout = pendingOrders.reduce((sum, o) => sum + Number(o.actualCost || o.agreedPrice || 0), 0);

  return (
    <div className='w-full space-y-5'>
      {/* Header */}
      <div>
        <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-black'>Payouts</h1>
        <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>Track your earnings and payments</p>
      </div>

      {searchParams.onboarding === 'complete' && <OnboardingSuccessAlert />}

      {/* KPI Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        <div className='relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-hidden'>
          <div className='absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-blue-400 to-indigo-400 opacity-10 rounded-bl-full' />
          <div className='flex items-start justify-between'>
            <div>
              <p className='text-xs text-gray-500 font-medium'>Total Earnings</p>
              <p className='text-2xl font-bold text-gray-900 mt-0.5'>{formatCurrency(totalEarnings)}</p>
            </div>
            <div className='h-9 w-9 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white'>
              <TrendingUp className='h-4 w-4' />
            </div>
          </div>
        </div>
        <div className='relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-hidden'>
          <div className='absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-amber-400 to-orange-400 opacity-10 rounded-bl-full' />
          <div className='flex items-start justify-between'>
            <div>
              <p className='text-xs text-gray-500 font-medium'>Pending Payout</p>
              <p className='text-2xl font-bold text-amber-600 mt-0.5'>{formatCurrency(pendingPayout)}</p>
            </div>
            <div className='h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white'>
              <Wallet className='h-4 w-4' />
            </div>
          </div>
        </div>
        <div className='relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-hidden'>
          <div className='absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-emerald-400 to-cyan-400 opacity-10 rounded-bl-full' />
          <div className='flex items-start justify-between'>
            <div>
              <p className='text-xs text-gray-500 font-medium'>Total Paid</p>
              <p className='text-2xl font-bold text-emerald-600 mt-0.5'>{formatCurrency(totalPaid)}</p>
            </div>
            <div className='h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white'>
              <DollarSign className='h-4 w-4' />
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Setup Banner */}
      {!hasStripeSetup && (
        <div className='flex items-center justify-between gap-4 p-4 rounded-xl border border-violet-100 bg-violet-50'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0'>
              <CreditCard className='h-5 w-5 text-violet-600' />
            </div>
            <div>
              <p className='text-sm font-semibold text-gray-800'>Set Up Payments</p>
              <p className='text-xs text-gray-500'>Connect your bank account to receive payouts directly</p>
            </div>
          </div>
          <StripeConnectButton />
        </div>
      )}

      {/* Payment History */}
      <div className='rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
        <div className='flex items-center justify-between p-4 border-b border-gray-100'>
          <h3 className='text-sm font-bold text-gray-800'>Payment History</h3>
          <span className='text-xs text-gray-400'>{completedOrders.length} orders</span>
        </div>
        {completedOrders.length === 0 ? (
          <div className='p-10 text-center'>
            <div className='w-14 h-14 mx-auto mb-4 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center'>
              <Wallet className='h-7 w-7 text-gray-300' />
            </div>
            <h3 className='text-base font-bold text-gray-800 mb-1'>No payments yet</h3>
            <p className='text-sm text-gray-500'>Complete work orders to start earning</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-50'>
            {completedOrders.map((order) => (
              <div key={order.id} className='flex items-center gap-3 px-4 py-3'>
                <div className='h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0'>
                  <Building2 className='h-4 w-4 text-blue-500' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-semibold text-gray-800 truncate'>{order.title}</p>
                  <p className='text-[10px] text-gray-500'>
                    {order.property.name} · {order.landlord.companyName || order.landlord.name}
                  </p>
                  <p className='text-[10px] text-gray-400'>
                    {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : 'Pending'}
                  </p>
                </div>
                <div className='text-right shrink-0'>
                  <p className='text-xs font-bold text-emerald-600'>
                    {formatCurrency(Number(order.actualCost || order.agreedPrice))}
                  </p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    order.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {order.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
