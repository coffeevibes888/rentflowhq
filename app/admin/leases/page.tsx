import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default async function AdminLeasesPage() {
  await requireAdmin();
  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success || !landlordResult.landlord) {
    throw new Error(landlordResult.message || 'Unable to determine landlord');
  }

  const landlordId = landlordResult.landlord.id;

  const leases = await prisma.lease.findMany({
    where: {
      unit: {
        property: {
          landlordId,
        },
      },
    },
    orderBy: { startDate: 'desc' },
    include: {
      tenant: {
        select: { id: true, name: true, email: true },
      },
      unit: {
        select: {
          name: true,
          type: true,
          property: { select: { name: true } },
        },
      },
      signatureRequests: {
        select: { id: true, status: true, role: true },
      },
    },
  });

  const leasesAwaitingSignature = leases.filter((l) => {
    const landlordPending = l.signatureRequests?.some(
      (sr) => sr.role === 'landlord' && sr.status !== 'signed'
    );
    return landlordPending && l.tenantSignedAt && !l.landlordSignedAt;
  });

  return (
    <main className='w-full space-y-4'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50 mb-1'>Leases</h1>
          <p className='text-xs text-slate-300/80'>View active and past leases and sign pending documents.</p>
          {leasesAwaitingSignature.length > 0 && (
            <Badge className='mt-1.5 bg-orange-500/20 text-orange-300 border-orange-400/30 text-[10px]'>
              {leasesAwaitingSignature.length} awaiting your signature
            </Badge>
          )}
        </div>
        <Link href='/admin/tenants/add'>
          <Button className='bg-violet-600 hover:bg-violet-500'>
            <Plus className='h-4 w-4 mr-2' />
            Add Tenant
          </Button>
        </Link>
      </div>

      {leasesAwaitingSignature.length > 0 && (
        <div className='rounded-lg sm:rounded-xl border border-orange-400/30 bg-orange-500/10 p-3 sm:p-4 space-y-3'>
          <div className='flex items-start gap-2'>
            <div className='flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold'>
              {leasesAwaitingSignature.length}
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='font-semibold text-white text-sm mb-1'>
                Leases Awaiting Your Signature
              </h3>
              <p className='text-[10px] text-slate-300 mb-3'>
                Tenants have signed. Please review and sign to complete.
              </p>
              <div className='space-y-2'>
                {leasesAwaitingSignature.map((lease) => (
                  <div
                    key={lease.id}
                    className='flex items-center justify-between bg-slate-900/60 rounded-lg p-2.5 border border-orange-400/20'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-medium text-white truncate'>
                        {lease.tenant?.name || 'Tenant'} - {lease.unit.property?.name} • {lease.unit.name}
                      </p>
                      <p className='text-[10px] text-slate-400'>
                        Signed: {lease.tenantSignedAt ? new Date(lease.tenantSignedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Link
                      href={`/admin/leases/${lease.id}`}
                      className='ml-2 inline-flex items-center rounded-full bg-orange-600 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-orange-700 shrink-0'
                    >
                      Sign
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      <div className='md:hidden space-y-2'>
        {leases.length === 0 ? (
          <p className='text-center text-xs text-slate-400 py-6'>No leases found.</p>
        ) : (
          leases.map((lease) => {
            const tenantSigned = !!lease.tenantSignedAt;
            const landlordSigned = !!lease.landlordSignedAt;
            const bothSigned = tenantSigned && landlordSigned;
            const landlordPending = lease.signatureRequests?.some(
              (sr) => sr.role === 'landlord' && sr.status !== 'signed'
            );

            return (
              <Link
                key={lease.id}
                href={`/admin/leases/${lease.id}`}
                className={cn(
                  'block rounded-lg border p-3 transition-all active:scale-[0.99]',
                  landlordPending 
                    ? 'border-orange-400/30 bg-orange-500/10' 
                    : 'border-white/10 bg-slate-900/60'
                )}
              >
                <div className='flex items-start justify-between gap-2 mb-2'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium text-white truncate'>
                      {lease.tenant?.name || 'Tenant'}
                    </p>
                    <p className='text-[10px] text-slate-400 truncate'>
                      {lease.unit.property?.name} • {lease.unit.name}
                    </p>
                  </div>
                  <Badge className={cn(
                    'text-[9px] capitalize shrink-0',
                    lease.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'
                  )}>
                    {lease.status}
                  </Badge>
                </div>
                
                <div className='grid grid-cols-2 gap-1.5 text-[10px] mb-2'>
                  <div className='rounded bg-slate-900/40 p-1.5 border border-white/5'>
                    <span className='text-slate-400 block'>Start</span>
                    <span className='text-slate-100'>{new Date(lease.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className='rounded bg-slate-900/40 p-1.5 border border-white/5'>
                    <span className='text-slate-400 block'>End</span>
                    <span className='text-slate-100'>{lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Ongoing'}</span>
                  </div>
                </div>

                <div className='flex items-center gap-1.5'>
                  {bothSigned ? (
                    <Badge className='bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[9px]'>
                      Fully Signed
                    </Badge>
                  ) : tenantSigned && !landlordSigned ? (
                    <>
                      <Badge className='bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[9px]'>
                        Tenant ✓
                      </Badge>
                      <Badge className='bg-orange-500/20 text-orange-300 border-orange-400/30 text-[9px]'>
                        Sign Now
                      </Badge>
                    </>
                  ) : (
                    <Badge className='bg-slate-500/20 text-slate-300 border-slate-400/30 text-[9px]'>
                      Unsigned
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className='hidden md:block rounded-lg border border-white/10 bg-slate-900/60 shadow-sm overflow-hidden'>
        <table className='min-w-full text-xs'>
          <thead className='bg-slate-900/80 border-b border-white/10'>
            <tr>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90'>Tenant</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90'>Unit / property</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90'>Start</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90'>End</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90'>Status</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90'>Signatures</th>
              <th className='px-3 py-2 text-left font-medium text-slate-200/90'>Action</th>
            </tr>
          </thead>
          <tbody>
            {leases.length === 0 && (
              <tr>
                <td colSpan={7} className='px-3 py-6 text-center text-slate-400'>
                  No leases found.
                </td>
              </tr>
            )}
            {leases.map((lease) => {
              const tenantSigned = !!lease.tenantSignedAt;
              const landlordSigned = !!lease.landlordSignedAt;
              const bothSigned = tenantSigned && landlordSigned;
              const landlordPending = lease.signatureRequests?.some(
                (sr) => sr.role === 'landlord' && sr.status !== 'signed'
              );

              return (
                <tr
                  key={lease.id}
                  className={cn(
                    'border-t border-white/10',
                    landlordPending ? 'bg-orange-500/10' : ''
                  )}
                >
                  <td className='px-3 py-2 text-slate-200'>
                    {lease.tenant?.name || 'Tenant'}
                    {lease.tenant?.email && (
                      <span className='block text-[10px] text-slate-400'>{lease.tenant.email}</span>
                    )}
                  </td>
                  <td className='px-3 py-2 text-slate-200'>
                    {lease.unit.property?.name || 'Property'} • {lease.unit.name}
                  </td>
                  <td className='px-3 py-2 text-slate-400'>
                    {new Date(lease.startDate).toLocaleDateString()}
                  </td>
                  <td className='px-3 py-2 text-slate-400'>
                    {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Ongoing'}
                  </td>
                  <td className='px-3 py-2 capitalize text-slate-200'>{lease.status}</td>
                  <td className='px-3 py-2'>
                    <div className='flex flex-col gap-1'>
                      {bothSigned ? (
                        <Badge className='w-fit bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[9px]'>
                          Fully Signed
                        </Badge>
                      ) : tenantSigned && !landlordSigned ? (
                        <>
                          <Badge className='w-fit bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[9px]'>
                            Tenant Signed
                          </Badge>
                          <Badge className='w-fit bg-orange-500/20 text-orange-300 border-orange-400/30 text-[9px]'>
                            Awaiting Landlord
                          </Badge>
                        </>
                      ) : (
                        <Badge className='w-fit bg-slate-500/20 text-slate-300 border-slate-400/30 text-[9px]'>
                          Unsigned
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className='px-3 py-2'>
                    <Link
                      href={`/admin/leases/${lease.id}`}
                      className='inline-flex items-center rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-violet-500'
                    >
                      {tenantSigned && !landlordSigned ? 'Sign' : 'View'}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
