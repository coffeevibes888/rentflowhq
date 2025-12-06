import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Property Management Settings',
};

const AdminSettingsPage = async () => {
  await requireAdmin();

  return (
    <main className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-8'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-900 mb-1'>Settings</h1>
          <p className='text-sm text-slate-600'>Company, leasing, notifications, and legal defaults for your portfolio.</p>
        </div>

        <section className='grid gap-6 md:grid-cols-2'>
          <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3'>
            <h2 className='text-sm font-semibold text-slate-900'>Company profile</h2>
            <div className='space-y-2 text-sm'>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Management company name</label>
                <input className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm' placeholder='Acme Property Management LLC' />
              </div>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Primary contact email</label>
                <input className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm' placeholder='leasing@company.com' />
              </div>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Office phone</label>
                <input className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm' placeholder='(555) 123-4567' />
              </div>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Office address</label>
                <input className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm' placeholder='Street, city, state, ZIP' />
              </div>
            </div>
          </div>

          <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3'>
            <h2 className='text-sm font-semibold text-slate-900'>Leasing defaults</h2>
            <div className='grid gap-3 text-sm md:grid-cols-2'>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Default lease term (months)</label>
                <input className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm' placeholder='12' />
              </div>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Billing day of month</label>
                <input className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm' placeholder='1' />
              </div>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Late fee (%)</label>
                <input className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm' placeholder='5' />
              </div>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Grace period (days)</label>
                <input className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm' placeholder='3' />
              </div>
            </div>
          </div>
        </section>

        <section className='grid gap-6 md:grid-cols-2'>
          <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3'>
            <h2 className='text-sm font-semibold text-slate-900'>Notifications</h2>
            <p className='text-xs text-slate-600'>Where should we send alerts for applications, maintenance tickets, and late rent.</p>
            <div className='space-y-2 text-sm'>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Notifications email</label>
                <input className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm' placeholder='notifications@company.com' />
              </div>
              <div className='space-y-1 text-xs text-slate-700'>
                <label className='inline-flex items-center gap-2'>
                  <input type='checkbox' className='h-3.5 w-3.5 rounded border-slate-300' defaultChecked />
                  New rental applications
                </label>
                <label className='inline-flex items-center gap-2'>
                  <input type='checkbox' className='h-3.5 w-3.5 rounded border-slate-300' defaultChecked />
                  New maintenance tickets
                </label>
                <label className='inline-flex items-center gap-2'>
                  <input type='checkbox' className='h-3.5 w-3.5 rounded border-slate-300' defaultChecked />
                  Late rent & partial payments
                </label>
              </div>
            </div>
          </div>

          <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3'>
            <h2 className='text-sm font-semibold text-slate-900'>Legal & documents</h2>
            <div className='space-y-2 text-sm'>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Primary state / jurisdiction</label>
                <input className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm' placeholder='e.g. California' />
              </div>
              <div>
                <label className='block text-xs font-medium text-slate-600'>Default notice footer</label>
                <textarea
                  className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm min-h-[80px]'
                  placeholder='Standard legal disclaimer or footer text to append to notices and communications.'
                />
              </div>
              <p className='text-[11px] text-slate-500'>
                These fields are for convenience only and do not constitute legal advice. Always have your attorney
                review final documents.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminSettingsPage;
