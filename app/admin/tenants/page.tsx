import { requireAdmin } from '@/lib/auth-guard';
import { getLandlordTenants } from '@/lib/actions/tenant.actions';
import Link from 'next/link';
import { Plus, Users, ChevronRight, MapPin } from 'lucide-react';

export default async function TenantsPage() {
  await requireAdmin();
  const { tenants } = await getLandlordTenants();

  const activeTenants = tenants.filter((t) => t.leaseStatus === 'active');
  const otherTenants = tenants.filter((t) => t.leaseStatus !== 'active');

  return (
    <main className='w-full space-y-5'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-black'>Tenants</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>
            Manage your tenants and their lease information
          </p>
        </div>
        <Link
          href='/admin/tenants/add'
          className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md hover:shadow-lg transition-all'
        >
          <Plus className='h-3.5 w-3.5' />
          Add Tenant
        </Link>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <StatCard label='Total Tenants' value={String(tenants.length)} />
        <StatCard label='Active Leases' value={String(activeTenants.length)} />
        <StatCard label='Avg Rent' value={tenants.length > 0 ? `$${Math.round(tenants.reduce((s, t) => s + t.rentAmount, 0) / tenants.length).toLocaleString()}` : '$0'} />
        <StatCard label='Monthly Revenue' value={`$${activeTenants.reduce((s, t) => s + t.rentAmount, 0).toLocaleString()}`} />
      </div>

      {tenants.length === 0 ? (
        <div className='rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm'>
          <Users className='mx-auto h-12 w-12 text-gray-300 mb-4' />
          <h3 className='text-lg font-semibold text-gray-800 mb-2'>No Tenants Yet</h3>
          <p className='text-sm text-gray-500 mb-4 max-w-md mx-auto'>
            Add your first tenant to start managing leases and collecting rent.
          </p>
          <Link
            href='/admin/tenants/add'
            className='inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md hover:shadow-lg transition-all'
          >
            <Plus className='h-4 w-4' />
            Add Tenant
          </Link>
        </div>
      ) : (
        <>
          {/* Search bar area */}
          <div className='flex items-center gap-3'>
            <div className='relative flex-1'>
              <svg className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
              <input
                type='text'
                placeholder='Search tenants...'
                className='w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all'
                disabled
              />
            </div>
          </div>

          {/* Table */}
          <div className='rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='bg-gray-50/80'>
                    <th className='text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5'>Tenant</th>
                    <th className='text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5 hidden sm:table-cell'>Property / Unit</th>
                    <th className='text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5 hidden md:table-cell'>Rent</th>
                    <th className='text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5 hidden lg:table-cell'>Lease Start</th>
                    <th className='text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5'>Status</th>
                    <th className='text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5'></th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50'>
                  {tenants.map((tenant) => (
                    <tr key={`${tenant.id}-${tenant.leaseId}`} className='hover:bg-gray-50/50 transition-colors'>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-2.5'>
                          <div className='h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0'>
                            {(tenant.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className='text-xs font-semibold text-gray-800'>{tenant.name}</p>
                            <p className='text-[10px] text-gray-500'>{tenant.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-3 hidden sm:table-cell'>
                        <div className='flex items-center gap-1.5'>
                          <MapPin className='h-3 w-3 text-gray-400' />
                          <span className='text-xs text-gray-700'>{tenant.propertyName} · {tenant.unitName}</span>
                        </div>
                      </td>
                      <td className='px-4 py-3 hidden md:table-cell'>
                        <span className='text-xs font-bold text-gray-800'>${tenant.rentAmount.toLocaleString()}/mo</span>
                      </td>
                      <td className='px-4 py-3 hidden lg:table-cell'>
                        <span className='text-xs text-gray-500'>{new Date(tenant.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </td>
                      <td className='px-4 py-3'>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          tenant.leaseStatus === 'active' ? 'bg-green-50 text-green-600' :
                          tenant.leaseStatus === 'pending' ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {tenant.leaseStatus}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-right'>
                        <Link
                          href={`/admin/leases/${tenant.leaseId}`}
                          className='text-[11px] text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-0.5 justify-end'
                        >
                          View <ChevronRight className='h-3 w-3' />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl border border-gray-200 bg-white p-3 shadow-sm'>
      <p className='text-[10px] text-gray-500 font-medium'>{label}</p>
      <p className='text-lg font-bold text-gray-900 mt-0.5'>{value}</p>
    </div>
  );
}
