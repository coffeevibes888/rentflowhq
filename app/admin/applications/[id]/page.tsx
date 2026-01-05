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
      <main className='w-full min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
        <p className='text-slate-400'>Application not found.</p>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'withdrawn': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    }
  };

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
    <main className='w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8 md:px-6'>
      <div className='max-w-5xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-white mb-1'>Application Review</h1>
            <p className='text-sm text-slate-400'>
              Submitted {new Date(application.createdAt).toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </p>
          </div>
          <Link
            href='/admin/applications'
            className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/50 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors border border-slate-600/50'
          >
            ← Back
          </Link>
        </div>

        <div className='grid gap-6 lg:grid-cols-[1fr_380px]'>
          {/* Main Content */}
          <div className='space-y-6'>
            {/* Applicant Card */}
            <section className='rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-xl'>
              <div className='flex items-start justify-between gap-4 mb-6'>
                <div className='flex items-center gap-4'>
                  <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold'>
                    {(application.fullName || application.applicant?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-white'>
                      {application.fullName || application.applicant?.name || 'Applicant'}
                    </h2>
                    <p className='text-sm text-slate-400'>{unitLabel}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border ${getStatusColor(application.status)}`}>
                  {application.status}
                </span>
              </div>

              {/* Contact Info Grid */}
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-6'>
                <div className='p-4 rounded-xl bg-slate-700/30 border border-slate-600/30'>
                  <p className='text-xs text-slate-400 mb-1'>Email</p>
                  <p className='text-sm text-white font-medium truncate'>
                    {application.email || application.applicant?.email || '—'}
                  </p>
                </div>
                {application.phone && (
                  <div className='p-4 rounded-xl bg-slate-700/30 border border-slate-600/30'>
                    <p className='text-xs text-slate-400 mb-1'>Phone</p>
                    <p className='text-sm text-white font-medium'>{application.phone}</p>
                  </div>
                )}
                {application.monthlyIncome && (
                  <div className='p-4 rounded-xl bg-slate-700/30 border border-slate-600/30'>
                    <p className='text-xs text-slate-400 mb-1'>Monthly Income</p>
                    <p className='text-sm text-emerald-400 font-semibold'>
                      ${Number(application.monthlyIncome).toLocaleString()}
                    </p>
                  </div>
                )}
                {application.employmentStatus && (
                  <div className='p-4 rounded-xl bg-slate-700/30 border border-slate-600/30'>
                    <p className='text-xs text-slate-400 mb-1'>Employment</p>
                    <p className='text-sm text-white font-medium capitalize'>{application.employmentStatus}</p>
                  </div>
                )}
                {decryptedSsn && (
                  <div className='p-4 rounded-xl bg-slate-700/30 border border-slate-600/30'>
                    <p className='text-xs text-slate-400 mb-1'>SSN</p>
                    <p className='text-sm text-white font-mono'>{formatSsn(decryptedSsn)}</p>
                  </div>
                )}
                {application.moveInDate && (
                  <div className='p-4 rounded-xl bg-slate-700/30 border border-slate-600/30'>
                    <p className='text-xs text-slate-400 mb-1'>Target Move-in</p>
                    <p className='text-sm text-white font-medium'>
                      {new Date(application.moveInDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Verified Data Section */}
              {(identityData || incomeData.length > 0) && (
                <div className='p-5 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 mb-6'>
                  <p className='font-semibold text-blue-400 text-sm mb-4 flex items-center gap-2'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                    </svg>
                    Verified from Documents
                  </p>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                    {identityData?.fullName && (
                      <div>
                        <p className='text-xs text-blue-300/70'>Name on ID</p>
                        <p className='text-sm text-white font-medium'>{identityData.fullName}</p>
                      </div>
                    )}
                    {age !== null && (
                      <div>
                        <p className='text-xs text-blue-300/70'>Age</p>
                        <p className='text-sm text-white font-medium'>{age} years old</p>
                      </div>
                    )}
                    {identityData?.dateOfBirth && (
                      <div>
                        <p className='text-xs text-blue-300/70'>Date of Birth</p>
                        <p className='text-sm text-white font-medium'>{identityData.dateOfBirth}</p>
                      </div>
                    )}
                    {identityData?.issuingState && (
                      <div>
                        <p className='text-xs text-blue-300/70'>ID State</p>
                        <p className='text-sm text-white font-medium'>{identityData.issuingState}</p>
                      </div>
                    )}
                    {identityData?.expirationDate && (
                      <div>
                        <p className='text-xs text-blue-300/70'>ID Expires</p>
                        <p className='text-sm text-white font-medium'>{identityData.expirationDate}</p>
                      </div>
                    )}
                    {employerName && (
                      <div>
                        <p className='text-xs text-blue-300/70'>Employer</p>
                        <p className='text-sm text-white font-medium'>{employerName}</p>
                      </div>
                    )}
                    {avgGrossPay && (
                      <div>
                        <p className='text-xs text-blue-300/70'>Avg Gross Pay</p>
                        <p className='text-sm text-emerald-400 font-semibold'>
                          ${avgGrossPay.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    {application.verification?.monthlyIncome && (
                      <div>
                        <p className='text-xs text-blue-300/70'>Est. Monthly Income</p>
                        <p className='text-sm text-emerald-400 font-semibold'>
                          ${Number(application.verification.monthlyIncome).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Applicant Notes */}
              {application.notes && (
                <div className='p-4 rounded-xl bg-slate-700/30 border border-slate-600/30'>
                  <p className='text-xs text-slate-400 mb-2 font-medium'>Applicant Notes</p>
                  <p className='text-sm text-slate-200 whitespace-pre-wrap leading-relaxed'>{application.notes}</p>
                </div>
              )}

              {/* Documents Section */}
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
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Screening Section */}
            <section className='rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-xl'>
              <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5 text-violet-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Tenant Screening
              </h3>
              
              {application.screeningStatus && (
                <div className={`p-4 rounded-xl mb-4 ${
                  application.screeningStatus === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                  application.screeningStatus === 'failed' ? 'bg-red-500/10 border border-red-500/30' :
                  'bg-amber-500/10 border border-amber-500/30'
                }`}>
                  <p className='font-medium text-sm text-white'>
                    Status: <span className={`${
                      application.screeningStatus === 'completed' ? 'text-emerald-400' :
                      application.screeningStatus === 'failed' ? 'text-red-400' :
                      'text-amber-400'
                    }`}>{application.screeningStatus}</span>
                  </p>
                  {application.screeningProvider && (
                    <p className='text-xs text-slate-400 mt-1'>Provider: {application.screeningProvider}</p>
                  )}
                </div>
              )}

              <p className='text-xs text-slate-400 mb-3'>Run a background check:</p>
              
              <div className='space-y-2 mb-4'>
                <a 
                  href='https://www.mysmartmove.com/' 
                  target='_blank' 
                  rel='noopener noreferrer'
                  className='flex items-center justify-between p-3 rounded-xl border border-slate-600/50 bg-slate-700/30 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all group'
                >
                  <div>
                    <p className='font-medium text-white text-sm'>SmartMove</p>
                    <p className='text-xs text-slate-400'>by TransUnion</p>
                  </div>
                  <span className='text-violet-400 group-hover:translate-x-1 transition-transform'>→</span>
                </a>
                
                <a 
                  href='https://www.avail.co/tenant-screening' 
                  target='_blank' 
                  rel='noopener noreferrer'
                  className='flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all group'
                >
                  <div>
                    <p className='font-medium text-white text-sm'>Avail <span className='text-emerald-400 text-xs'>Free</span></p>
                    <p className='text-xs text-slate-400'>Easy to use</p>
                  </div>
                  <span className='text-emerald-400 group-hover:translate-x-1 transition-transform'>→</span>
                </a>
                
                <a 
                  href='https://www.rentprep.com/' 
                  target='_blank' 
                  rel='noopener noreferrer'
                  className='flex items-center justify-between p-3 rounded-xl border border-slate-600/50 bg-slate-700/30 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all group'
                >
                  <div>
                    <p className='font-medium text-white text-sm'>RentPrep</p>
                    <p className='text-xs text-slate-400'>From $21</p>
                  </div>
                  <span className='text-violet-400 group-hover:translate-x-1 transition-transform'>→</span>
                </a>
              </div>

              <form action={requestScreening} className='space-y-3 pt-4 border-t border-slate-700/50'>
                <p className='text-xs font-medium text-slate-300'>Track screening status</p>
                <select
                  name='screeningProvider'
                  defaultValue={application.screeningProvider || ''}
                  className='w-full rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none'
                >
                  <option value=''>Select provider...</option>
                  <option value='smartmove'>SmartMove</option>
                  <option value='avail'>Avail</option>
                  <option value='rentprep'>RentPrep</option>
                  <option value='other'>Other</option>
                </select>
                <textarea
                  name='screeningNotes'
                  placeholder='Add screening results...'
                  className='w-full rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none min-h-[80px] resize-none'
                />
                <button
                  type='submit'
                  className='w-full rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-600 transition-colors'
                >
                  Update Status
                </button>
              </form>
            </section>

            {/* Decision Section */}
            <section className='rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-6 shadow-xl'>
              <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                <svg className='w-5 h-5 text-violet-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Make Decision
              </h3>

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

                      let legalDocumentId: string | null = null;
                      let leaseDocument: { id: string; name: string; isFieldsConfigured: boolean; signatureFields: any; fileUrl?: string | null } | null = null;

                      if (propertyWithLease?.defaultLeaseDocument) {
                        legalDocumentId = propertyWithLease.defaultLeaseDocument.id;
                        leaseDocument = propertyWithLease.defaultLeaseDocument;
                      } else if (propertyWithLease?.landlord?.id) {
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
                          status: 'pending_signature',
                        },
                      });

                      if (legalDocumentId && leaseDocument) {
                        const crypto = await import('crypto');
                        const tenantToken = crypto.randomBytes(24).toString('hex');
                        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

                      const hasPets = freshApp.notes?.toLowerCase().includes('has pets: yes') || 
                                     freshApp.notes?.toLowerCase().includes('has pets: y');
                      const petDepositAmount = hasPets && unit.property?.petDepositAnnual 
                        ? Number(unit.property.petDepositAnnual) 
                        : 0;

                      const rentPaymentsData = [
                        {
                          leaseId: lease.id,
                          tenantId: lease.tenantId,
                          dueDate: firstMonthDue,
                          amount: lease.rentAmount,
                          status: 'pending',
                          metadata: { type: 'first_month_rent' },
                        },
                        {
                          leaseId: lease.id,
                          tenantId: lease.tenantId,
                          dueDate: lastMonthDue,
                          amount: lease.rentAmount,
                          status: 'pending',
                          metadata: { type: 'last_month_rent' },
                        },
                        {
                          leaseId: lease.id,
                          tenantId: lease.tenantId,
                          dueDate: firstMonthDue,
                          amount: lease.rentAmount,
                          status: 'pending',
                          metadata: { type: 'security_deposit' },
                        },
                      ];

                      if (petDepositAmount > 0) {
                        rentPaymentsData.push({
                          leaseId: lease.id,
                          tenantId: lease.tenantId,
                          dueDate: firstMonthDue,
                          amount: petDepositAmount as any,
                          status: 'pending',
                          metadata: { type: 'pet_deposit_annual' },
                        });
                      }

                      await tx.rentPayment.createMany({ data: rentPaymentsData });

                      await tx.unit.update({
                        where: { id: unit.id },
                        data: { isAvailable: false, availableFrom: null },
                      });

                      await tx.rentalApplication.update({
                        where: { id: application.id },
                        data: { status: nextStatus, notes: combinedNotes },
                      });

                      if (freshApp.applicantId) {
                        const { NotificationService } = await import('@/lib/services/notification-service');
                        const { sendApplicationStatusUpdate } = await import('@/lib/services/email-service');
                        const property = await tx.property.findFirst({
                          where: { slug: freshApp.propertySlug || '' },
                          include: { landlord: true },
                        });
                        const applicant = await tx.user.findUnique({
                          where: { id: freshApp.applicantId },
                          select: { name: true, email: true },
                        });

                        if (property?.landlord && applicant) {
                          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                          const leaseUrl = `${baseUrl}/user/profile/lease`;

                          await NotificationService.createNotification({
                            userId: freshApp.applicantId,
                            type: 'application',
                            title: 'Application Approved!',
                            message: `Great news! Your application for ${property.name}${unit ? ` - ${unit.name}` : ''} has been approved.`,
                            actionUrl: `/user/profile/lease`,
                            metadata: { applicationId: application.id, leaseId: lease.id },
                            landlordId: property.landlord.id,
                          });

                          try {
                            await sendApplicationStatusUpdate(
                              applicant.email,
                              applicant.name,
                              property.name,
                              unit?.name || 'Unit',
                              'approved',
                              combinedNotes || 'Your application has been approved.',
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
                      data: { status: nextStatus, notes: combinedNotes },
                    });

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
                        
                        await NotificationService.createNotification({
                          userId: application.applicantId,
                          type: 'application',
                          title: `Application ${nextStatus === 'rejected' ? 'Rejected' : 'Withdrawn'}`,
                          message: `${statusMessage} for ${property.name}.`,
                          actionUrl: `/user/profile/application`,
                          metadata: { applicationId: application.id },
                          landlordId: property.landlord.id,
                        });

                        const unitForRejection = await prisma.unit.findUnique({
                          where: { id: application.unitId || '' },
                          select: { name: true },
                        }).catch(() => null);

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

                  revalidatePath('/admin/applications');
                  revalidatePath('/admin/leases');
                  revalidatePath('/user/profile/rent-receipts');
                  revalidatePath('/user/profile/lease');
                  redirect('/admin/applications');
                }}
                className='space-y-4'
              >

                <div className='space-y-2'>
                  <label htmlFor='status' className='text-xs font-medium text-slate-300'>
                    Decision
                  </label>
                  <select
                    id='status'
                    name='status'
                    defaultValue={application.status}
                    className='w-full rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none'
                  >
                    <option value='pending'>Pending</option>
                    <option value='approved'>Approved</option>
                    <option value='rejected'>Rejected</option>
                    <option value='withdrawn'>Withdrawn</option>
                  </select>
                </div>

                <div className='space-y-2'>
                  <label htmlFor='adminResponse' className='text-xs font-medium text-slate-300'>
                    Message to Applicant
                  </label>
                  <textarea
                    id='adminResponse'
                    name='adminResponse'
                    defaultValue={''}
                    className='w-full rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none min-h-[100px] resize-none'
                    placeholder='Explain your decision or next steps...'
                  />
                </div>

                <button
                  type='submit'
                  className='w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25'
                >
                  Save Decision
                </button>
              </form>

              <form
                action={async () => {
                  'use server';
                  await prisma.rentalApplication.delete({ where: { id: application.id } });
                  redirect('/admin/applications');
                }}
                className='pt-4 border-t border-slate-700/50 mt-4'
              >
                <button
                  type='submit'
                  className='w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors'
                >
                  Delete Application
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
