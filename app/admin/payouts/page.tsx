import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PayoutForm from '@/components/admin/payout-form';

const AdminPayoutsPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    return (
      <main className='px-4 py-10'>
        <div className='max-w-3xl mx-auto text-sm text-red-600'>
          {landlordResult.message || 'Unable to load landlord context for payouts.'}
        </div>
      </main>
    );
  }

  const landlord = landlordResult.landlord;

  const [unpaidRent, payouts] = await Promise.all([
    prisma.rentPayment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'paid',
        payoutId: null,
        lease: {
          unit: {
            property: { landlordId: landlord.id },
          },
        },
      },
    }),
    prisma.payout.findMany({
      where: { landlordId: landlord.id },
      orderBy: { initiatedAt: 'desc' },
      take: 10,
    }),
  ]);

  const availableAmount = Number(unpaidRent._sum.amount || 0);

  return (
    <main className='px-4 py-8'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <section className='space-y-3'>
          <h1 className='text-2xl font-semibold text-slate-900'>Payouts</h1>
          <p className='text-sm text-slate-600'>
            Rent payments collected through the tenant portal appear here as available balance. When you
            cash out, we send funds to your saved payout details.
          </p>
        </section>

        <section className='grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start'>
          <div className='rounded-2xl border border-slate-200 bg-white p-5 space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-slate-500 uppercase tracking-[0.18em]'>
                  Available balance
                </p>
                <p className='mt-1 text-3xl font-semibold text-slate-900'>
                  ${availableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <PayoutForm availableAmount={availableAmount} />

            <div className='mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs md:text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
              <div>
                <p className='font-medium text-slate-900'>Cash-paying tenants?</p>
                <p className='text-slate-600 text-[11px] md:text-xs'>
                  Generate barcodes for Walmart, 7‑Eleven and other locations so tenants can pay rent with cash.
                </p>
              </div>
              <Link href='/admin/cash-collection'>
                <Button variant='outline' size='sm' className='w-full md:w-auto'>
                  Manage Cash Payments
                </Button>
              </Link>
            </div>

            {!landlord.stripeConnectAccountId && (
              <p className='text-xs text-amber-600'>
                You have not added payout details yet. Go to Settings to securely add your bank or debit card
                information.
              </p>
            )}
          </div>

          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3'>
            <div className='space-y-1'>
              <p className='font-semibold text-slate-900'>How payouts work</p>
              <p className='text-xs'>
                <strong>Standard:</strong> Free bank transfer, arrives in 2-3 business days to your bank account.
              </p>
              <p className='text-xs'>
                <strong>Instant:</strong> 1.5% fee (max $10), arrives within minutes to your debit card.
              </p>
              <p className='text-xs text-slate-500 mt-2'>
                Your banking details are encrypted and securely processed. We never store full card or account numbers.
              </p>
            </div>
          </div>
        </section>

        <section className='space-y-3'>
          <div className='rounded-2xl border border-slate-200 bg-white p-5 space-y-3'>
            <div className='flex items-start justify-between gap-4 flex-col md:flex-row'>
              <div className='space-y-1'>
                <h2 className='text-sm font-semibold text-slate-900'>Payout method & verification</h2>
                <p className='text-xs text-slate-600'>
                  Manage payout verification and add your bank account/debit card inside this app.
                </p>
              </div>
              <Link href='/admin/onboarding/payouts'>
                <Button className='rounded-full bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold shadow hover:bg-blue-500 transition'>
                  Verify payout account
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-slate-900'>Recent payouts</h2>
          <div className='rounded-2xl border border-slate-200 bg-white overflow-hidden text-sm'>
            <div className='grid grid-cols-4 gap-2 px-4 py-2 text-xs font-medium text-slate-500 border-b border-slate-100'>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Reference</span>
            </div>
            {payouts.length === 0 ? (
              <div className='px-4 py-4 text-xs text-slate-500'>No payouts yet.</div>
            ) : (
              <ul className='divide-y divide-slate-100'>
                {payouts.map((payout) => (
                  <li key={payout.id} className='grid grid-cols-4 gap-2 px-4 py-2 text-xs text-slate-700'>
                    <span>{new Date(payout.initiatedAt).toLocaleDateString()}</span>
                    <span>
                      ${Number(payout.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className='capitalize'>{payout.status}</span>
                    <span className='truncate'>{payout.stripeTransferId || '—'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminPayoutsPage;
