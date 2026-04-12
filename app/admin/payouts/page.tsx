import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { getConnectAccountStatus } from '@/lib/actions/stripe-connect.actions';
import { prisma } from '@/db/prisma';
import PayoutsClient from './payouts-client';
import { formatEstimatedArrival } from '@/lib/config/stripe-constants';

const AdminPayoutsPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();

  if (!landlordResult.success) {
    return (
      <main className='px-4 py-10'>
        <div className='max-w-3xl mx-auto text-sm text-red-600'>
          {landlordResult.message || 'Unable to load landlord context for payouts.'}
        </div>
      </main>
    );
  }

  const landlord = landlordResult.landlord;

  // Get Connect account status
  const connectStatusResult = await getConnectAccountStatus();
  const connectStatus = connectStatusResult.status || null;

  // Get recent rent payments for this landlord
  const recentPayments = await prisma.rentPayment.findMany({
    where: {
      status: { in: ['paid', 'processing', 'pending'] },
      lease: {
        unit: {
          property: { landlordId: landlord.id },
        },
      },
    },
    include: {
      tenant: {
        select: { name: true },
      },
      lease: {
        include: {
          unit: {
            include: {
              property: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { paidAt: 'desc' },
    take: 20,
  });

  // Calculate totals
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const allPaidPayments = await prisma.rentPayment.findMany({
    where: {
      status: 'paid',
      lease: {
        unit: {
          property: { landlordId: landlord.id },
        },
      },
    },
    select: { amount: true, paidAt: true },
  });

  const totalReceived = allPaidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const thisMonthAmount = allPaidPayments
    .filter((p) => p.paidAt && p.paidAt >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Pending/processing payments (in transit to bank)
  const pendingPayments = await prisma.rentPayment.findMany({
    where: {
      status: { in: ['processing', 'pending'] },
      lease: {
        unit: {
          property: { landlordId: landlord.id },
        },
      },
    },
    select: { amount: true },
  });

  const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <PayoutsClient
      connectStatus={connectStatus}
      recentPayments={recentPayments.map((p) => {
        // Determine payment method from metadata or default
        const metadata = p.metadata as Record<string, unknown> | null;
        const paymentMethod = (metadata?.paymentMethod as string) || 'card';
        
        return {
          id: p.id,
          amount: Number(p.amount),
          status: p.status,
          paidAt: p.paidAt?.toISOString() || null,
          paymentMethod,
          tenantName: p.tenant?.name || 'Unknown Tenant',
          propertyName: p.lease?.unit?.property?.name || 'Unknown Property',
          unitNumber: p.lease?.unit?.name || '',
          estimatedArrival: p.status === 'processing' ? formatEstimatedArrival(paymentMethod) : null,
          metadata: p.metadata as Record<string, unknown> | null,
          dueDate: p.dueDate?.toISOString() || null,
        };
      })}
      totalReceived={totalReceived}
      pendingAmount={pendingAmount}
      thisMonthAmount={thisMonthAmount}
    />
  );
};

export default AdminPayoutsPage;
