import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { redirect } from 'next/navigation';

export default async function UserProfileApplicationPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id as string;

  const applications = await prisma.rentalApplication.findMany({
    where: { applicantId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      unit: {
        include: {
          property: {
            select: {
              name: true,
              address: true,
            },
          },
        },
      },
      verification: {
        select: {
          identityStatus: true,
          employmentStatus: true,
          overallStatus: true,
        },
      },
    },
  });

  return (
    <div className='w-full px-4 py-8 md:px-8'>
      <div className='max-w-4xl mx-auto space-y-6'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold text-white mb-1'>My Rental Applications</h1>
          <p className='text-sm text-slate-400'>Track the status of applications you have submitted.</p>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/60 shadow-lg overflow-hidden'>
          {applications.length === 0 ? (
            <div className='px-4 py-6 text-center text-sm text-slate-500'>
              You have not submitted any applications yet.
            </div>
          ) : (
            <table className='min-w-full text-sm'>
              <thead className='bg-slate-800/60'>
                <tr>
                  <th className='px-4 py-2 text-left font-medium text-slate-400'>Property</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-400'>Submitted</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-400'>Status</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-400'>Verification</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className='border-t border-white/10'>
                    <td className='px-4 py-2 align-top text-xs text-slate-300'>
                      {app.unit?.property?.name || app.propertySlug || 'N/A'}
                      {app.unit?.property?.address && typeof app.unit.property.address === 'object' && (
                        <div className='text-slate-500'>
                          {(app.unit.property.address as any).city}, {(app.unit.property.address as any).state}
                        </div>
                      )}
                    </td>
                    <td className='px-4 py-2 align-top text-xs text-slate-400'>
                      {new Date(app.createdAt).toLocaleString()}
                    </td>
                    <td className='px-4 py-2 align-top text-xs capitalize text-slate-300'>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        app.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                        app.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                        app.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className='px-4 py-2 align-top text-xs'>
                      {app.verification ? (
                        <div className='space-y-1'>
                          <div className={`${
                            app.verification.identityStatus === 'verified' ? 'text-green-600' :
                            app.verification.identityStatus === 'rejected' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            ID: {app.verification.identityStatus}
                          </div>
                          <div className={`${
                            app.verification.employmentStatus === 'verified' ? 'text-green-600' :
                            app.verification.employmentStatus === 'rejected' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            Income: {app.verification.employmentStatus}
                          </div>
                        </div>
                      ) : (
                        <span className='text-slate-500'>Not started</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
