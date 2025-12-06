import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { Building2, Users, FileText, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Property Dashboard',
};

const AdminOverviewPage = async () => {
  await requireAdmin();

  const [
    propertiesCount,
    applicationsCount,
    tenantsCount,
    ticketsCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'tenant' } }),
    prisma.maintenanceTicket.count(),
  ]);

  return (
    <div className='w-full px-4 py-8 md:px-0'>
      <div className='max-w-6xl mx-auto space-y-8'>
        <div>
          <h1 className='text-3xl md:text-4xl font-semibold text-slate-900 mb-2'>Property Dashboard</h1>
          <p className='text-sm text-slate-500'>High-level snapshot of properties, tenants, and operations.</p>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm'>
            <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center'>
              <Building2 className='h-4 w-4' />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Properties</span>
              <span className='text-2xl font-semibold text-slate-900'>{propertiesCount}</span>
              <span className='text-xs text-slate-500'>Active buildings and communities</span>
            </div>
          </div>

          <div className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm'>
            <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center'>
              <FileText className='h-4 w-4' />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Applications</span>
              <span className='text-2xl font-semibold text-slate-900'>{applicationsCount}</span>
              <span className='text-xs text-slate-500'>Submitted rental applications</span>
            </div>
          </div>

          <div className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm'>
            <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center'>
              <Users className='h-4 w-4' />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Tenants</span>
              <span className='text-2xl font-semibold text-slate-900'>{tenantsCount}</span>
              <span className='text-xs text-slate-500'>Users with tenant access</span>
            </div>
          </div>

          <div className='rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-sm'>
            <div className='h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center'>
              <Wrench className='h-4 w-4' />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>Maintenance</span>
              <span className='text-2xl font-semibold text-slate-900'>{ticketsCount}</span>
              <span className='text-xs text-slate-500'>Total work tickets logged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
