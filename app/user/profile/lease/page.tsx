import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { redirect } from 'next/navigation';

export default async function UserProfileLeasePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id as string;

  const lease = await prisma.lease.findFirst({
    where: {
      tenantId: userId,
      status: 'active',
    },
    orderBy: { startDate: 'desc' },
    include: {
      unit: {
        select: {
          name: true,
          type: true,
          property: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className='w-full px-4 py-8 md:px-8'>
      <div className='max-w-3xl mx-auto space-y-6'>
        <div>
          <h1 className='text-2xl md:text-3xl font-semibold text-slate-900 mb-1'>Current lease</h1>
          <p className='text-sm text-slate-600'>View the details of your current rental agreement.</p>
        </div>

        {!lease ? (
          <div className='rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-6 text-sm text-slate-500'>
            You don&apos;t have an active lease on file yet. Please contact management if you believe this is a mistake.
          </div>
        ) : (
          <div className='rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4 text-sm text-slate-700'>
            <div className='space-y-1'>
              <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Property</p>
              <p className='text-sm text-slate-800'>
                {lease.unit.property?.name || 'Property'} • {lease.unit.name}
              </p>
              <p className='text-xs text-slate-500'>{lease.unit.type}</p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Start date</p>
                <p>{new Date(lease.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>End date</p>
                <p>{lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Ongoing'}</p>
              </div>
              <div>
                <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Monthly rent</p>
                <p>${Number(lease.rentAmount).toLocaleString()}</p>
              </div>
              <div>
                <p className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>Billing day</p>
                <p>Day {lease.billingDayOfMonth} of each month</p>
              </div>
            </div>

            <div className='pt-4 border-t border-slate-200 text-xs text-slate-500'>
              This is a summary for convenience only. For the full legal agreement, refer to your signed lease
              documents from management.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
