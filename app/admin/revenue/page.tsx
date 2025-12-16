import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { cn } from '@/lib/utils';

export default async function RentManagementPage() {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlordId = landlordResult.landlord.id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const rentPayments = await prisma.rentPayment.findMany({
    where: {
      dueDate: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
      NOT: [
        { metadata: { path: ['type'], equals: 'first_month_rent' } },
        { metadata: { path: ['type'], equals: 'last_month_rent' } },
        { metadata: { path: ['type'], equals: 'security_deposit' } },
      ],
      lease: {
        unit: {
          property: {
            landlordId,
          },
        },
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

  // Fetch pending move-in payments (first month, last month, security deposit) regardless of due date
  const moveInPayments = await prisma.rentPayment.findMany({
    where: {
      status: 'pending',
      OR: [
        { metadata: { path: ['type'], equals: 'first_month_rent' } },
        { metadata: { path: ['type'], equals: 'last_month_rent' } },
        { metadata: { path: ['type'], equals: 'security_deposit' } },
      ],
      lease: {
        unit: {
          property: {
            landlordId,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
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

  const paidMoveInPayments = await prisma.rentPayment.findMany({
    where: {
      status: 'paid',
      paidAt: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
      OR: [
        { metadata: { path: ['type'], equals: 'first_month_rent' } },
        { metadata: { path: ['type'], equals: 'last_month_rent' } },
        { metadata: { path: ['type'], equals: 'security_deposit' } },
      ],
      lease: {
        unit: {
          property: {
            landlordId,
          },
        },
      },
    },
    orderBy: { paidAt: 'asc' },
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

  // Group move-in payments by tenant
  const moveInByTenant = moveInPayments.reduce((acc, p) => {
    const tenantId = p.tenantId;
    if (!acc[tenantId]) {
      acc[tenantId] = {
        tenant: p.tenant,
        lease: p.lease,
        payments: [],
      };
    }
    acc[tenantId].payments.push(p);
    return acc;
  }, {} as Record<string, { tenant: typeof moveInPayments[0]['tenant']; lease: typeof moveInPayments[0]['lease']; payments: typeof moveInPayments }>);

  const paidThisMonth = [
    // Regular current-month rent payments that are marked paid
    ...rentPayments.filter((p) => p.status === 'paid'),
    // Move-in payments (first/last/security) that were paid this month
    ...paidMoveInPayments,
  ];
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

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className='flex flex-col rounded-lg border border-slate-200 bg-white p-3'>
      <span className='text-[11px] uppercase tracking-wide text-slate-500'>{label}</span>
      <span className={cn('text-sm text-slate-900', typeof value === 'string' && value === '—' ? 'text-slate-500' : '')}>{value}</span>
    </div>
  );

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

        {Object.keys(moveInByTenant).length > 0 && (
          <section className='space-y-3'>
            <h2 className='text-sm font-semibold text-slate-800'>Pending move-in payments</h2>
            <p className='text-xs text-slate-500'>First month, last month rent, and security deposits awaiting payment.</p>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {Object.values(moveInByTenant).map((group) => {
                const firstMonth = group.payments.find((p) => (p.metadata as any)?.type === 'first_month_rent');
                const lastMonth = group.payments.find((p) => (p.metadata as any)?.type === 'last_month_rent');
                const securityDeposit = group.payments.find((p) => (p.metadata as any)?.type === 'security_deposit');
                const totalDue = group.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                const unitName = group.lease.unit?.name;
                const propertyName = group.lease.unit?.property?.name;
                const unitLabel = unitName && propertyName ? `${propertyName} • ${unitName}` : propertyName || unitName || 'Unit';

                return (
                  <div
                    key={group.tenant?.id || group.payments[0]?.id}
                    className='rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3'
                  >
                    <div>
                      <p className='text-sm font-semibold text-slate-900'>
                        {group.tenant?.name || 'Tenant'}
                      </p>
                      {group.tenant?.email && (
                        <p className='text-[11px] text-slate-500'>{group.tenant.email}</p>
                      )}
                      <p className='text-xs text-slate-600 mt-1'>{unitLabel}</p>
                    </div>

                    <div className='grid grid-cols-3 gap-2 text-xs'>
                      <div>
                        <p className='font-medium text-slate-600'>First month</p>
                        <p className='text-slate-900'>
                          {firstMonth ? formatCurrency(Number(firstMonth.amount)) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className='font-medium text-slate-600'>Last month</p>
                        <p className='text-slate-900'>
                          {lastMonth ? formatCurrency(Number(lastMonth.amount)) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className='font-medium text-slate-600'>Security</p>
                        <p className='text-slate-900'>
                          {securityDeposit ? formatCurrency(Number(securityDeposit.amount)) : '—'}
                        </p>
                      </div>
                    </div>

                    <div className='pt-2 border-t border-slate-200'>
                      <p className='text-xs font-semibold text-slate-600'>Total due</p>
                      <p className='text-base font-bold text-slate-900'>
                        {formatCurrency(totalDue)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-slate-800'>Paid this month</h2>
          <div className='rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
            <div className='hidden md:block overflow-x-auto'>
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
            <div className='md:hidden divide-y divide-slate-200'>
              {paidThisMonth.length === 0 ? (
                <p className='px-4 py-6 text-center text-sm text-slate-500'>No rent payments recorded as paid this month yet.</p>
              ) : (
                paidThisMonth.map((p) => (
                  <div key={p.id} className='px-4 py-4 flex flex-col gap-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='text-base font-semibold text-slate-900'>{p.tenant?.name || 'Tenant'}</p>
                        {p.tenant?.email && <p className='text-xs text-slate-500'>{p.tenant.email}</p>}
                      </div>
                      <span className='text-sm font-semibold text-emerald-700'>{formatCurrency(Number(p.amount))}</span>
                    </div>
                    <div className='grid gap-2'>
                      <InfoRow label='Unit' value={formatUnitLabel(p)} />
                      <div className='grid grid-cols-2 gap-2'>
                        <InfoRow label='Due date' value={new Date(p.dueDate).toLocaleDateString()} />
                        <InfoRow label='Rent' value={formatCurrency(Number(p.lease.rentAmount))} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-slate-800'>Late this month</h2>
          <div className='rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
            <div className='hidden md:block overflow-x-auto'>
              <table className='min-w-full text-sm'>
              <thead className='bg-slate-50'>
                <tr>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Tenant</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Unit</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Due date</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Rent</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Status</th>
                </tr>
              </thead>
              <tbody>
                {lateThisMonth.length === 0 && (
                  <tr>
                    <td colSpan={5} className='px-4 py-6 text-center text-slate-500'>
                      No tenants marked late so far this month.
                    </td>
                  </tr>
                )}
                {lateThisMonth.map((p) => (
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
                    <td className='px-4 py-2 text-xs font-semibold uppercase text-slate-700 space-y-1'>
                      <div className='inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase text-white'>
                        {p.status}
                      </div>
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
                              className='inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-slate-800'
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
            <div className='md:hidden divide-y divide-slate-200'>
              {lateThisMonth.length === 0 ? (
                <p className='px-4 py-6 text-center text-sm text-slate-500'>No tenants marked late so far this month.</p>
              ) : (
                lateThisMonth.map((p) => {
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
                    <div key={p.id} className='px-4 py-4 flex flex-col gap-3 bg-white'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <p className='text-base font-semibold text-slate-900'>{p.tenant?.name || 'Tenant'}</p>
                          {p.tenant?.email && <p className='text-xs text-slate-500'>{p.tenant.email}</p>}
                        </div>
                        <span className='inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase text-white'>
                          {p.status}
                        </span>
                      </div>

                      <div className='grid gap-2'>
                        <InfoRow label='Unit' value={unitLabel} />
                        <div className='grid grid-cols-2 gap-2'>
                          <InfoRow label='Due date' value={new Date(p.dueDate).toLocaleDateString()} />
                          <InfoRow label='Rent' value={formatCurrency(rent)} />
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-2'>
                        <InfoRow label='Paid' value={formatCurrency(Number(p.amount))} />
                        <InfoRow label='Owed' value={amountOwed > 0 ? formatCurrency(amountOwed) : '—'} />
                      </div>

                      <Link
                        href={`/admin/evictions?${params.toString()}`}
                        className='inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
                      >
                        Start notice
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className='space-y-3'>
          <h2 className='text-sm font-semibold text-slate-800'>Partial payments</h2>
          <div className='rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
            <div className='hidden md:block overflow-x-auto'>
              <table className='min-w-full text-sm'>
              <thead className='bg-slate-50'>
                <tr>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Tenant</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Unit</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Due date</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Rent</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Paid</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {partialPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className='px-4 py-6 text-center text-slate-500'>
                      No partial payments detected for this month.
                    </td>
                  </tr>
                )}
                {partialPayments.map((p) => {
                  const rent = Number(p.lease.rentAmount);
                  const amt = Number(p.amount);
                  const remaining = rent - amt;

                  return (
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
                        {formatCurrency(rent)}
                      </td>
                      <td className='px-4 py-2 text-xs text-slate-700'>
                        {formatCurrency(amt)}
                      </td>
                      <td className='px-4 py-2 text-xs font-semibold text-slate-700'>
                        {formatCurrency(remaining)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <div className='md:hidden divide-y divide-slate-200'>
              {partialPayments.length === 0 ? (
                <p className='px-4 py-6 text-center text-sm text-slate-500'>No partial payments detected for this month.</p>
              ) : (
                partialPayments.map((p) => {
                  const rent = Number(p.lease.rentAmount);
                  const amt = Number(p.amount);
                  const remaining = rent - amt;

                  return (
                    <div key={p.id} className='px-4 py-4 flex flex-col gap-3 bg-white'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <p className='text-base font-semibold text-slate-900'>{p.tenant?.name || 'Tenant'}</p>
                          {p.tenant?.email && <p className='text-xs text-slate-500'>{p.tenant.email}</p>}
                        </div>
                        <span className='text-sm font-semibold text-slate-900'>{formatCurrency(amt)}</span>
                      </div>

                      <div className='grid gap-2'>
                        <InfoRow label='Unit' value={formatUnitLabel(p)} />
                        <InfoRow label='Due date' value={new Date(p.dueDate).toLocaleDateString()} />
                        <div className='grid grid-cols-2 gap-2'>
                          <InfoRow label='Rent' value={formatCurrency(rent)} />
                          <InfoRow label='Remaining' value={formatCurrency(remaining)} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
