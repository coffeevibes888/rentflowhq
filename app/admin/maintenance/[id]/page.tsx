import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';

interface AdminMaintenanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMaintenanceDetailPage({ params }: AdminMaintenanceDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
    include: {
      tenant: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!ticket) {
    return (
      <main className='w-full min-h-[calc(100vh-4rem)] flex items-center justify-center'>
        <p className='text-slate-500'>Ticket not found.</p>
      </main>
    );
  }

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-3xl mx-auto space-y-6'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl md:text-3xl font-semibold text-slate-900 mb-1'>Maintenance ticket</h1>
            <p className='text-sm text-slate-600'>Created {new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
          <Link
            href='/admin/maintenance'
            className='text-xs text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline'
          >
            Back to tickets
          </Link>
        </div>

        <div className='grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]'>
          <section className='space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
            <header className='space-y-1'>
              <p className='inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-600 uppercase'>
                {ticket.status}
              </p>
              <h2 className='text-lg font-semibold text-slate-900'>{ticket.title}</h2>
            </header>
            <div className='text-sm text-slate-700 whitespace-pre-wrap leading-relaxed'>
              {ticket.description}
            </div>
          </section>

          <section className='space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='space-y-1'>
              <h3 className='text-sm font-semibold text-slate-900'>Tenant</h3>
              <p className='text-sm text-slate-700'>
                {ticket.tenant?.name || 'Unknown tenant'}
                {ticket.tenant?.email && (
                  <span className='block text-xs text-slate-500'>{ticket.tenant.email}</span>
                )}
              </p>
            </div>

            <form
              action={async (formData: FormData) => {
                'use server';

                const status = formData.get('status');
                const assignedToName = formData.get('assignedToName');

                await prisma.maintenanceTicket.update({
                  where: { id: ticket.id },
                  data: {
                    status: typeof status === 'string' && status ? status : ticket.status,
                    assignedToName:
                      typeof assignedToName === 'string' && assignedToName.trim()
                        ? assignedToName.trim()
                        : null,
                  },
                });
              }}
              className='space-y-4'
            >
              <div className='space-y-1 text-sm'>
                <label htmlFor='status' className='font-medium text-slate-800'>
                  Status
                </label>
                <select
                  id='status'
                  name='status'
                  defaultValue={ticket.status}
                  className='w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm'
                >
                  <option value='open'>Open</option>
                  <option value='in_progress'>In progress</option>
                  <option value='resolved'>Resolved</option>
                  <option value='closed'>Closed</option>
                </select>
              </div>

              <div className='space-y-1 text-sm'>
                <label htmlFor='assignedToName' className='font-medium text-slate-800'>
                  Assign to (name)
                </label>
                <input
                  id='assignedToName'
                  name='assignedToName'
                  defaultValue={ticket.assignedToName ?? ''}
                  className='w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm'
                  placeholder='e.g. John from Maintenance'
                />
              </div>

              <button
                type='submit'
                className='inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800'
              >
                Save changes
              </button>
            </form>

            <div className='pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500'>
              <p>
                Need to contact the tenant? Use the internal inbox and reference this ticket.
              </p>
              <Link
                href='/admin/messages'
                className='text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline'
              >
                Open admin inbox
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
