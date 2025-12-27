import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { TimeOffPage } from '@/components/employee/time-off-page';

export const metadata = {
  title: 'Time Off - Employee Portal',
};

export default async function TimeOffRequestPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/employee/time-off');
  }

  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      status: 'active',
    },
  });

  if (!teamMember) {
    redirect('/admin');
  }

  // Get time off requests
  const requests = await prisma.timeOffRequest.findMany({
    where: {
      teamMemberId: teamMember.id,
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  // Extract type from reason field (stored as "[TYPE] reason text")
  const parseTypeFromReason = (reason: string | null) => {
    if (!reason) return { type: 'vacation', displayReason: undefined };
    const match = reason.match(/^\[(\w+)\]\s*(.*)/);
    if (match) {
      return { type: match[1].toLowerCase(), displayReason: match[2] || undefined };
    }
    return { type: 'vacation', displayReason: reason };
  };

  return (
    <TimeOffPage
      requests={requests.map(r => {
        const { type, displayReason } = parseTypeFromReason(r.reason);
        return {
          id: r.id,
          type,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate.toISOString(),
          reason: displayReason,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        };
      })}
    />
  );
}
