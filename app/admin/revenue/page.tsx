import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { formatCurrency } from '@/lib/utils';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { DollarSign, Clock, AlertCircle, CheckCircle2, Users } from 'lucide-react';

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

  // Group move-in payments by tenant and consolidate into single entries
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
    ...rentPayments.filter((p) => p.status === 'paid'),
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

  // Calculate summary stats
  const totalCollected = paidThisMonth.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalLate = lateThisMonth.reduce((sum, p) => sum + Number(p.lease.rentAmount), 0);
  const pendingMoveIn = Object.values(moveInByTenant).reduce(
    (sum, group) => sum + group.payments.reduce((s, p) => s + Number(p.amount), 0),
    0
  );

  const formatUnitLabel = (p: (typeof rentPayments)[number]) => {
    const unitName = p.lease.unit?.name;
    const propertyName = p.lease.unit?.property?.name;
    if (unitName && propertyName) return `${propertyName} • ${unitName}`;
    if (propertyName) return propertyName;
    return unitName || 'Unit';
  };

  return (
    <main className='w-full space-y-4'>
      {/* Header */}
      <div>
        <p className='text-[10px] uppercase tracking-[0.15em] text-violet-200/70'>Rent Management</p>
        <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-white'>Rents Overview</h1>
        <p className='text-slate-300/80 text-xs mt-0.5'>Current month rent status across all active leases.</p>
      </div>

      {/* Summary Stats */}
      <div className='relative rounded-xl sm:rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-md'>
        <div className='absolute inset-0 bg-blue-700' />
        <div className='relative p-3 sm:p-4 md:p-6'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm sm:text-base font-bold text-white'>Monthly Summary</h3>
            <span className='text-[10px] text-violet-200/80 bg-white/5 px-1.5 py-0.5 rounded-full ring-1 ring-white/10'>
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className='grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4'>
            <div className='rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 border border-white/10 p-2.5 sm:p-3 md:p-4 space-y-1 backdrop-blur-sm shadow-xl'>
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-emerald-100'>Collected</div>
                <CheckCircle2 className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/90' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-white'>{formatCurrency(totalCollected)}</div>
              <div className='text-[9px] sm:text-[10px] text-emerald-100'>{paidThisMonth.length} payments</div>
            </div>

            <div className='rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 border border-white/10 p-2.5 sm:p-3 md:p-4 space-y-1 backdrop-blur-sm shadow-xl'>
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-amber-100'>Late</div>
                <Clock className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/90' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-white'>{formatCurrency(totalLate)}</div>
              <div className='text-[9px] sm:text-[10px] text-amber-100'>{lateThisMonth.length} overdue</div>
            </div>

            <div className='rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-2.5 sm:p-3 md:p-4 space-y-1 backdrop-blur-sm shadow-xl'>
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-blue-100'>Move-in</div>
                <Users className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/90' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-white'>{formatCurrency(pendingMoveIn)}</div>
              <div className='text-[9px] sm:text-[10px] text-blue-100'>{Object.keys(moveInByTenant).length} tenants</div>
            </div>

            <div className='rounded-lg sm:rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 border border-white/10 p-2.5 sm:p-3 md:p-4 space-y-1 backdrop-blur-sm shadow-xl'>
              <div className='flex items-center justify-between'>
                <div className='text-[10px] sm:text-xs text-violet-100'>Partial</div>
                <AlertCircle className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/90' />
              </div>
              <div className='text-lg sm:text-xl md:text-2xl font-bold text-white'>{partialPayments.length}</div>
              <div className='text-[9px] sm:text-[10px] text-violet-100'>incomplete</div>
            </div>
          </div>
        </div>
      </div>

        {/* Pending Move-in Payments - Consolidated */}
        {Object.keys(moveInByTenant).length > 0 && (
          <section className='space-y-3'>
            <div>
              <h2 className='text-sm sm:text-base font-semibold text-white'>Pending Move-in Payments</h2>
              <p className='text-[10px] sm:text-xs text-slate-400'>First month, last month rent, and security deposits.</p>
            </div>
            <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
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
                    className='rounded-lg sm:rounded-xl border border-white/10 bg-slate-900/60 p-3 sm:p-4 space-y-3'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='min-w-0 flex-1'>
                        <p className='font-semibold text-white text-sm truncate'>{group.tenant?.name || 'Tenant'}</p>
                        <p className='text-[10px] text-slate-500 truncate'>{unitLabel}</p>
                      </div>
                      <span className='inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-medium text-amber-300 border border-amber-400/30 shrink-0'>
                        Pending
                      </span>
                    </div>

                    <div className='rounded bg-slate-800/60 p-2 space-y-1.5 text-xs'>
                      <div className='flex items-center justify-between'>
                        <span className='text-slate-400'>First month</span>
                        <span className='text-white font-medium'>
                          {firstMonth ? formatCurrency(Number(firstMonth.amount)) : '—'}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-slate-400'>Last month</span>
                        <span className='text-white font-medium'>
                          {lastMonth ? formatCurrency(Number(lastMonth.amount)) : '—'}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-slate-400'>Security</span>
                        <span className='text-white font-medium'>
                          {securityDeposit ? formatCurrency(Number(securityDeposit.amount)) : '—'}
                        </span>
                      </div>
                    </div>

                    <div className='pt-2 border-t border-white/10 flex items-center justify-between'>
                      <span className='text-xs text-slate-400'>Total due</span>
                      <span className='text-base sm:text-lg font-bold text-white'>{formatCurrency(totalDue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Paid This Month */}
        <section className='space-y-3'>
          <div>
            <h2 className='text-sm sm:text-base font-semibold text-white'>Paid This Month</h2>
            <p className='text-[10px] sm:text-xs text-slate-400'>Rent payments successfully collected.</p>
          </div>
          <div className='rounded-lg sm:rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden'>
            {paidThisMonth.length === 0 ? (
              <div className='px-4 py-8 text-center'>
                <CheckCircle2 className='w-8 h-8 text-slate-600 mx-auto mb-2' />
                <p className='text-slate-400 text-xs'>No rent payments recorded as paid this month yet.</p>
              </div>
            ) : (
              <div className='divide-y divide-white/5'>
                {paidThisMonth.map((p) => (
                  <div key={p.id} className='px-3 py-3 flex items-center justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-white truncate text-sm'>{p.tenant?.name || 'Tenant'}</p>
                      <p className='text-[10px] text-slate-400 truncate'>{formatUnitLabel(p)}</p>
                    </div>
                    <div className='text-right shrink-0'>
                      <p className='font-semibold text-emerald-400 text-sm'>{formatCurrency(Number(p.amount))}</p>
                      <p className='text-[9px] text-slate-500'>
                        Due {new Date(p.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Late This Month */}
        <section className='space-y-3'>
          <div>
            <h2 className='text-sm sm:text-base font-semibold text-white'>Late This Month</h2>
            <p className='text-[10px] sm:text-xs text-slate-400'>Overdue rent payments requiring attention.</p>
          </div>
          <div className='rounded-lg sm:rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden'>
            {lateThisMonth.length === 0 ? (
              <div className='px-4 py-8 text-center'>
                <CheckCircle2 className='w-8 h-8 text-emerald-600 mx-auto mb-2' />
                <p className='text-slate-400 text-xs'>No tenants marked late so far this month. Great job!</p>
              </div>
            ) : (
              <div className='divide-y divide-white/5'>
                {lateThisMonth.map((p) => {
                  const rent = Number(p.lease.rentAmount);
                  const amt = Number(p.amount);
                  const amountOwed = rent - (Number.isNaN(amt) ? 0 : amt);

                  return (
                    <div key={p.id} className='px-3 py-3 flex items-center justify-between gap-2'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-white truncate text-sm'>{p.tenant?.name || 'Tenant'}</p>
                        <p className='text-[10px] text-slate-400 truncate'>{formatUnitLabel(p)}</p>
                      </div>
                      <div className='flex items-center gap-2 shrink-0'>
                        <div className='text-right'>
                          <p className='font-semibold text-red-400 text-sm'>{formatCurrency(amountOwed > 0 ? amountOwed : rent)}</p>
                          <p className='text-[9px] text-slate-500'>
                            Due {new Date(p.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className='inline-flex items-center rounded-full bg-red-500/20 px-1.5 py-0.5 text-[8px] font-medium text-red-300 border border-red-400/30 uppercase'>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Partial Payments */}
        {partialPayments.length > 0 && (
          <section className='space-y-3'>
            <div>
              <h2 className='text-sm sm:text-base font-semibold text-white'>Partial Payments</h2>
              <p className='text-[10px] sm:text-xs text-slate-400'>Payments less than the full rent amount.</p>
            </div>
            <div className='rounded-lg sm:rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden'>
              <div className='divide-y divide-white/5'>
                {partialPayments.map((p) => {
                  const rent = Number(p.lease.rentAmount);
                  const amt = Number(p.amount);
                  const remaining = rent - amt;

                  return (
                    <div key={p.id} className='px-3 py-3 flex items-center justify-between gap-2'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-white truncate text-sm'>{p.tenant?.name || 'Tenant'}</p>
                        <p className='text-[10px] text-slate-400 truncate'>{formatUnitLabel(p)}</p>
                      </div>
                      <div className='flex items-center gap-3 shrink-0'>
                        <div className='text-right'>
                          <p className='text-[9px] text-slate-500'>Paid</p>
                          <p className='font-medium text-emerald-400 text-xs'>{formatCurrency(amt)}</p>
                        </div>
                        <div className='text-right'>
                          <p className='text-[9px] text-slate-500'>Remaining</p>
                          <p className='font-semibold text-amber-400 text-xs'>{formatCurrency(remaining)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
    </main>
  );
}
