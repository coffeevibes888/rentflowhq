import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { CustomerMessageCenter } from '@/components/customer/customer-message-center';

export const metadata: Metadata = {
  title: 'Messages',
};

export default async function CustomerMessagesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Get user's customer records
  const customerRecords = await prisma.contractorCustomer.findMany({
    where: { userId: session.user.id },
    include: {
      contractor: {
        select: {
          id: true,
          businessName: true,
          displayName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (customerRecords.length === 0) {
    redirect('/customer/dashboard');
  }

  const customerIds = customerRecords.map((c) => c.id);

  // Fetch messages/communications
  const communications = await prisma.contractorCommunication.findMany({
    where: { customerId: { in: customerIds } },
    include: {
      contractor: {
        select: {
          id: true,
          businessName: true,
          displayName: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by contractor
  const messagesByContractor = customerRecords.map((record) => ({
    contractor: record.contractor,
    messages: communications.filter((c) => c.contractorId === record.contractorId),
    unreadCount: communications.filter(
      (c) => c.contractorId === record.contractorId && c.status === 'unread'
    ).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-600">Messages</h1>
        <p className="text-sm text-gray-600 mt-1">
          Communicate with your contractors
        </p>
      </div>

      {/* Message Center */}
      <CustomerMessageCenter
        messagesByContractor={messagesByContractor}
        userId={session.user.id}
      />
    </div>
  );
}
