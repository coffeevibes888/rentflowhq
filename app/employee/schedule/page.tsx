import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { EmployeeSchedulePage } from '@/components/employee/employee-schedule-page';

export const metadata = {
  title: 'My Schedule - Employee Portal',
};

export default async function SchedulePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/employee/schedule');
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

  // Get shifts for the next 30 days
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);

  const shifts = await prisma.shift.findMany({
    where: {
      teamMemberId: teamMember.id,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  }).catch(() => []);

  return (
    <EmployeeSchedulePage
      shifts={shifts.map(s => ({
        id: s.id,
        date: s.date.toISOString(),
        startTime: s.startTime, // String format "09:00"
        endTime: s.endTime,     // String format "17:00"
        notes: s.notes || undefined,
        status: s.status,
      }))}
    />
  );
}
