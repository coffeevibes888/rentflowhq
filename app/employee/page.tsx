import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { EmployeeDashboard } from '@/components/employee/employee-dashboard';

export const metadata = {
  title: 'Employee Dashboard',
};

export default async function EmployeePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/employee');
  }

  // Check if user is a team member (employee)
  const teamMembership = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      status: 'active',
    },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          subdomain: true,
        },
      },
    },
  });

  if (!teamMembership) {
    // Not an employee - redirect to appropriate dashboard
    redirect('/admin');
  }

  // Get employee's upcoming shifts
  const upcomingShifts = await prisma.shift.findMany({
    where: {
      teamMemberId: teamMembership.id,
      date: { gte: new Date() },
    },
    orderBy: { date: 'asc' },
    take: 5,
  }).catch(() => []);

  // Get today's time entries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTimeEntries = await prisma.timeEntry.findMany({
    where: {
      teamMemberId: teamMembership.id,
      clockIn: { gte: today, lt: tomorrow },
    },
    orderBy: { clockIn: 'desc' },
  }).catch(() => []);

  // Get pending time off requests
  const pendingTimeOff = await prisma.timeOffRequest.findMany({
    where: {
      teamMemberId: teamMembership.id,
      status: 'pending',
    },
    orderBy: { startDate: 'asc' },
  }).catch(() => []);

  // Helper to extract type from reason field
  const parseTypeFromReason = (reason: string | null) => {
    if (!reason) return 'vacation';
    const match = reason.match(/^\[(\w+)\]/);
    return match ? match[1].toLowerCase() : 'vacation';
  };

  // Check if currently clocked in
  const activeTimeEntry = todayTimeEntries.find(entry => !entry.clockOut);

  return (
    <EmployeeDashboard
      employee={{
        id: teamMembership.id,
        userId: session.user.id,
        name: session.user.name || 'Employee',
        email: session.user.email || '',
        image: session.user.image || undefined,
        role: teamMembership.role,
      }}
      company={{
        id: teamMembership.landlord.id,
        name: teamMembership.landlord.name,
      }}
      upcomingShifts={upcomingShifts.map(s => ({
        id: s.id,
        date: s.date.toISOString(),
        startTime: s.startTime, // String format "09:00"
        endTime: s.endTime,     // String format "17:00"
        notes: s.notes || undefined,
      }))}
      todayTimeEntries={todayTimeEntries.map(t => ({
        id: t.id,
        clockIn: t.clockIn.toISOString(),
        clockOut: t.clockOut?.toISOString() || null,
      }))}
      pendingTimeOff={pendingTimeOff.map(r => ({
        id: r.id,
        type: parseTypeFromReason(r.reason),
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        status: r.status,
      }))}
      isClockedIn={!!activeTimeEntry}
      activeTimeEntryId={activeTimeEntry?.id}
    />
  );
}
