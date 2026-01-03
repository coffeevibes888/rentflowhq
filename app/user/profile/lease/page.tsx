import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { redirect } from 'next/navigation';
import DocusignSignButton from './docusign-sign-button';
import LeaseViewer from './lease-viewer';
import { renderDocuSignReadyLeaseHtml } from '@/lib/services/lease-template';
import { getSignedUrlFromStoredUrl } from '@/lib/cloudinary';

export default async function UserProfileLeasePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id as string;

  const lease = await prisma.lease.findFirst({
    where: {
      tenantId: userId,
      status: { in: ['active', 'pending_signature'] },
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
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Get the most recent signed PDF URL (could be from tenant or landlord signature)
  // For a fully executed lease, we want the landlord's signed PDF (which includes both signatures)
  // Otherwise fall back to tenant's signed PDF
  const landlordSignedRequest = lease?.signatureRequests?.find(sr => sr.role === 'landlord' && sr.status === 'signed');
  const tenantSignedRequest = lease?.signatureRequests?.find(sr => sr.role === 'tenant' && sr.status === 'signed');
  const signedRequest = landlordSignedRequest || tenantSignedRequest;
  
  // Generate a signed URL for authenticated Cloudinary PDFs
  const rawPdfUrl = signedRequest?.signedPdfUrl || null;
  const signedPdfUrl = rawPdfUrl ? getSignedUrlFromStoredUrl(rawPdfUrl) : null;
  
  // Build signatures array for display
  const signatures: { name: string; role: string; signedAt: Date | null }[] = [];
  if (tenantSignedRequest?.signedAt) {
    signatures.push({
      name: tenantSignedRequest.signerName || tenantSignedRequest.recipientName,
      role: 'Tenant',
      signedAt: tenantSignedRequest.signedAt,
    });
  }
  if (landlordSignedRequest?.signedAt) {
    signatures.push({
      name: landlordSignedRequest.signerName || landlordSignedRequest.recipientName,
      role: 'Landlord',
      signedAt: landlordSignedRequest.signedAt,
    });
  }
  
  // Check if tenant needs to sign
  const tenantSignatureRequest = lease?.signatureRequests?.find(
    sr => sr.role === 'tenant' && sr.recipientEmail === session.user.email
  );
  const needsTenantSignature = tenantSignatureRequest && tenantSignatureRequest.status !== 'signed';
  const isPendingSignature = lease?.status === 'pending_signature';

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
          <>
            {/* Pending Signature Banner */}
            {isPendingSignature && (
              <div className='backdrop-blur-md bg-amber-500/20 border border-amber-400/50 rounded-xl px-6 py-4 shadow-lg'>
                <div className='flex items-start gap-3'>
                  <div className='rounded-full bg-amber-500/30 p-2 mt-0.5'>
                    <svg className='h-5 w-5 text-amber-300' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-base font-semibold text-amber-100'>Lease Awaiting Signature</h3>
                    <p className='text-sm text-amber-200/80 mt-1'>
                      {needsTenantSignature 
                        ? 'Your application has been approved! Please review and sign your lease agreement below to complete your move-in process.'
                        : 'Your lease is pending final signatures. You can still proceed with move-in payments.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                <LeaseViewer 
                  leaseHtml={leaseHtml} 
                  signedPdfUrl={signedPdfUrl} 
                  signatures={signatures}
                  triggerLabel='View lease' 
                />
                <DocusignSignButton leaseId={lease.id} />
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
