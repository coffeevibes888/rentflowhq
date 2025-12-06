import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';

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

                    await tx.rentPayment.createMany({
                      data: [
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
                      ],
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
                  });
                } else {
                  await prisma.rentalApplication.update({
                    where: { id: application.id },
                    data: {
                      status: nextStatus,
                      notes: combinedNotes,
                    },
                  });
                }
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
