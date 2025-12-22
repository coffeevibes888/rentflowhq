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
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-8'>
        {/* Header */}
        <div>
          <p className='text-xs uppercase tracking-[0.2em] text-violet-200/70'>Rent Management</p>
          <h1 className='text-3xl md:text-4xl font-semibold text-white'>Rents Overview</h1>
          <p className='text-slate-300/80 text-sm mt-1'>Current month rent status across all active leases.</p>
        </div>

        {/* Summary Stats */}
        <div className='relative rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md'>
          <div className='absolute inset-0 bg-blue-700' />
          <div className='relative p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-bold text-white'>Monthly Summary</h3>
              <span className='text-xs text-violet-200/80 bg-white/5 px-2 py-1 rounded-full ring-1 ring-white/10'>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
              <div className='rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm shadow-2xl'>
                <div className='flex items-center justify-between'>
                  <div className='text-xs text-emerald-100'>Collected</div>
                  <CheckCircle2 className='h-4 w-4 text-white/90' />
                </div>
                <div className='text-2xl font-bold text-white'>{formatCurrency(totalCollected)}</div>
                <div className='text-[10px] text-emerald-100'>{paidThisMonth.length} payments</div>
              </div>

              <div className='rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm shadow-2xl'>
                <div className='flex items-center justify-between'>
                  <div className='text-xs text-amber-100'>Late</div>
                  <Clock className='h-4 w-4 text-white/90' />
                </div>
                <div className='text-2xl font-bold text-white'>{formatCurrency(totalLate)}</div>
                <div className='text-[10px] text-amber-100'>{lateThisMonth.length} overdue</div>
              </div>

              <div className='rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm shadow-2xl'>
                <div className='flex items-center justify-between'>
                  <div className='text-xs text-blue-100'>Move-in Pending</div>
                  <Users className='h-4 w-4 text-white/90' />
                </div>
                <div className='text-2xl font-bold text-white'>{formatCurrency(pendingMoveIn)}</div>
                <div className='text-[10px] text-blue-100'>{Object.keys(moveInByTenant).length} tenants</div>
              </div>

              <div className='rounded-xl bg-gradient-to-r from-violet-600 via-purple-500 to-violet-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm shadow-2xl'>
                <div className='flex items-center justify-between'>
                  <div className='text-xs text-violet-100'>Partial</div>
                  <AlertCircle className='h-4 w-4 text-white/90' />
                </div>
                <div className='text-2xl font-bold text-white'>{partialPayments.length}</div>
                <div className='text-[10px] text-violet-100'>incomplete payments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Move-in Payments - Consolidated */}
        {Object.keys(moveInByTenant).length > 0 && (
          <section className='space-y-4'>
            <div>
              <h2 className='text-lg font-semibold text-white'>Pending Move-in Payments</h2>
              <p className='text-sm text-slate-400'>First month, last month rent, and security deposits awaiting payment.</p>
            </div>
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
                    className='rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-4'
                  >
                    <div className='flex items-start justify-between'>
                      <div>
                        <p className='font-semibold text-white'>{group.tenant?.name || 'Tenant'}</p>
                        {group.tenant?.email && (
                          <p className='text-xs text-slate-400'>{group.tenant.email}</p>
                        )}
                        <p className='text-xs text-slate-500 mt-1'>{unitLabel}</p>
                      </div>
                      <span className='inline-flex items-center rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-medium text-amber-300 border border-amber-400/30'>
                        Pending
                      </span>
                    </div>

                    <div className='rounded-lg bg-slate-800/60 p-3 space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-slate-400'>First month rent</span>
                        <span className='text-white font-medium'>
                          {firstMonth ? formatCurrency(Number(firstMonth.amount)) : '—'}
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-slate-400'>Last month rent</span>
                        <span className='text-white font-medium'>
                          {lastMonth ? formatCurrency(Number(lastMonth.amount)) : '—'}
                        </span>
                      </div>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-slate-400'>Security deposit</span>
                        <span className='text-white font-medium'>
                          {securityDeposit ? formatCurrency(Number(securityDeposit.amount)) : '—'}
                        </span>
                      </div>
                    </div>

                    <div className='pt-3 border-t border-white/10 flex items-center justify-between'>
                      <span className='text-sm text-slate-400'>Total due</span>
                      <span className='text-xl font-bold text-white'>{formatCurrency(totalDue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Paid This Month */}
        <section className='space-y-4'>
          <div>
            <h2 className='text-lg font-semibold text-white'>Paid This Month</h2>
            <p className='text-sm text-slate-400'>Rent payments successfully collected.</p>
          </div>
          <div className='rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden'>
            {paidThisMonth.length === 0 ? (
              <div className='px-6 py-12 text-center'>
                <CheckCircle2 className='w-10 h-10 text-slate-600 mx-auto mb-3' />
                <p className='text-slate-400'>No rent payments recorded as paid this month yet.</p>
              </div>
            ) : (
              <div className='divide-y divide-white/5'>
                {paidThisMonth.map((p) => (
                  <div key={p.id} className='px-5 py-4 flex items-center justify-between gap-4'>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-white truncate'>{p.tenant?.name || 'Tenant'}</p>
                      <p className='text-xs text-slate-400 truncate'>{formatUnitLabel(p)}</p>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold text-emerald-400'>{formatCurrency(Number(p.amount))}</p>
                      <p className='text-[10px] text-slate-500'>
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
        <section className='space-y-4'>
          <div>
            <h2 className='text-lg font-semibold text-white'>Late This Month</h2>
            <p className='text-sm text-slate-400'>Overdue rent payments requiring attention.</p>
          </div>
          <div className='rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden'>
            {lateThisMonth.length === 0 ? (
              <div className='px-6 py-12 text-center'>
                <CheckCircle2 className='w-10 h-10 text-emerald-600 mx-auto mb-3' />
                <p className='text-slate-400'>No tenants marked late so far this month. Great job!</p>
              </div>
            ) : (
              <div className='divide-y divide-white/5'>
                {lateThisMonth.map((p) => {
                  const rent = Number(p.lease.rentAmount);
                  const amt = Number(p.amount);
                  const amountOwed = rent - (Number.isNaN(amt) ? 0 : amt);

                  return (
                    <div key={p.id} className='px-5 py-4 flex items-center justify-between gap-4'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-white truncate'>{p.tenant?.name || 'Tenant'}</p>
                        <p className='text-xs text-slate-400 truncate'>{formatUnitLabel(p)}</p>
                      </div>
                      <div className='flex items-center gap-4'>
                        <div className='text-right'>
                          <p className='font-semibold text-red-400'>{formatCurrency(amountOwed > 0 ? amountOwed : rent)}</p>
                          <p className='text-[10px] text-slate-500'>
                            Due {new Date(p.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className='inline-flex items-center rounded-full bg-red-500/20 px-2.5 py-1 text-[10px] font-medium text-red-300 border border-red-400/30 uppercase'>
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
          <section className='space-y-4'>
            <div>
              <h2 className='text-lg font-semibold text-white'>Partial Payments</h2>
              <p className='text-sm text-slate-400'>Payments that were less than the full rent amount.</p>
            </div>
            <div className='rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden'>
              <div className='divide-y divide-white/5'>
                {partialPayments.map((p) => {
                  const rent = Number(p.lease.rentAmount);
                  const amt = Number(p.amount);
                  const remaining = rent - amt;

                  return (
                    <div key={p.id} className='px-5 py-4 flex items-center justify-between gap-4'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-white truncate'>{p.tenant?.name || 'Tenant'}</p>
                        <p className='text-xs text-slate-400 truncate'>{formatUnitLabel(p)}</p>
                      </div>
                      <div className='flex items-center gap-6'>
                        <div className='text-right'>
                          <p className='text-xs text-slate-500'>Paid</p>
                          <p className='font-medium text-emerald-400'>{formatCurrency(amt)}</p>
                        </div>
                        <div className='text-right'>
                          <p className='text-xs text-slate-500'>Remaining</p>
                          <p className='font-semibold text-amber-400'>{formatCurrency(remaining)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
