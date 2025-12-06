import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default async function RentManagementPage() {
  await requireAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const rentPayments = await prisma.rentPayment.findMany({
    where: {
      dueDate: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
    orderBy: { dueDate: 'asc' },
    include: {
      tenant: {
        select: { id: true, name: true, email: true },
      },
      lease: {
        select: {
          id: true,
          rentAmount: true,
          unit: {
            select: { name: true, property: { select: { name: true } } },
          },
        },
      },
    },
  });

  const paidThisMonth = rentPayments.filter((p) => p.status === 'paid');
  const lateThisMonth = rentPayments.filter(
    (p) => p.status === 'overdue' || (p.status !== 'paid' && p.dueDate < now)
  );
  const partialPayments = rentPayments.filter((p) => {
    const rent = Number(p.lease.rentAmount);
    const amt = Number(p.amount);
    return p.status === 'paid' && rent > 0 && amt > 0 && amt < rent;
  });

  const formatUnitLabel = (p: (typeof rentPayments)[number]) => {
    const unitName = p.lease.unit?.name;
    const propertyName = p.lease.unit?.property?.name;
    if (unitName && propertyName) return `${propertyName} • ${unitName}`;
    if (propertyName) return propertyName;
    return unitName || 'Unit';
  };

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-8'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl md:text-4xl font-semibold text-slate-900 mb-1'>Rents overview</h1>
            <p className='text-sm text-slate-600'>Current month rent status across all active leases.</p>
          </div>
          <Link
            href='/admin/evictions'
            className='inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800'
          >
            Evictions & notices
          </Link>
        </div>

        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-slate-800'>Paid this month</h2>
          <div className='rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
            <table className='min-w-full text-sm'>
              <thead className='bg-slate-50'>
                <tr>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Tenant</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Unit</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Due date</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Rent</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Paid</th>
                </tr>
              </thead>
              <tbody>
                {paidThisMonth.length === 0 && (
                  <tr>
                    <td colSpan={5} className='px-4 py-6 text-center text-slate-500'>
                      No rent payments recorded as paid this month yet.
                    </td>
                  </tr>
                )}
                {paidThisMonth.map((p) => (
                  <tr key={p.id} className='border-t border-slate-100'>
                    <td className='px-4 py-2 text-xs text-slate-700'>
                      {p.tenant?.name || 'Tenant'}
                      {p.tenant?.email && (
                        <span className='block text-[11px] text-slate-400'>{p.tenant.email}</span>
                      )}
                    </td>
                    <td className='px-4 py-2 text-xs text-slate-700'>{formatUnitLabel(p)}</td>
                    <td className='px-4 py-2 text-xs text-slate-500'>
                      {new Date(p.dueDate).toLocaleDateString()}
                    </td>
                    <td className='px-4 py-2 text-xs text-slate-700'>
                      {formatCurrency(Number(p.lease.rentAmount))}
                    </td>
                    <td className='px-4 py-2 text-xs text-slate-700'>
                      {formatCurrency(Number(p.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-red-700'>Late this month</h2>
          <div className='rounded-xl border border-red-200 bg-red-50 shadow-sm overflow-hidden'>
            <table className='min-w-full text-sm'>
              <thead className='bg-red-100'>
                <tr>
                  <th className='px-4 py-2 text-left font-medium text-red-800'>Tenant</th>
                  <th className='px-4 py-2 text-left font-medium text-red-800'>Unit</th>
                  <th className='px-4 py-2 text-left font-medium text-red-800'>Due date</th>
                  <th className='px-4 py-2 text-left font-medium text-red-800'>Rent</th>
                  <th className='px-4 py-2 text-left font-medium text-red-800'>Status</th>
                </tr>
              </thead>
              <tbody>
                {lateThisMonth.length === 0 && (
                  <tr>
                    <td colSpan={5} className='px-4 py-6 text-center text-red-700/70'>
                      No tenants marked late so far this month.
                    </td>
                  </tr>
                )}
                {lateThisMonth.map((p) => (
                  <tr key={p.id} className='border-t border-red-100 bg-red-50/80'>
                    <td className='px-4 py-2 text-xs text-red-900'>
                      {p.tenant?.name || 'Tenant'}
                      {p.tenant?.email && (
                        <span className='block text-[11px] text-red-700/80'>{p.tenant.email}</span>
                      )}
                    </td>
                    <td className='px-4 py-2 text-xs text-red-900'>{formatUnitLabel(p)}</td>
                    <td className='px-4 py-2 text-xs text-red-800'>
                      {new Date(p.dueDate).toLocaleDateString()}
                    </td>
                    <td className='px-4 py-2 text-xs text-red-900'>
                      {formatCurrency(Number(p.lease.rentAmount))}
                    </td>
                    <td className='px-4 py-2 text-xs font-semibold uppercase text-red-800 space-y-1'>
                      <div>{p.status}</div>
                      <div>
                        {(() => {
                          const rent = Number(p.lease.rentAmount);
                          const amt = Number(p.amount);
                          const amountOwed = rent - (Number.isNaN(amt) ? 0 : amt);
                          const params = new URLSearchParams();
                          if (p.tenant?.name) params.set('tenant', p.tenant.name);
                          if (p.tenant?.email) params.set('tenantEmail', p.tenant.email);
                          const unitLabel = formatUnitLabel(p);
                          if (unitLabel) params.set('unit', unitLabel);
                          if (!Number.isNaN(amountOwed) && amountOwed > 0) {
                            params.set('amountOwed', amountOwed.toFixed(2));
                          }

                          return (
                            <Link
                              href={`/admin/evictions?${params.toString()}`}
                              className='inline-flex items-center rounded-full bg-red-700 px-3 py-1 text-[11px] font-medium text-white hover:bg-red-800'
                            >
                              Start notice
                            </Link>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-amber-800'>Partial payments</h2>
          <div className='rounded-xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden'>
            <table className='min-w-full text-sm'>
              <thead className='bg-amber-100'>
                <tr>
                  <th className='px-4 py-2 text-left font-medium text-amber-800'>Tenant</th>
                  <th className='px-4 py-2 text-left font-medium text-amber-800'>Unit</th>
                  <th className='px-4 py-2 text-left font-medium text-amber-800'>Due date</th>
                  <th className='px-4 py-2 text-left font-medium text-amber-800'>Rent</th>
                  <th className='px-4 py-2 text-left font-medium text-amber-800'>Paid</th>
                  <th className='px-4 py-2 text-left font-medium text-amber-800'>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {partialPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className='px-4 py-6 text-center text-amber-700/80'>
                      No partial payments detected for this month.
                    </td>
                  </tr>
                )}
                {partialPayments.map((p) => {
                  const rent = Number(p.lease.rentAmount);
                  const amt = Number(p.amount);
                  const remaining = rent - amt;

                  return (
                    <tr key={p.id} className='border-t border-amber-100 bg-amber-50/80'>
                      <td className='px-4 py-2 text-xs text-amber-900'>
                        {p.tenant?.name || 'Tenant'}
                        {p.tenant?.email && (
                          <span className='block text-[11px] text-amber-700/80'>{p.tenant.email}</span>
                        )}
                      </td>
                      <td className='px-4 py-2 text-xs text-amber-900'>{formatUnitLabel(p)}</td>
                      <td className='px-4 py-2 text-xs text-amber-800'>
                        {new Date(p.dueDate).toLocaleDateString()}
                      </td>
                      <td className='px-4 py-2 text-xs text-amber-900'>
                        {formatCurrency(rent)}
                      </td>
                      <td className='px-4 py-2 text-xs text-amber-900'>
                        {formatCurrency(amt)}
                      </td>
                      <td className='px-4 py-2 text-xs font-semibold text-amber-900'>
                        {formatCurrency(remaining)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
