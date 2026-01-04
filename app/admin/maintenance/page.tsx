import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { cn } from '@/lib/utils';

export default async function AdminMaintenancePage() {
  await requireAdmin();
  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success || !landlordResult.landlord) {
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
    <main className='w-full space-y-4'>
      <div>
        <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50 mb-1'>Maintenance tickets</h1>
        <p className='text-xs text-slate-300/80'>View and manage work requests from tenants.</p>
      </div>

      <div className='rounded-lg sm:rounded-xl border border-white/10 bg-slate-900/60 shadow-sm overflow-hidden'>
        <div className='hidden md:block overflow-x-auto'>
          <table className='min-w-full text-sm'>
          <thead className='bg-slate-900/80 border-b border-white/10'>
            <tr>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90 text-xs'>Created</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90 text-xs'>Title</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90 text-xs'>Tenant</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90 text-xs'>Priority</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90 text-xs'>Status</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90 text-xs'>Assigned</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className='px-3 py-6 text-center text-slate-300/80 text-xs'>
                  No maintenance tickets yet.
                </td>
              </tr>
            )}
            {tickets.map((ticket) => {
              const assignedToName = ticket.assignedToName ?? null;

              return (
                <tr key={ticket.id} className='border-t border-white/10 hover:bg-slate-900/80 transition-colors'>
                <td className='px-3 py-2 align-top text-[10px] text-slate-300/80'>
                  {new Date(ticket.createdAt).toLocaleString()}
                </td>
                <td className='px-3 py-2 align-top'>
                  <Link
                    href={`/admin/maintenance/${ticket.id}`}
                    className='font-medium text-slate-50 hover:text-violet-200/80 transition-colors text-xs'
                  >
                    {ticket.title}
                  </Link>
                  <p className='text-[10px] text-slate-300/80 line-clamp-2'>{ticket.description}</p>
                </td>
                <td className='px-3 py-2 align-top text-[10px] text-slate-200/90'>
                  {ticket.tenant?.name || 'Unknown tenant'}
                  {ticket.tenant?.email && (
                    <span className='block text-[10px] text-slate-300/80'>{ticket.tenant.email}</span>
                  )}
                </td>
                <td className='px-3 py-2 align-top text-[10px] capitalize text-slate-200/90'>{ticket.priority}</td>
                <td className='px-3 py-2 align-top text-[10px] capitalize text-slate-200/90'>{renderStatusTag(ticket.status)}</td>
                <td className='px-3 py-2 align-top text-[10px] text-slate-200/90'>
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
            <p className='px-3 py-6 text-center text-xs text-slate-400'>No maintenance tickets yet.</p>
          ) : (
            tickets.map((ticket) => {
              const assignedToName = ticket.assignedToName ?? null;

              return (
                <Link 
                  key={ticket.id} 
                  href={`/admin/maintenance/${ticket.id}`}
                  className='flex flex-col gap-2 p-3 hover:bg-slate-800/40 active:scale-[0.99] transition-all'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-semibold text-slate-50 truncate'>
                        {ticket.title}
                      </p>
                      <p className='text-[10px] text-slate-300/80 line-clamp-1 mt-0.5'>{ticket.description}</p>
                    </div>
                    {renderStatusTag(ticket.status)}
                  </div>

                  <div className='grid grid-cols-2 gap-1.5 text-[10px]'>
                    <div className='rounded bg-slate-900/40 p-2 border border-white/5'>
                      <span className='text-slate-400 block'>Tenant</span>
                      <span className='text-slate-100'>{ticket.tenant?.name || 'Unknown'}</span>
                    </div>
                    <div className='rounded bg-slate-900/40 p-2 border border-white/5'>
                      <span className='text-slate-400 block'>Priority</span>
                      <span className='text-slate-100 capitalize'>{ticket.priority}</span>
                    </div>
                    <div className='rounded bg-slate-900/40 p-2 border border-white/5'>
                      <span className='text-slate-400 block'>Created</span>
                      <span className='text-slate-100'>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className='rounded bg-slate-900/40 p-2 border border-white/5'>
                      <span className='text-slate-400 block'>Assigned</span>
                      <span className={cn('text-slate-100', !assignedToName && 'text-slate-400')}>{assignedToName || 'Unassigned'}</span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className='flex flex-col rounded bg-slate-900/40 p-2 border border-white/5'>
    <span className='text-[9px] uppercase tracking-wide text-slate-400'>{label}</span>
    <span className={cn('text-xs text-slate-100', typeof value === 'string' && value === 'Unassigned' ? 'text-slate-400' : '')}>{value}</span>
  </div>
);
