import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';

export default async function AdminMaintenancePage() {
  await requireAdmin();

  const tickets = await prisma.maintenanceTicket.findMany({
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
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-900 mb-2'>Maintenance tickets</h1>
          <p className='text-sm text-slate-600'>View and manage work requests from tenants.</p>
        </div>

        <div className='rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
          <table className='min-w-full text-sm'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Created</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Title</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Tenant</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Priority</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Status</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Assigned to</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className='px-4 py-6 text-center text-slate-500'>
                    No maintenance tickets yet.
                  </td>
                </tr>
              )}
              {tickets.map((ticket) => {
                const assignedToName = ticket.assignedToName ?? null;

                return (
                  <tr key={ticket.id} className='border-t border-slate-100 hover:bg-slate-50/80'>
                  <td className='px-4 py-2 align-top text-xs text-slate-500'>
                    {new Date(ticket.createdAt).toLocaleString()}
                  </td>
                  <td className='px-4 py-2 align-top'>
                    <Link
                      href={`/admin/maintenance/${ticket.id}`}
                      className='font-medium text-slate-900 hover:underline'
                    >
                      {ticket.title}
                    </Link>
                    <p className='text-xs text-slate-500 line-clamp-2'>{ticket.description}</p>
                  </td>
                  <td className='px-4 py-2 align-top text-xs text-slate-600'>
                    {ticket.tenant?.name || 'Unknown tenant'}
                    {ticket.tenant?.email && (
                      <span className='block text-[11px] text-slate-400'>{ticket.tenant.email}</span>
                    )}
                  </td>
                  <td className='px-4 py-2 align-top text-xs capitalize'>{ticket.priority}</td>
                  <td className='px-4 py-2 align-top text-xs capitalize'>{ticket.status}</td>
                  <td className='px-4 py-2 align-top text-xs text-slate-600'>
                    {assignedToName || <span className='text-slate-400'>Unassigned</span>}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
