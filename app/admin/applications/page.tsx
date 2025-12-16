import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { formatCurrency } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Admin Applications',
};

const AdminApplicationsPage = async () => {
  await requireAdmin();
  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlordId = landlordResult.landlord.id;

  // Get all properties for this landlord to match by propertySlug
  const landlordProperties = await prisma.property.findMany({
    where: { landlordId },
    select: { slug: true },
  });
  const landlordPropertySlugs = landlordProperties.map(p => p.slug);

  const applications = await prisma.rentalApplication.findMany({
    where: {
      OR: [
        // Applications linked to a unit under this landlord
        {
          unit: {
            property: {
              landlordId,
            },
          },
        },
        // Applications with a propertySlug matching this landlord's properties (even if no unit linked yet)
        {
          propertySlug: {
            in: landlordPropertySlugs,
          },
        },
      ],
    },
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

  const renderStatusPill = (app: (typeof applications)[number]) => {
    const unitHasApproved = app.unitId ? approvedByUnit[app.unitId] : false;

    if (app.status === 'approved') {
      return (
        <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-200/90 border border-emerald-400/40 capitalize'>
          <span className='h-1.5 w-1.5 rounded-full bg-emerald-400' />
          Approved
        </span>
      );
    }

    if (unitHasApproved) {
      return (
        <span className='inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-[11px] font-medium text-red-200/90 border border-red-400/40 capitalize'>
          <span className='h-1.5 w-1.5 rounded-full bg-red-400' />
          {app.status}
        </span>
      );
    }

    return (
      <span className='inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200/90 border border-white/10 capitalize ring-1 ring-white/10'>
        <span className='h-1.5 w-1.5 rounded-full bg-slate-400' />
        {app.status}
      </span>
    );
  };

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-6'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-50 mb-1'>Rental applications</h1>
          <p className='text-sm text-slate-300/80'>Review and respond to incoming applications from prospects.</p>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/60 shadow-sm overflow-hidden'>
          <div className='hidden md:block overflow-x-auto'>
            <table className='min-w-full text-sm'>
            <thead className='bg-slate-900/80 border-b border-white/10'>
              <tr>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Applicant</th>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Unit / property</th>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Submitted</th>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Income</th>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Status</th>
                <th className='px-4 py-2 text-left font-medium text-slate-200/90'>Actions</th>
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
                <tr key={app.id} className='border-t border-white/10 hover:bg-slate-900/80 transition-colors'>
                  <td className='px-4 py-2 align-top text-xs text-slate-200/90'>
                    {app.fullName || app.applicant?.name || 'Applicant'}
                    <span className='block text-[11px] text-slate-300/80'>
                      {app.email || app.applicant?.email || '—'}
                    </span>
                  </td>
                  <td className='px-4 py-2 align-top text-xs text-slate-200/90'>{formatUnitLabel(app)}</td>
                  <td className='px-4 py-2 align-top text-xs text-slate-300/80'>
                    {new Date(app.createdAt).toLocaleString()}
                  </td>
                  <td className='px-4 py-2 align-top text-xs text-slate-200/90'>
                    {app.monthlyIncome ? formatCurrency(Number(app.monthlyIncome)) : '—'}
                  </td>
                  <td className='px-4 py-2 align-top text-xs'>
                    {renderStatusPill(app)}
                  </td>
                  <td className='px-4 py-2 align-top text-xs'>
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className='inline-flex items-center rounded-full bg-violet-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-violet-400 transition-colors'
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className='md:hidden divide-y divide-white/10'>
            {applications.length === 0 ? (
              <p className='px-4 py-6 text-center text-sm text-slate-400'>No applications yet.</p>
            ) : (
              applications.map((app) => (
                <div key={app.id} className='px-4 py-4 flex flex-col gap-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='space-y-1'>
                      <p className='text-base font-semibold text-slate-50'>{app.fullName || app.applicant?.name || 'Applicant'}</p>
                      <p className='text-xs text-slate-300'>{app.email || app.applicant?.email || '—'}</p>
                    </div>
                    {renderStatusPill(app)}
                  </div>
                  <div className='grid grid-cols-1 gap-2 text-xs text-slate-300'>
                    <InfoRow label='Unit / property' value={formatUnitLabel(app)} />
                    <InfoRow
                      label='Submitted'
                      value={new Date(app.createdAt).toLocaleString()}
                    />
                    <InfoRow
                      label='Monthly income'
                      value={app.monthlyIncome ? formatCurrency(Number(app.monthlyIncome)) : '—'}
                    />
                  </div>
                  <div>
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className='inline-flex w-full items-center justify-center rounded-full bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-400 transition-colors'
                    >
                      Open application
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminApplicationsPage;

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className='flex flex-col rounded-lg border border-white/5 bg-slate-900/40 p-3'>
    <span className='text-[11px] uppercase tracking-wide text-slate-400'>{label}</span>
    <span className={cn('text-sm text-slate-100', typeof value === 'string' && value === '—' ? 'text-slate-400' : '')}>{value}</span>
  </div>
);
