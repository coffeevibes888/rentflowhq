import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

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

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-6'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-50 mb-2'>Maintenance tickets</h1>
          <p className='text-sm text-slate-300/80'>View and manage work requests from tenants.</p>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/60 shadow-sm overflow-hidden'>
          <div className='overflow-x-auto'>
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
                  <td className='px-4 py-2 align-top text-xs capitalize text-slate-200/90'>{ticket.status}</td>
                  <td className='px-4 py-2 align-top text-xs text-slate-200/90'>
                    {assignedToName || <span className='text-slate-300/80'>Unassigned</span>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </main>
  );
}
