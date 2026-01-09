import { requireAdmin } from '@/lib/auth-guard';
import { getLandlordTenants } from '@/lib/actions/tenant.actions';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Users } from 'lucide-react';

export default async function TenantsPage() {
  await requireAdmin();
  const { tenants } = await getLandlordTenants();

  return (
    <main className="w-full space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50 mb-1">
            Tenants
          </h1>
          <p className="text-xs text-slate-300/80">
            Manage your tenants and their lease information.
          </p>
        </div>
        <Link href="/admin/tenants/add">
          <Button className="bg-violet-600 hover:bg-violet-500">
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-white/10 bg-slate-900/60">
          <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Tenants Yet</h3>
          <p className="text-slate-400 mb-4 text-sm">
            Add your first tenant to get started.
          </p>
          <Link href="/admin/tenants/add">
            <Button className="bg-violet-600 hover:bg-violet-500">
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {tenants.map((tenant) => (
              <Link
                key={`${tenant.id}-${tenant.leaseId}`}
                href={`/admin/leases/${tenant.leaseId}`}
                className="block rounded-lg border border-white/10 bg-slate-900/60 p-3 transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {tenant.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {tenant.email}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      'text-[9px] capitalize shrink-0',
                      tenant.leaseStatus === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-500/20 text-slate-300'
                    )}
                  >
                    {tenant.leaseStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="rounded bg-slate-900/40 p-1.5 border border-white/5">
                    <span className="text-slate-400 block">Property</span>
                    <span className="text-slate-100 truncate block">
                      {tenant.propertyName}
                    </span>
                  </div>
                  <div className="rounded bg-slate-900/40 p-1.5 border border-white/5">
                    <span className="text-slate-400 block">Unit</span>
                    <span className="text-slate-100">{tenant.unitName}</span>
                  </div>
                  <div className="rounded bg-slate-900/40 p-1.5 border border-white/5">
                    <span className="text-slate-400 block">Rent</span>
                    <span className="text-slate-100">
                      ${tenant.rentAmount.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="rounded bg-slate-900/40 p-1.5 border border-white/5">
                    <span className="text-slate-400 block">Since</span>
                    <span className="text-slate-100">
                      {new Date(tenant.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-lg border border-white/10 bg-slate-900/60 shadow-sm overflow-hidden">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900/80 border-b border-white/10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-200/90">
                    Tenant
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-200/90">
                    Property / Unit
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-200/90">
                    Rent
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-200/90">
                    Lease Start
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-200/90">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-200/90">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr
                    key={`${tenant.id}-${tenant.leaseId}`}
                    className="border-t border-white/10"
                  >
                    <td className="px-3 py-2 text-slate-200">
                      {tenant.name}
                      <span className="block text-[10px] text-slate-400">
                        {tenant.email}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      {tenant.propertyName} • {tenant.unitName}
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      ${tenant.rentAmount.toLocaleString()}/mo
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {new Date(tenant.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        className={cn(
                          'text-[9px] capitalize',
                          tenant.leaseStatus === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-500/20 text-slate-300'
                        )}
                      >
                        {tenant.leaseStatus}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/leases/${tenant.leaseId}`}
                        className="inline-flex items-center rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-violet-500"
                      >
                        View Lease
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
