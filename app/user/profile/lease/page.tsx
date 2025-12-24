import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { redirect } from 'next/navigation';
import DocusignSignButton from './docusign-sign-button';
import LeaseViewer from './lease-viewer';
import { renderDocuSignReadyLeaseHtml } from '@/lib/services/lease-template';

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
          property: { select: { name: true, landlord: { select: { name: true } } } },
        },
      },
      signatureRequests: {
        where: { status: 'signed' },
        orderBy: { signedAt: 'desc' },
        take: 1,
      },
    },
  });

  // Get the most recent signed PDF URL (could be from tenant or landlord signature)
  const signedPdfUrl = lease?.signatureRequests?.[0]?.signedPdfUrl || null;

  const leaseHtml = lease
    ? renderDocuSignReadyLeaseHtml({
        landlordName: lease.unit.property?.landlord?.name || lease.unit.property?.name || 'Landlord',
        tenantName: session.user.name || 'Tenant',
        propertyLabel: `${lease.unit.property?.name || 'Property'} - ${lease.unit.name} (${lease.unit.type})`,
        leaseStartDate: new Date(lease.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        leaseEndDate: lease.endDate
          ? new Date(lease.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : 'Month-to-Month',
        rentAmount: Number(lease.rentAmount).toLocaleString(),
        billingDayOfMonth: String(lease.billingDayOfMonth),
        todayDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      })
    : '';

  return (
    <div className='w-full min-h-screen px-4 py-8 md:px-8'>
      <div className='max-w-5xl mx-auto space-y-8'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-3xl md:text-4xl font-bold text-white'>Current Lease</h1>
          <p className='text-sm md:text-base text-gray-300'>
            Review the key details of your active rental agreement.
          </p>
        </div>

        {!lease ? (
          <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-6 py-8 shadow-lg text-sm text-gray-200'>
            You don&apos;t have an active lease on file yet. Please contact management if you believe this is a mistake.
          </div>
        ) : (
          <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg space-y-6 text-sm text-gray-100'>
            <div className='space-y-2'>
              <p className='text-[11px] font-semibold text-gray-300 uppercase tracking-[0.16em]'>Property</p>
              <p className='text-base md:text-lg font-medium text-white'>
                {lease.unit.property?.name || 'Property'} • {lease.unit.name}
              </p>
              <p className='text-xs text-gray-300'>{lease.unit.type}</p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/10'>
              <div className='space-y-1'>
                <p className='text-[11px] font-semibold text-gray-300 uppercase tracking-[0.16em]'>Start date</p>
                <p className='text-sm md:text-base'>
                  {new Date(lease.startDate).toLocaleDateString()}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-[11px] font-semibold text-gray-300 uppercase tracking-[0.16em]'>End date</p>
                <p className='text-sm md:text-base'>
                  {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Ongoing'}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-[11px] font-semibold text-gray-300 uppercase tracking-[0.16em]'>Monthly rent</p>
                <p className='text-sm md:text-base font-semibold text-white'>
                  ${Number(lease.rentAmount).toLocaleString()}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-[11px] font-semibold text-gray-300 uppercase tracking-[0.16em]'>Billing day</p>
                <p className='text-sm md:text-base'>Day {lease.billingDayOfMonth} of each month</p>
              </div>
            </div>

            <div className='pt-6 mt-2 border-t border-white/10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <p className='text-xs md:text-sm text-gray-300 md:max-w-xl'>
                This summary is for convenience only. For the full legal agreement, review and sign the electronic lease
                document.
              </p>
              <div className='flex gap-3'>
                <LeaseViewer leaseHtml={leaseHtml} signedPdfUrl={signedPdfUrl} triggerLabel='View lease' />
                <DocusignSignButton leaseId={lease.id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
