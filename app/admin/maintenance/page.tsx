import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { cn } from '@/lib/utils';

export default async function AdminMaintenancePage() {
  await requireAdmin();
  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlordId = landlordResult.landlord.id;

  const tickets = await prisma.maintenanceTicket.findMany({
    where: {
      unit: {
        property: {
          landlordId,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const renderStatusTag = (status: string) => (
    <span className='inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-200/90 border border-white/10'>
      <span className={cn('h-1.5 w-1.5 rounded-full', status === 'completed' ? 'bg-emerald-400' : status === 'in_progress' ? 'bg-amber-400' : 'bg-slate-400')} />
      {status.replace(/_/g, ' ')}
    </span>
  );

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-6'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-50 mb-2'>Maintenance tickets</h1>
          <p className='text-sm text-slate-300/80'>View and manage work requests from tenants.</p>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/60 shadow-sm overflow-hidden'>
          <div className='hidden md:block overflow-x-auto'>
            <table className='min-w-full text-sm'>
            <thead className='bg-slate-900/80 border-b border-white/10'>
              <tr>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Created</th>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Title</th>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Tenant</th>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Priority</th>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Status</th>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Assigned to</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className='px-4 py-6 text-center text-slate-300/80'>
                    No maintenance tickets yet.
                  </td>
                </tr>
              )}
              {tickets.map((ticket) => {
                const assignedToName = ticket.assignedToName ?? null;

                return (
                  <tr key={ticket.id} className='border-t border-white/10 hover:bg-slate-900/80 transition-colors'>
                  <td className='px-4 py-2 align-top text-xs text-slate-300/80'>
                    {new Date(ticket.createdAt).toLocaleString()}
                  </td>
                  <td className='px-4 py-2 align-top'>
                    <Link
                      href={`/admin/maintenance/${ticket.id}`}
                      className='font-medium text-slate-50 hover:text-violet-200/80 transition-colors'
                    >
                      {ticket.title}
                    </Link>
                    <p className='text-xs text-slate-300/80 line-clamp-2'>{ticket.description}</p>
                  </td>
                  <td className='px-4 py-2 align-top text-xs text-slate-200/90'>
                    {ticket.tenant?.name || 'Unknown tenant'}
                    {ticket.tenant?.email && (
                      <span className='block text-[11px] text-slate-300/80'>{ticket.tenant.email}</span>
                    )}
                  </td>
                  <td className='px-4 py-2 align-top text-xs capitalize text-slate-200/90'>{ticket.priority}</td>
                  <td className='px-4 py-2 align-top text-xs capitalize text-slate-200/90'>{renderStatusTag(ticket.status)}</td>
                  <td className='px-4 py-2 align-top text-xs text-slate-200/90'>
                    {assignedToName || <span className='text-slate-300/80'>Unassigned</span>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <div className='md:hidden divide-y divide-white/10'>
            {tickets.length === 0 ? (
              <p className='px-4 py-6 text-center text-sm text-slate-400'>No maintenance tickets yet.</p>
            ) : (
              tickets.map((ticket) => {
                const assignedToName = ticket.assignedToName ?? null;

                return (
                  <div key={ticket.id} className='flex flex-col gap-3 px-4 py-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <Link
                          href={`/admin/maintenance/${ticket.id}`}
                          className='text-base font-semibold text-slate-50 hover:text-violet-200/80 transition-colors'
                        >
                          {ticket.title}
                        </Link>
                        <p className='text-xs text-slate-300/80 mt-1'>{ticket.description}</p>
                      </div>
                      {renderStatusTag(ticket.status)}
                    </div>

                    <div className='grid gap-2 text-xs text-slate-300'>
                      <InfoRow label='Created' value={new Date(ticket.createdAt).toLocaleString()} />
                      <InfoRow
                        label='Tenant'
                        value={
                          <div>
                            <p className='text-sm text-slate-100'>{ticket.tenant?.name || 'Unknown tenant'}</p>
                            {ticket.tenant?.email && <p className='text-xs text-slate-400'>{ticket.tenant.email}</p>}
                          </div>
                        }
                      />
                      <div className='grid grid-cols-2 gap-2'>
                        <InfoRow label='Priority' value={ticket.priority} />
                        <InfoRow label='Assigned' value={assignedToName || 'Unassigned'} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className='flex flex-col rounded-lg border border-white/5 bg-slate-900/40 p-3'>
    <span className='text-[11px] uppercase tracking-wide text-slate-400'>{label}</span>
    <span className={cn('text-sm text-slate-100', typeof value === 'string' && value === 'Unassigned' ? 'text-slate-400' : '')}>{value}</span>
  </div>
);
