import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getDecryptedSsn, formatSsn } from '@/lib/utils/ssn-utils';
import { getSignedCloudinaryUrl } from '@/lib/cloudinary';

interface AdminApplicationDetailPageProps {
  params: Promise<{ id: string }>;
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

  // Decrypt SSN for admin viewing (only admins can access this)
  const decryptedSsn = application.encryptedSsn ? await getDecryptedSsn(application.encryptedSsn) : null;

  const requestScreening = async (formData: FormData) => {
    'use server';

    const bundle = formData.get('screeningBundle');

    const bundleValue = typeof bundle === 'string' && bundle ? bundle : 'full_package';

    await prisma.rentalApplication.update({
      where: { id: application.id },
      data: {
        screeningProvider: 'rentspree',
        screeningBundle: bundleValue,
        screeningStatus: 'requested',
        screeningRequestedAt: new Date(),
      },
    });

    revalidatePath('/admin/applications');
    revalidatePath(`/admin/applications/${application.id}`);
  };

  const openApplicationDocument = async (formData: FormData) => {
    'use server';

    const documentId = formData.get('documentId');
    if (typeof documentId !== 'string' || !documentId) {
      return;
    }

    const prismaAny = prisma as any;
    const doc = await prismaAny.applicationDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        applicationId: true,
        cloudinaryPublicId: true,
        cloudinaryResourceType: true,
      },
    });

    if (!doc || doc.applicationId !== application.id) {
      return;
    }

    const url = getSignedCloudinaryUrl({
      publicId: doc.cloudinaryPublicId,
      resourceType: doc.cloudinaryResourceType,
      expiresInSeconds: 60 * 10,
    });

    redirect(url);
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

            {application.notes && (
              <div className='mt-4 space-y-1 text-sm text-slate-700'>
                <p className='font-semibold text-slate-900'>Applicant notes</p>
                <p className='whitespace-pre-wrap leading-relaxed'>{application.notes}</p>
              </div>
            )}

            <div className='mt-4 space-y-2'>
              <p className='font-semibold text-slate-900 text-sm'>Verification documents</p>
              {applicationDocuments.length === 0 ? (
                <p className='text-xs text-slate-500'>No documents uploaded yet.</p>
              ) : (
                <div className='space-y-2'>
                  {applicationDocuments.map((doc: ApplicationDocumentRow) => (
                    <div
                      key={doc.id}
                      className='flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'
                    >
                      <div className='min-w-0'>
                        <p className='text-xs font-medium text-slate-900 truncate'>{doc.originalFileName}</p>
                        <p className='text-[11px] text-slate-500'>
                          {String(doc.category).replace(/_/g, ' ')} • {String(doc.docType).replace(/_/g, ' ')} •{' '}
                          {doc.status}
                        </p>
                      </div>

                      <form action={openApplicationDocument}>
                        <input type='hidden' name='documentId' value={doc.id} />
                        <button
                          type='submit'
                          className='inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800'
                        >
                          View
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className='space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
            <h3 className='text-sm font-semibold text-slate-900'>Tenant screening</h3>
            <div className='space-y-2 text-xs text-slate-600'>
              <p>Order a screening package for this applicant. Results will appear in your connected provider.</p>
              {application.screeningStatus && (
                <p className='text-slate-500'>
                  Current status: <span className='font-medium text-slate-800'>{application.screeningStatus}</span>
                  {application.screeningBundle && ` • ${application.screeningBundle}`}
                </p>
              )}
            </div>

            <form action={requestScreening} className='space-y-3 text-sm'>
              <div className='space-y-1'>
                <label className='block text-xs font-medium text-slate-700'>Choose screening type</label>
                <select
                  name='screeningBundle'
                  defaultValue={application.screeningBundle || 'full_package'}
                  className='w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm'
                >
                  <option value='eviction_only'>Evictions only</option>
                  <option value='background_only'>Background & address history</option>
                  <option value='full_package'>Full package (credit, background, evictions)</option>
                </select>
              </div>

              <button
                type='submit'
                className='inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500'
              >
                Request screening
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

                    const lease = await tx.lease.create({
                      data: {
                        unitId,
                        tenantId: applicantId,
                        startDate,
                        endDate: null,
                        rentAmount: unit.rentAmount,
                        billingDayOfMonth,
                        status: 'active',
                      },
                    });

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
