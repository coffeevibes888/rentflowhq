import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { redirect } from 'next/navigation';

export default async function UserProfileApplicationPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const email = session.user.email as string;

  const applications = await prisma.rentalApplication.findMany({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className='w-full px-4 py-8 md:px-8'>
      <div className='max-w-4xl mx-auto space-y-6'>
        <div>
          <h1 className='text-2xl md:text-3xl font-semibold text-slate-900 mb-1'>My rental applications</h1>
          <p className='text-sm text-slate-600'>Track the status of applications you have submitted.</p>
        </div>

        <div className='rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden'>
          {applications.length === 0 ? (
            <div className='px-4 py-6 text-center text-sm text-slate-500'>
              You have not submitted any applications yet.
            </div>
          ) : (
            <table className='min-w-full text-sm'>
              <thead className='bg-slate-50'>
                <tr>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Submitted</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Status</th>
                  <th className='px-4 py-2 text-left font-medium text-slate-500'>Notes</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className='border-t border-slate-100'>
                    <td className='px-4 py-2 align-top text-xs text-slate-600'>
                      {new Date(app.createdAt).toLocaleString()}
                    </td>
                    <td className='px-4 py-2 align-top text-xs capitalize text-slate-700'>{app.status}</td>
                    <td className='px-4 py-2 align-top text-xs text-slate-600 whitespace-pre-wrap'>
                      {app.notes || '—'}
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
