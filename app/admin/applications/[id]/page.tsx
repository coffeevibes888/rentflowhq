import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDecryptedSsn, formatSsn } from '@/lib/utils/ssn-utils';
import { ApplicationDocumentViewer } from '@/components/admin/application-document-viewer';

interface AdminApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

// Helper to calculate age from date of birth
function calculateAge(dateOfBirth: string): number | null {
  try {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

export default async function AdminApplicationDetailPage({ params }: AdminApplicationDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const application = await prisma.rentalApplication.findUnique({
    where: { id },
    include: {
      unit: {
        select: {
          name: true,
          type: true,
          property: { select: { name: true } },
        },
      },
      applicant: {
        select: { id: true, name: true, email: true },
      },
      verification: true,
    },
  });

  if (!application) {
    return (
      <main className='w-full min-h-[calc(100vh-4rem)] flex items-center justify-center'>
        <p className='text-slate-500'>Application not found.</p>
      </main>
    );
  }

  const unitName = application.unit?.name;
  const propertyName = application.unit?.property?.name;
  const unitLabel = propertyName && unitName ? `${propertyName} • ${unitName}` : propertyName || unitName || 'Unit';

  type ApplicationDocumentRow = {
    id: string;
    applicationId: string;
    category: string;
    docType: string;
    originalFileName: string;
    status: string;
  };

  const prismaAny = prisma as any;
  const applicationDocuments = (await prismaAny.applicationDocument.findMany({
    where: { applicationId: application.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      applicationId: true,
      category: true,
      docType: true,
      originalFileName: true,
      status: true,
    },
  })) as ApplicationDocumentRow[];

  // Get verification documents with extracted data
  const verificationDocuments = await prisma.verificationDocument.findMany({
    where: { applicationId: application.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      category: true,
      docType: true,
      originalFileName: true,
      verificationStatus: true,
      extractedData: true,
      ocrConfidence: true,
      cloudinaryPublicId: true,
      cloudinarySecureUrl: true,
    },
  });

  // Extract identity data (from ID documents)
  const identityDoc = verificationDocuments.find(d => d.category === 'identity' && d.extractedData);
  const identityData = identityDoc?.extractedData as any;
  const age = identityData?.dateOfBirth ? calculateAge(identityData.dateOfBirth) : null;

  // Extract income data (from employment documents)
  const employmentDocs = verificationDocuments.filter(d => d.category === 'employment' && d.extractedData);
  const incomeData = employmentDocs.map(d => d.extractedData as any).filter(Boolean);
  
  // Calculate total monthly income from pay stubs
  const payStubData = incomeData.filter(d => d.grossPay);
  const avgGrossPay = payStubData.length > 0 
    ? payStubData.reduce((sum: number, d: any) => sum + (d.grossPay || 0), 0) / payStubData.length
    : null;
  
  // Get employer name from first pay stub
  const employerName = incomeData.find(d => d.employerName)?.employerName;

  // Decrypt SSN for admin viewing (only admins can access this)
  const decryptedSsn = application.encryptedSsn ? await getDecryptedSsn(application.encryptedSsn) : null;

  const requestScreening = async (formData: FormData) => {
    'use server';

    const provider = formData.get('screeningProvider') as string || 'manual';
    const notes = formData.get('screeningNotes') as string || '';

    await prisma.rentalApplication.update({
      where: { id: application.id },
      data: {
        screeningProvider: provider,
        screeningStatus: 'in_progress',
        screeningRequestedAt: new Date(),
        notes: application.notes 
          ? `${application.notes}\n\nScreening Notes: ${notes}`
          : `Screening Notes: ${notes}`,
      },
    });

    revalidatePath('/admin/applications');
    revalidatePath(`/admin/applications/${application.id}`);
  };

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-3xl mx-auto space-y-6'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl md:text-3xl font-semibold text-slate-900 mb-1'>Application</h1>
            <p className='text-sm text-slate-600'>Submitted {new Date(application.createdAt).toLocaleString()}</p>
          </div>
          <Link
            href='/admin/applications'
            className='text-xs text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline'
          >
            Back to applications
          </Link>
        </div>

        <div className='grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]'>
          <section className='space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
            <header className='space-y-1'>
              <p className='inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-600 uppercase'>
                {application.status}
              </p>
              <h2 className='text-lg font-semibold text-slate-900'>
                {application.fullName || application.applicant?.name || 'Applicant'}
              </h2>
              <p className='text-xs text-slate-500'>{unitLabel}</p>
            </header>

            <div className='space-y-2 text-sm text-slate-700'>
              <div>
                <span className='font-medium'>Email: </span>
                <span>{application.email || application.applicant?.email || '—'}</span>
              </div>
              {application.phone && (
                <div>
                  <span className='font-medium'>Phone: </span>
                  <span>{application.phone}</span>
                </div>
              )}
              {application.monthlyIncome && (
                <div>
                  <span className='font-medium'>Monthly income: </span>
                  <span>${Number(application.monthlyIncome).toLocaleString()}</span>
                </div>
              )}
              {application.employmentStatus && (
                <div>
                  <span className='font-medium'>Employment: </span>
                  <span>{application.employmentStatus}</span>
                </div>
              )}
              {decryptedSsn && (
                <div>
                  <span className='font-medium'>SSN: </span>
                  <span className='font-mono text-xs'>{formatSsn(decryptedSsn)}</span>
                </div>
              )}
              {application.moveInDate && (
                <div>
                  <span className='font-medium'>Target move-in: </span>
                  <span>{new Date(application.moveInDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Verified Identity & Income Data */}
            {(identityData || incomeData.length > 0) && (
              <div className='mt-4 p-4 rounded-lg border border-blue-200 bg-blue-50'>
                <p className='font-semibold text-blue-900 text-sm mb-3 flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                  </svg>
                  Verified Information (from uploaded documents)
                </p>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  {identityData?.fullName && (
                    <div>
                      <span className='text-blue-700 font-medium'>Name on ID: </span>
                      <span className='text-blue-900'>{identityData.fullName}</span>
                    </div>
                  )}
                  {age !== null && (
                    <div>
                      <span className='text-blue-700 font-medium'>Age: </span>
                      <span className='text-blue-900'>{age} years old</span>
                    </div>
                  )}
                  {identityData?.dateOfBirth && (
                    <div>
                      <span className='text-blue-700 font-medium'>DOB: </span>
                      <span className='text-blue-900'>{identityData.dateOfBirth}</span>
                    </div>
                  )}
                  {identityData?.issuingState && (
                    <div>
                      <span className='text-blue-700 font-medium'>ID State: </span>
                      <span className='text-blue-900'>{identityData.issuingState}</span>
                    </div>
                  )}
                  {identityData?.expirationDate && (
                    <div>
                      <span className='text-blue-700 font-medium'>ID Expires: </span>
                      <span className='text-blue-900'>{identityData.expirationDate}</span>
                    </div>
                  )}
                  {employerName && (
                    <div>
                      <span className='text-blue-700 font-medium'>Employer: </span>
                      <span className='text-blue-900'>{employerName}</span>
                    </div>
                  )}
                  {avgGrossPay && (
                    <div>
                      <span className='text-blue-700 font-medium'>Avg Gross Pay: </span>
                      <span className='text-blue-900'>${avgGrossPay.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {application.verification?.monthlyIncome && (
                    <div>
                      <span className='text-blue-700 font-medium'>Est. Monthly Income: </span>
                      <span className='text-blue-900 font-semibold'>${Number(application.verification.monthlyIncome).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {application.notes && (
              <div className='mt-4 space-y-1 text-sm text-slate-700'>
                <p className='font-semibold text-slate-900'>Applicant notes</p>
                <p className='whitespace-pre-wrap leading-relaxed'>{application.notes}</p>
              </div>
            )}

            {/* Documents Section - Client Component */}
            <ApplicationDocumentViewer
              verificationDocuments={verificationDocuments.map(doc => ({
                id: doc.id,
                originalFileName: doc.originalFileName,
                category: doc.category,
                docType: doc.docType,
                verificationStatus: doc.verificationStatus,
              }))}
              applicationDocuments={applicationDocuments.map(doc => ({
                id: doc.id,
                originalFileName: doc.originalFileName,
                category: doc.category,
                docType: doc.docType,
                status: doc.status,
              }))}
              applicationId={application.id}
            />
          </section>

          <section className='space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
            <h3 className='text-sm font-semibold text-slate-900'>Tenant screening</h3>
            
            {application.screeningStatus && (
              <div className={`p-3 rounded-lg ${
                application.screeningStatus === 'completed' ? 'bg-green-50 border border-green-200' :
                application.screeningStatus === 'failed' ? 'bg-red-50 border border-red-200' :
                'bg-amber-50 border border-amber-200'
              }`}>
                <p className='font-medium text-sm text-slate-800'>
                  Status: <span className={`${
                    application.screeningStatus === 'completed' ? 'text-green-700' :
                    application.screeningStatus === 'failed' ? 'text-red-700' :
                    'text-amber-700'
                  }`}>{application.screeningStatus}</span>
                </p>
                {application.screeningProvider && (
                  <p className='text-xs text-slate-600'>Provider: {application.screeningProvider}</p>
                )}
              </div>
            )}

            <div className='space-y-3'>
              <p className='text-xs text-slate-600'>Run a background check using one of these services:</p>
              
              <div className='space-y-2'>
                <a 
                  href='https://www.mysmartmove.com/' 
                  target='_blank' 
                  rel='noopener noreferrer'
                  className='flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors'
                >
                  <div>
                    <p className='font-medium text-slate-900 text-sm'>SmartMove by TransUnion</p>
                    <p className='text-xs text-slate-500'>Tenant pays • Credit, criminal, eviction</p>
                  </div>
                  <span className='text-blue-600 text-xs'>→</span>
                </a>
                
                <a 
                  href='https://www.avail.co/tenant-screening' 
                  target='_blank' 
                  rel='noopener noreferrer'
                  className='flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:border-emerald-300 transition-colors'
                >
                  <div>
                    <p className='font-medium text-slate-900 text-sm'>Avail <span className='text-emerald-600 text-xs'>Free basic</span></p>
                    <p className='text-xs text-slate-500'>Tenant pays for full report • Easy to use</p>
                  </div>
                  <span className='text-emerald-600 text-xs'>→</span>
                </a>
                
                <a 
                  href='https://www.rentprep.com/' 
                  target='_blank' 
                  rel='noopener noreferrer'
                  className='flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors'
                >
                  <div>
                    <p className='font-medium text-slate-900 text-sm'>RentPrep</p>
                    <p className='text-xs text-slate-500'>From $21 • Background + eviction</p>
                  </div>
                  <span className='text-blue-600 text-xs'>→</span>
                </a>
              </div>
            </div>

            <form action={requestScreening} className='space-y-3 pt-3 border-t border-slate-100'>
              <p className='text-xs font-medium text-slate-700'>Track screening status</p>
              <select
                name='screeningProvider'
                defaultValue={application.screeningProvider || ''}
                className='w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm'
              >
                <option value=''>Select provider used...</option>
                <option value='smartmove'>SmartMove</option>
                <option value='avail'>Avail</option>
                <option value='rentprep'>RentPrep</option>
                <option value='other'>Other</option>
              </select>
              <textarea
                name='screeningNotes'
                placeholder='Add screening results or notes...'
                className='w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm min-h-[60px]'
              />
              <button
                type='submit'
                className='inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800'
              >
                Update screening status
              </button>
            </form>
          </section>

          <section className='space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
            <h3 className='text-sm font-semibold text-slate-900'>Admin decision</h3>

            <form
              action={async (formData: FormData) => {
                'use server';

                const status = formData.get('status');
                const adminResponse = formData.get('adminResponse');

                const nextStatus =
                  typeof status === 'string' && status ? status : application.status;

                const combinedNotes =
                  typeof adminResponse === 'string' && adminResponse.trim()
                    ? `${application.notes ? `${application.notes}\n\n` : ''}Admin response: ${adminResponse.trim()}`
                    : application.notes ?? null;

                if (nextStatus === 'approved') {
                  await prisma.$transaction(async (tx) => {
                    const freshApp = await tx.rentalApplication.findUnique({
                      where: { id: application.id },
                    });

                    if (!freshApp) {
                      return;
                    }

                    const unitId =
                      freshApp.unitId ||
                      (freshApp.propertySlug
                        ? (
                            await tx.unit.findFirst({
                              where: {
                                isAvailable: true,
                                property: { slug: freshApp.propertySlug },
                              },
                              orderBy: { createdAt: 'asc' },
                            })
                          )?.id ?? null
                        : null);

                    const applicantId =
                      freshApp.applicantId ||
                      (freshApp.email
                        ? (
                            await tx.user.findUnique({
                              where: { email: freshApp.email },
                            })
                          )?.id ?? null
                        : null);

                    if (!unitId || !applicantId) {
                      await tx.rentalApplication.update({
                        where: { id: application.id },
                        data: {
                          status: nextStatus,
                          notes: combinedNotes,
                        },
                      });
                      return;
                    }

                    const unit = await tx.unit.findUnique({
                      where: { id: unitId },
                      include: { property: true },
                    });

                    if (!unit) {
                      await tx.rentalApplication.update({
                        where: { id: application.id },
                        data: {
                          status: nextStatus,
                          notes: combinedNotes,
                        },
                      });
                      return;
                    }

                    const startDate = application.moveInDate ?? new Date();
                    const billingDayOfMonth = startDate.getDate();

                    // Get the property's default lease document if configured
                    const propertyWithLease = await tx.property.findUnique({
                      where: { id: unit.propertyId },
                      include: {
                        defaultLeaseDocument: {
                          select: {
                            id: true,
                            name: true,
                            isFieldsConfigured: true,
                            signatureFields: true,
                            fileUrl: true,
                          },
                        },
                        landlord: {
                          select: { id: true },
                        },
                      },
                    });

                    // Use property's assigned lease document, or fall back to landlord's configured lease
                    let legalDocumentId: string | null = null;
                    let leaseDocument: { id: string; name: string; isFieldsConfigured: boolean; signatureFields: any; fileUrl?: string | null } | null = null;

                    // PRIORITY 1: Use property's assigned default lease (even if fields not configured - signing will use HTML template)
                    if (propertyWithLease?.defaultLeaseDocument) {
                      legalDocumentId = propertyWithLease.defaultLeaseDocument.id;
                      leaseDocument = propertyWithLease.defaultLeaseDocument;
                      console.log(`[Lease Assignment] Using property's assigned lease: ${leaseDocument.name} (configured: ${leaseDocument.isFieldsConfigured})`);
                    } 
                    // PRIORITY 2: Fall back to landlord's most recent CONFIGURED lease (with signature fields)
                    else if (propertyWithLease?.landlord?.id) {
                      const fallbackLease = await tx.legalDocument.findFirst({
                        where: {
                          landlordId: propertyWithLease.landlord.id,
                          type: 'lease',
                          isFieldsConfigured: true,
                          isActive: true,
                        },
                        select: {
                          id: true,
                          name: true,
                          isFieldsConfigured: true,
                          signatureFields: true,
                          fileUrl: true,
                        },
                        orderBy: { createdAt: 'desc' },
                      });

                      if (fallbackLease) {
                        legalDocumentId = fallbackLease.id;
                        leaseDocument = fallbackLease;
                        console.log(`[Lease Assignment] No property lease assigned, using landlord's configured lease: ${leaseDocument.name}`);
                      } else {
                        console.log(`[Lease Assignment] No configured lease found, will use generic HTML template`);
                      }
                    }

                    const lease = await tx.lease.create({
                      data: {
                        unitId,
                        tenantId: applicantId,
                        legalDocumentId,
                        startDate,
                        endDate: null,
                        rentAmount: unit.rentAmount,
                        billingDayOfMonth,
                        status: 'pending_signature', // Changed to pending_signature until signed
                      },
                    });

                    // Create signature request for tenant if we have a configured lease document
                    if (legalDocumentId && leaseDocument) {
                      const crypto = await import('crypto');
                      const tenantToken = crypto.randomBytes(24).toString('hex');
                      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

                      const applicantUser = await tx.user.findUnique({
                        where: { id: applicantId },
                        select: { name: true, email: true },
                      });

                      if (applicantUser?.email) {
                        await tx.documentSignatureRequest.create({
                          data: {
                            documentId: legalDocumentId,
                            leaseId: lease.id,
                            recipientEmail: applicantUser.email,
                            recipientName: applicantUser.name || 'Tenant',
                            status: 'sent',
                            expiresAt,
                            token: tenantToken,
                            role: 'tenant',
                          },
                        });
                      }
                    }

                    const firstMonthDue = startDate;
                    const lastMonthDue = startDate;

                    // Check if tenant has pets (from application notes)
                    const hasPets = freshApp.notes?.toLowerCase().includes('has pets: yes') || 
                                   freshApp.notes?.toLowerCase().includes('has pets: y');
                    const petDepositAmount = hasPets && unit.property?.petDepositAnnual 
                      ? Number(unit.property.petDepositAnnual) 
                      : 0;

                    // Build the rent payments array
                    const rentPaymentsData = [
                        {
                          leaseId: lease.id,
                          tenantId: lease.tenantId,
                          dueDate: firstMonthDue,
                          amount: lease.rentAmount,
                          status: 'pending',
                          metadata: {
                            type: 'first_month_rent',
                          },
                        },
                        {
                          leaseId: lease.id,
                          tenantId: lease.tenantId,
                          dueDate: lastMonthDue,
                          amount: lease.rentAmount,
                          status: 'pending',
                          metadata: {
                            type: 'last_month_rent',
                          },
                        },
                        {
                          leaseId: lease.id,
                          tenantId: lease.tenantId,
                          dueDate: firstMonthDue,
                          amount: lease.rentAmount,
                          status: 'pending',
                          metadata: {
                            type: 'security_deposit',
                          },
                        },
                      ];

                    // Add pet deposit if tenant has pets
                    if (petDepositAmount > 0) {
                      rentPaymentsData.push({
                        leaseId: lease.id,
                        tenantId: lease.tenantId,
                        dueDate: firstMonthDue,
                        amount: petDepositAmount as any,
                        status: 'pending',
                        metadata: {
                          type: 'pet_deposit_annual',
                        },
                      });
                    }

                    await tx.rentPayment.createMany({
                      data: rentPaymentsData,
                    });

                    await tx.unit.update({
                      where: { id: unit.id },
                      data: {
                        isAvailable: false,
                        availableFrom: null,
                      },
                    });

                    await tx.rentalApplication.update({
                      where: { id: application.id },
                      data: {
                        status: nextStatus,
                        notes: combinedNotes,
                      },
                    });

                    // Notify tenant about application approval
                    if (freshApp.applicantId) {
                      const { NotificationService } = await import('@/lib/services/notification-service');
                      const { sendApplicationStatusUpdate } = await import('@/lib/services/email-service');
                      const property = await tx.property.findFirst({
                        where: { slug: freshApp.propertySlug || '' },
                        include: { 
                          landlord: true,
                        },
                      });
                      const applicant = await tx.user.findUnique({
                        where: { id: freshApp.applicantId },
                        select: { name: true, email: true },
                      });

                      if (property?.landlord && applicant) {
                        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                        const leaseUrl = `${baseUrl}/user/profile/lease`;

                        // Create in-app notification
                        await NotificationService.createNotification({
                          userId: freshApp.applicantId,
                          type: 'application',
                          title: 'Application Approved! 🎉',
                          message: `Great news! Your application for ${property.name}${unit ? ` - ${unit.name}` : ''} has been approved. A lease has been created and is ready for you to review.`,
                          actionUrl: `/user/profile/lease`,
                          metadata: { applicationId: application.id, leaseId: lease.id },
                          landlordId: property.landlord.id,
                        });

                        // Send email notification
                        try {
                          await sendApplicationStatusUpdate(
                            applicant.email,
                            applicant.name,
                            property.name,
                            unit?.name || 'Unit',
                            'approved',
                            combinedNotes || 'Your application has been approved. A lease has been created and is ready for you to review.',
                            property.landlord.id,
                            leaseUrl
                          );
                        } catch (emailError) {
                          console.error('Failed to send approval email:', emailError);
                        }
                      }
                    }
                  });
                } else {
                  await prisma.rentalApplication.update({
                    where: { id: application.id },
                    data: {
                      status: nextStatus,
                      notes: combinedNotes,
                    },
                  });

                  // Notify tenant about application status change (rejected/withdrawn)
                  if (application.applicantId && (nextStatus === 'rejected' || nextStatus === 'withdrawn')) {
                    const { NotificationService } = await import('@/lib/services/notification-service');
                    const { sendApplicationStatusUpdate } = await import('@/lib/services/email-service');
                    const property = await prisma.property.findFirst({
                      where: { slug: application.propertySlug || '' },
                      include: { landlord: true },
                    });
                    const applicant = await prisma.user.findUnique({
                      where: { id: application.applicantId },
                      select: { name: true, email: true },
                    });

                    if (property?.landlord && applicant) {
                      const statusMessage = nextStatus === 'rejected' 
                        ? 'Unfortunately, your application has been rejected' 
                        : 'Your application has been withdrawn';
                      const adminMessage = combinedNotes?.split('\n\nAdmin response: ')[1] || '';
                      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                      const applicationUrl = `${baseUrl}/user/profile/application`;
                      
                      // Create in-app notification
                      await NotificationService.createNotification({
                        userId: application.applicantId,
                        type: 'application',
                        title: `Application ${nextStatus === 'rejected' ? 'Rejected' : 'Withdrawn'}`,
                        message: `${statusMessage} for ${property.name}. ${adminMessage ? 'Message: ' + adminMessage : ''}`,
                        actionUrl: `/user/profile/application`,
                        metadata: { applicationId: application.id },
                        landlordId: property.landlord.id,
                      });

                      // Get unit name if available
                      const unitForRejection = await prisma.unit.findUnique({
                        where: { id: application.unitId || '' },
                        select: { name: true },
                      }).catch(() => null);

                      // Send email notification
                      try {
                        await sendApplicationStatusUpdate(
                          applicant.email,
                          applicant.name,
                          property.name,
                          unitForRejection?.name || application.unit?.name || 'Unit',
                          nextStatus as 'rejected' | 'withdrawn',
                          adminMessage || statusMessage,
                          property.landlord.id,
                          applicationUrl
                        );
                      } catch (emailError) {
                        console.error('Failed to send status update email:', emailError);
                      }
                    }
                  }
                }

                // Revalidate all relevant paths and redirect
                revalidatePath('/admin/applications');
                revalidatePath('/admin/leases');
                revalidatePath('/user/profile/rent-receipts');
                revalidatePath('/user/profile/lease');
                redirect('/admin/applications');
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
                  defaultValue={application.status}
                  className='w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm'
                >
                  <option value='pending'>Pending</option>
                  <option value='approved'>Approved</option>
                  <option value='rejected'>Rejected</option>
                  <option value='withdrawn'>Withdrawn</option>
                </select>
              </div>

              <div className='space-y-1 text-sm'>
                <label htmlFor='adminResponse' className='font-medium text-slate-800'>
                  Message to applicant (notes)
                </label>
                <textarea
                  id='adminResponse'
                  name='adminResponse'
                  defaultValue={''}
                  className='w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm min-h-[120px]'
                  placeholder='Explain your decision, conditions, or next steps for this applicant.'
                />
              </div>

              <button
                type='submit'
                className='inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800'
              >
                Save decision
              </button>
            </form>

            <form
              action={async () => {
                'use server';

                await prisma.rentalApplication.delete({
                  where: { id: application.id },
                });

                redirect('/admin/applications');
              }}
              className='pt-2'
            >
              <button
                type='submit'
                className='inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-100'
              >
                Delete application
              </button>
            </form>

            <div className='pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500'>
              <p>
                To contact the applicant directly, use the admin inbox or email them from your email client and
                reference this application.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
