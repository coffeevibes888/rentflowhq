import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { EnhancedMessageCenter } from '@/components/customer/enhanced-message-center';

export const metadata: Metadata = {
  title: 'Messages',
};

export default async function CustomerMessagesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Fetch all threads where user is a participant and not deleted
  const threads = await prisma.thread.findMany({
    where: {
      participants: {
        some: {
          userId: session.user.id,
          isDeleted: false,
        },
      },
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-600">Messages</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your conversations with folders and organization
        </p>
      </div>

      {/* Enhanced Message Center */}
      <EnhancedMessageCenter threads={threads} userId={session.user.id} />
    </div>
  );
}
