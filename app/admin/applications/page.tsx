import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { formatCurrency } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Applications',
};

const AdminApplicationsPage = async () => {
  await requireAdmin();

  const applications = await prisma.rentalApplication.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      unit: {
        select: {
          name: true,
          property: { select: { name: true } },
        },
      },
      applicant: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const formatUnitLabel = (app: (typeof applications)[number]) => {
    const unitName = app.unit?.name;
    const propertyName = app.unit?.property?.name;
    if (unitName && propertyName) return `${propertyName} • ${unitName}`;
    if (propertyName) return propertyName;
    return unitName || 'Unit';
  };

  const approvedByUnit: Record<string, boolean> = {};
  for (const app of applications) {
    if (app.unitId && app.status === 'approved') {
      approvedByUnit[app.unitId] = true;
    }
  }

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-6'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-900 mb-1'>Rental applications</h1>
          <p className='text-sm text-slate-600'>Review and respond to incoming applications from prospects.</p>
        </div>

        <div className='rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
          <table className='min-w-full text-sm'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Applicant</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Unit / property</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Submitted</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Income</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Status</th>
                <th className='px-4 py-2 text-left font-medium text-slate-500'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 && (
                <tr>
                  <td colSpan={6} className='px-4 py-6 text-center text-slate-500'>
                    No applications yet.
                  </td>
                </tr>
              )}
              {applications.map((app) => (
                <tr key={app.id} className='border-t border-slate-100 hover:bg-slate-50/80'>
                  <td className='px-4 py-2 align-top text-xs text-slate-700'>
                    {app.fullName || app.applicant?.name || 'Applicant'}
                    <span className='block text-[11px] text-slate-400'>
                      {app.email || app.applicant?.email || '—'}
                    </span>
                  </td>
                  <td className='px-4 py-2 align-top text-xs text-slate-700'>{formatUnitLabel(app)}</td>
                  <td className='px-4 py-2 align-top text-xs text-slate-500'>
                    {new Date(app.createdAt).toLocaleString()}
                  </td>
                  <td className='px-4 py-2 align-top text-xs text-slate-700'>
                    {app.monthlyIncome ? formatCurrency(Number(app.monthlyIncome)) : '—'}
                  </td>
                  <td className='px-4 py-2 align-top text-xs'>
                    {(() => {
                      const unitHasApproved = app.unitId ? approvedByUnit[app.unitId] : false;

                      if (app.status === 'approved') {
                        return (
                          <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-200 capitalize'>
                            <span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                            Approved
                          </span>
                        );
                      }

                      if (unitHasApproved) {
                        return (
                          <span className='inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 border border-red-200 capitalize'>
                            <span className='h-1.5 w-1.5 rounded-full bg-red-500' />
                            {app.status}
                          </span>
                        );
                      }

                      return (
                        <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 border border-slate-200 capitalize'>
                          <span className='h-1.5 w-1.5 rounded-full bg-slate-400' />
                          {app.status}
                        </span>
                      );
                    })()}
                  </td>
                  <td className='px-4 py-2 align-top text-xs'>
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className='inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-slate-800'
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default AdminApplicationsPage;
