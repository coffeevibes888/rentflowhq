import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import RentPayClient from './rent-pay-client';

export default async function UserProfileRentReceiptsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id as string;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const lease = await prisma.lease.findFirst({
    where: {
      tenantId: userId,
      status: { in: ['active', 'pending_signature'] },
    },
    select: {
      id: true,
      status: true,
      rentAmount: true,
      billingDayOfMonth: true,
      startDate: true,
      endDate: true,
      tenantSignedAt: true,
      landlordSignedAt: true,
      unit: {
        select: {
          name: true,
          property: { select: { name: true } },
        },
      },
      rentPayments: {
        orderBy: { dueDate: 'desc' },
      },
    },
  });

  // Move-in payments (first month, last month, security deposit) - show regardless of due date
  const moveInPayments = (lease?.rentPayments || []).filter(
    (p) =>
      p.status !== 'paid' &&
      ['first_month_rent', 'last_month_rent', 'security_deposit'].includes(
        (p.metadata as any)?.type || ''
      )
  );

  // Regular monthly rent payments for current month
  const regularCurrentPayments = (lease?.rentPayments || []).filter(
    (p) =>
      p.dueDate >= startOfMonth &&
      p.dueDate < startOfNextMonth &&
      p.status !== 'paid' &&
      !['first_month_rent', 'last_month_rent', 'security_deposit'].includes(
        (p.metadata as any)?.type || ''
      )
  );

  // Combine move-in payments with regular current payments (deduplicated)
  const currentPayments = [
    ...moveInPayments,
    ...regularCurrentPayments.filter(
      (p) => !moveInPayments.some((m) => m.id === p.id)
    ),
  ];

  const currentTotalAmount = currentPayments.reduce((sum, p) => {
    const amt = Number(p.amount);
    return sum + (Number.isNaN(amt) ? 0 : amt);
  }, 0);

  const pastPayments = (lease?.rentPayments || []).filter((p) => p.status === 'paid');

  const firstMonth = currentPayments.find(
    (p) => (p.metadata as any)?.type === 'first_month_rent'
  );
  const lastMonth = currentPayments.find(
    (p) => (p.metadata as any)?.type === 'last_month_rent'
  );
  const securityDeposit = currentPayments.find(
    (p) => (p.metadata as any)?.type === 'security_deposit'
  );

  return (
    <div className='w-full min-h-screen px-4 py-8 md:px-8'>
      <div className='max-w-5xl mx-auto space-y-8'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-3xl md:text-4xl font-bold text-white'>Rent &amp; Receipts</h1>
          <p className='text-sm md:text-base text-gray-300'>View your current rent status and past payment history.</p>
        </div>

        {!lease ? (
          <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-6 py-8 shadow-lg text-sm text-gray-200'>
            We don&apos;t see an active lease linked to your account yet. Please contact management if you believe this is a
            mistake.
          </div>
        ) : (
          <>
            {/* Pending Signature Notice */}
            {lease.status === 'pending_signature' && !lease.tenantSignedAt && (
              <div className='backdrop-blur-md bg-amber-500/20 border border-amber-400/50 rounded-xl px-6 py-4 shadow-lg'>
                <div className='flex items-start gap-3'>
                  <div className='rounded-full bg-amber-500/30 p-2 mt-0.5'>
                    <svg className='h-5 w-5 text-amber-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-base font-semibold text-amber-100'>Lease Pending Signature</h3>
                    <p className='text-sm text-amber-200/80 mt-1'>
                      Your application has been approved! You can pay your move-in costs below. Don&apos;t forget to{' '}
                      <a href='/user/profile/lease' className='underline hover:text-amber-100'>sign your lease</a> to complete the process.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Waiting for Landlord Signature Notice */}
            {lease.status === 'pending_signature' && lease.tenantSignedAt && !lease.landlordSignedAt && (
              <div className='backdrop-blur-md bg-blue-500/20 border border-blue-400/50 rounded-xl px-6 py-4 shadow-lg'>
                <div className='flex items-start gap-3'>
                  <div className='rounded-full bg-blue-500/30 p-2 mt-0.5'>
                    <svg className='h-5 w-5 text-blue-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-base font-semibold text-blue-100'>You&apos;ve Signed! Waiting for Landlord</h3>
                    <p className='text-sm text-blue-200/80 mt-1'>
                      Great job! You signed your lease on {new Date(lease.tenantSignedAt).toLocaleDateString()}. 
                      We&apos;re waiting for the landlord to countersign. You&apos;ll be notified once it&apos;s complete.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg space-y-4 text-sm text-gray-100'>
              <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                <div className='space-y-1'>
                  <p className='text-[11px] font-semibold text-gray-300 uppercase tracking-[0.16em]'>Unit</p>
                  <p className='text-base md:text-lg font-medium text-white'>
                    {lease.unit.property?.name || 'Property'} • {lease.unit.name}
                  </p>
                </div>
                <div className='text-left md:text-right space-y-1'>
                  <p className='text-[11px] font-semibold text-gray-300 uppercase tracking-[0.16em]'>Monthly rent</p>
                  <p className='text-base md:text-xl font-semibold text-white'>
                    {formatCurrency(lease.rentAmount.toString())}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/10 text-xs md:text-sm text-gray-200'>
                <div className='space-y-1'>
                  <p className='font-semibold text-gray-300 uppercase tracking-[0.16em] mb-0.5 text-[11px]'>Billing day</p>
                  <p>Day {lease.billingDayOfMonth} of each month</p>
                </div>
                <div className='space-y-1'>
                  <p className='font-semibold text-gray-300 uppercase tracking-[0.16em] mb-0.5 text-[11px]'>Lease period</p>
                  <p>
                    {new Date(lease.startDate).toLocaleDateString()} –{' '}
                    {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Ongoing'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='font-semibold text-gray-300 uppercase tracking-[0.16em] mb-0.5 text-[11px]'>Status</p>
                  <p className='capitalize'>{lease.status}</p>
                </div>
              </div>
            </div>

            <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg space-y-4 text-sm text-gray-100'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <h2 className='text-sm md:text-base font-semibold text-white'>Move-in amounts</h2>
                  <p className='text-xs text-gray-300'>First month, last month, and security deposit.</p>
                </div>
              </div>

              {!currentPayments.length ? (
                <p className='text-sm text-gray-200'>You don&apos;t have any unpaid move-in charges.</p>
              ) : (
                <div className='space-y-4 text-sm text-gray-100'>
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-200'>
                    {firstMonth && (
                      <div>
                        <p className='font-semibold text-gray-300 uppercase tracking-[0.16em] mb-0.5 text-[11px]'>First month&apos;s rent</p>
                        <p>{formatCurrency(firstMonth.amount.toString())}</p>
                      </div>
                    )}
                    {lastMonth && (
                      <div>
                        <p className='font-semibold text-gray-300 uppercase tracking-[0.16em] mb-0.5 text-[11px]'>Last month&apos;s rent</p>
                        <p>{formatCurrency(lastMonth.amount.toString())}</p>
                      </div>
                    )}
                    {securityDeposit && (
                      <div>
                        <p className='font-semibold text-gray-300 uppercase tracking-[0.16em] mb-0.5 text-[11px]'>Security deposit</p>
                        <p>{formatCurrency(securityDeposit.amount.toString())}</p>
                      </div>
                    )}
                  </div>

                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div>
                      <p className='text-[11px] font-semibold text-gray-300 uppercase tracking-[0.16em]'>Total due now</p>
                      <p className='text-base md:text-xl font-semibold text-white'>
                        {formatCurrency(currentTotalAmount.toString())}
                      </p>
                    </div>
                    <div className='sm:text-right'>
                      <RentPayClient
                        rentPaymentIds={currentPayments.map((p) => p.id)}
                      />
                      <p className='mt-1 text-[11px] text-gray-300'>Payments are securely processed and recorded via Stripe.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg space-y-4 text-sm text-gray-100'>
              <div className='flex items-center justify-between gap-4 mb-1'>
                <h2 className='text-sm md:text-base font-semibold text-white'>Past rent receipts</h2>
                <span className='text-[11px] text-gray-300'>
                  {pastPayments.length} payment{pastPayments.length === 1 ? '' : 's'}
                </span>
              </div>

              {pastPayments.length === 0 ? (
                <p className='text-sm text-gray-200'>No past rent payments recorded yet.</p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='min-w-full text-xs'>
                    <thead className='bg-white/10'>
                      <tr>
                        <th className='px-3 py-2 text-left font-medium text-gray-200'>Paid on</th>
                        <th className='px-3 py-2 text-left font-medium text-gray-200'>For month of</th>
                        <th className='px-3 py-2 text-left font-medium text-gray-200'>Amount</th>
                        <th className='px-3 py-2 text-left font-medium text-gray-200'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastPayments.map((p) => (
                        <tr key={p.id} className='border-t border-white/10'>
                          <td className='px-3 py-2 align-top text-gray-100'>
                            {p.paidAt ? new Date(p.paidAt).toLocaleString() : '—'}
                          </td>
                          <td className='px-3 py-2 align-top text-gray-100'>
                            {new Date(p.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                          </td>
                          <td className='px-3 py-2 align-top text-gray-100'>
                            {formatCurrency(p.amount.toString())}
                          </td>
                          <td className='px-3 py-2 align-top text-gray-100'>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' :
                              p.status === 'processing' ? 'bg-blue-500/20 text-blue-300' :
                              p.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                              p.status === 'overdue' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-slate-500/20 text-slate-300'
                            }`}>
                              {p.status === 'processing' && (
                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                              {p.status}
                            </span>
                            {p.status === 'processing' && (
                              <p className='text-[10px] text-blue-300 mt-1'>ACH payment clearing (5-7 days)</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
