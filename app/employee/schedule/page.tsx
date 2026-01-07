import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { EmployeeSchedulePage } from '@/components/employee/employee-schedule-page';
import { startOfWeek, endOfWeek, addWeeks } from 'date-fns';

export default async function SchedulePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Find team member
  const teamMember = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, status: 'active' },
  });

  if (!teamMember) {
    redirect('/');
  }

  // Get shifts for current and next week
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const twoWeeksEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 0 });

  const shifts = await prisma.shift.findMany({
    where: {
      teamMemberId: teamMember.id,
      date: { gte: weekStart, lte: twoWeeksEnd },
    },
    orderBy: { date: 'asc' },
    include: {
      property: { select: { name: true } },
    },
  });

  // Get availability
  const availability = await prisma.teamMemberAvailability.findMany({
    where: { teamMemberId: teamMember.id },
    orderBy: { dayOfWeek: 'asc' },
  });

  return (
    <EmployeeSchedulePage
      shifts={shifts.map(s => ({
        id: s.id,
        date: s.date.toISOString(),
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        notes: s.notes,
        propertyName: s.property?.name,
      }))}
      availability={availability.map(a => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isAvailable: a.isAvailable,
      }))}
    />
  );
}
