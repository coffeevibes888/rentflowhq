import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { getConnectAccountStatus } from '@/lib/actions/stripe-connect.actions';
import { prisma } from '@/db/prisma';
import PayoutsClient from './payouts-client';

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
  const connectStatus = await getConnectAccountStatus();

  // Get wallet balance
  let walletBalance = 0;
  let pendingBalance = 0;

  const wallet = await prisma.landlordWallet.findUnique({
    where: { landlordId: landlord.id },
  });

  if (wallet) {
    walletBalance = Number(wallet.availableBalance || 0);
    pendingBalance = Number(wallet.pendingBalance || 0);
  }

  // Get uncredited rent payments
  const unpaidRent = await prisma.rentPayment.aggregate({
    _sum: { amount: true },
    where: {
      status: 'paid',
      payoutId: null,
      lease: {
        unit: {
          property: { landlordId: landlord.id },
        },
      },
    },
  });

  // Get recent payouts with metadata for destination info
  const payouts = await prisma.payout.findMany({
    where: { landlordId: landlord.id },
    orderBy: { initiatedAt: 'desc' },
    take: 10,
  });

  // Get properties with bank accounts for the cashout dropdown
  const properties = await prisma.property.findMany({
    where: { landlordId: landlord.id },
    include: { bankAccount: true },
    orderBy: { name: 'asc' },
  });

  const pendingRent = Number(unpaidRent._sum.amount || 0);
  const availableAmount = walletBalance + pendingRent;

  return (
    <PayoutsClient
      availableBalance={availableAmount}
      pendingBalance={pendingBalance}
      connectStatus={connectStatus.status}
      payouts={payouts.map((p) => {
        const metadata = p.metadata as Record<string, unknown> | null;
        return {
          id: p.id,
          amount: Number(p.amount),
          status: p.status,
          initiatedAt: p.initiatedAt.toISOString(),
          paidAt: p.paidAt?.toISOString() || null,
          stripeTransferId: p.stripeTransferId,
          destinationPropertyId: (metadata?.destinationPropertyId as string) || null,
          destinationPropertyName: (metadata?.destinationPropertyName as string) || null,
          destinationLast4: (metadata?.destinationBankLast4 as string) || null,
        };
      })}
      properties={properties.map((prop) => ({
        id: prop.id,
        name: prop.name,
        hasBankAccount: !!prop.bankAccount,
        bankAccount: prop.bankAccount
          ? {
              last4: prop.bankAccount.last4,
              bankName: prop.bankAccount.bankName,
              isVerified: prop.bankAccount.isVerified,
            }
          : null,
      }))}
    />
  );
};

export default AdminPayoutsPage;
