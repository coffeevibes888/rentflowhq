import { requireAdmin } from '@/lib/auth-guard';
import { getLandlordInvoices } from '@/lib/actions/invoice.actions';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { prisma } from '@/db/prisma';
import InvoiceList from './invoice-list';
import CreateInvoiceForm from './create-invoice-form';

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ unitId?: string; propertyId?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const preselectedUnitId = params.unitId;
  const preselectedPropertyId = params.propertyId;

  const landlordResult = await getOrCreateCurrentLandlord();
  if (!landlordResult.success) {
    return (
      <main className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-slate-500">Unable to load invoices.</p>
      </main>
    );
  }

  const [invoicesResult, properties] = await Promise.all([
    getLandlordInvoices(),
    prisma.property.findMany({
      where: { landlordId: landlordResult.landlord.id },
      include: {
        units: {
          select: {
            id: true,
            name: true,
            leases: {
              where: { status: 'active' },
              select: {
                id: true,
                tenant: {
                  select: { id: true, name: true, email: true },
                },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Find preselected unit info if unitId is provided
  let preselectedInfo: { propertyId: string; tenantId: string; leaseId: string } | null = null;
  if (preselectedUnitId) {
    for (const property of properties) {
      const unit = property.units.find((u) => u.id === preselectedUnitId);
      if (unit && unit.leases[0]) {
        preselectedInfo = {
          propertyId: property.id,
          tenantId: unit.leases[0].tenant?.id || '',
          leaseId: unit.leases[0].id,
        };
        break;
      }
    }
  }

  return (
    <main className="w-full px-4 py-8 md:px-0">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white mb-1">
              Tenant Invoices
            </h1>
            <p className="text-sm text-slate-300">
              Create and manage custom invoices for your tenants
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <section className="space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-white">Create Invoice</h2>
            <CreateInvoiceForm 
              properties={properties} 
              preselectedPropertyId={preselectedInfo?.propertyId || preselectedPropertyId}
              preselectedTenantId={preselectedInfo?.tenantId}
              preselectedLeaseId={preselectedInfo?.leaseId}
            />
          </section>

          <section className="space-y-4 rounded-xl border border-white/10 bg-slate-900/60 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
            <InvoiceList invoices={invoicesResult.invoices || []} />
          </section>
        </div>
      </div>
    </main>
  );
}
