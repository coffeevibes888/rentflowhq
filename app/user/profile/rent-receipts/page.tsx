import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { formatCurrency } from '@/lib/utils';

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
      status: 'active',
    },
    include: {
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

  const currentPayments = (lease?.rentPayments || []).filter(
    (p) =>
      p.dueDate >= startOfMonth &&
      p.dueDate < startOfNextMonth &&
      p.status !== 'paid'
  );

  const currentTotalAmount = currentPayments.reduce((sum, p) => {
    const amt = Number(p.amount);
    return sum + (Number.isNaN(amt) ? 0 : amt);
  }, 0);

  const pastPayments = (lease?.rentPayments || []).filter((p) => p.status === 'paid');

  async function payCurrentRent() {
    'use server';

    if (!currentPayments.length) {
      return;
    }

    const nowPaidAt = new Date();

    await prisma.rentPayment.updateMany({
      where: {
        id: {
          in: currentPayments.map((p) => p.id),
        },
      },
      data: {
        status: 'paid',
        paidAt: nowPaidAt,
      },
    });

    revalidatePath('/user/profile/rent-receipts');
  }

  return (
    <div className='w-full px-4 py-8 md:px-8'>
      <div className='max-w-4xl mx-auto space-y-6'>
        <div>
          <h1 className='text-2xl md:text-3xl font-semibold text-slate-900 mb-1'>Rent & receipts</h1>
          <p className='text-sm text-slate-600'>View your current rent and past payment receipts.</p>
        </div>

        {!lease ? (
          <div className='rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-6 text-sm text-slate-500'>
            We don&apos;t see an active lease linked to your account yet. Please contact management if you believe this is
            a mistake.
          </div>
        ) : (
          <>
            <div className='rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-3 text-sm text-slate-700'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Unit</p>
                  <p className='text-sm text-slate-800'>
                    {lease.unit.property?.name || 'Property'} • {lease.unit.name}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Monthly rent</p>
                  <p className='text-base font-semibold text-slate-900'>
                    {formatCurrency(lease.rentAmount.toString())}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 pt-3 border-t border-slate-200 mt-2'>
                <div>
                  <p className='font-semibold text-slate-500 uppercase tracking-wide mb-0.5'>Billing day</p>
                  <p>Day {lease.billingDayOfMonth} of each month</p>
                </div>
                <div>
                  <p className='font-semibold text-slate-500 uppercase tracking-wide mb-0.5'>Lease period</p>
                  <p>
                    {new Date(lease.startDate).toLocaleDateString()} –{' '}
                    {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Ongoing'}
                  </p>
                </div>
                <div>
                  <p className='font-semibold text-slate-500 uppercase tracking-wide mb-0.5'>Status</p>
                  <p className='capitalize'>{lease.status}</p>
                </div>
              </div>
            </div>

            <div className='rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <h2 className='text-sm font-semibold text-slate-900'>Current month&apos;s rent</h2>
                  <p className='text-xs text-slate-500'>Pay this month&apos;s rent securely.</p>
                </div>
              </div>

              {!currentPayments.length ? (
                <p className='text-sm text-slate-500'>You don&apos;t have an unpaid rent charge for this month.</p>
              ) : (
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-slate-700'>
                  <div>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Due date</p>
                    <p>{new Date(currentPayments[0].dueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Amount due</p>
                    <p className='text-base font-semibold text-slate-900'>
                      {formatCurrency(currentTotalAmount.toString())}
                    </p>
                  </div>
                  <div className='sm:text-right'>
                    <form action={payCurrentRent}>
                      <button
                        type='submit'
                        className='inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800'
                      >
                        Pay rent
                      </button>
                    </form>
                    <p className='mt-1 text-[11px] text-slate-400'>Payments are securely processed and recorded.</p>
                  </div>
                </div>
              )}
            </div>

            <div className='rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-3'>
              <div className='flex items-center justify-between gap-4 mb-1'>
                <h2 className='text-sm font-semibold text-slate-900'>Past rent receipts</h2>
                <span className='text-[11px] text-slate-500'>{pastPayments.length} payment{pastPayments.length === 1 ? '' : 's'}</span>
              </div>

              {pastPayments.length === 0 ? (
                <p className='text-sm text-slate-500'>No past rent payments recorded yet.</p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='min-w-full text-xs'>
                    <thead className='bg-slate-50'>
                      <tr>
                        <th className='px-3 py-2 text-left font-medium text-slate-500'>Paid on</th>
                        <th className='px-3 py-2 text-left font-medium text-slate-500'>For month of</th>
                        <th className='px-3 py-2 text-left font-medium text-slate-500'>Amount</th>
                        <th className='px-3 py-2 text-left font-medium text-slate-500'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastPayments.map((p) => (
                        <tr key={p.id} className='border-t border-slate-100'>
                          <td className='px-3 py-2 align-top text-slate-700'>
                            {p.paidAt ? new Date(p.paidAt).toLocaleString() : '—'}
                          </td>
                          <td className='px-3 py-2 align-top text-slate-700'>
                            {new Date(p.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                          </td>
                          <td className='px-3 py-2 align-top text-slate-700'>
                            {formatCurrency(p.amount.toString())}
                          </td>
                          <td className='px-3 py-2 align-top text-slate-700 capitalize'>{p.status}</td>
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
