/**
 * GET /api/mobile/employee/schedule
 *
 * Upcoming shifts/jobs assigned to the employee.
 * For ContractorEmployee: uses ContractorJobAssignment.
 * For TeamMember: uses Shift.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyMobileToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const db = prisma as any;

    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const contractorEmp = await db.contractorEmployee.findFirst({
      where: { userId: payload.userId },
    });
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: payload.userId },
    });

    let upcoming: any[] = [];

    if (contractorEmp) {
      const assignments = await db.contractorJobAssignment.findMany({
        where: { employeeId: contractorEmp.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          job: {
            select: {
              id: true,
              jobNumber: true,
              title: true,
              status: true,
              scheduledDate: true,
              scheduledTime: true,
              estimatedHours: true,
              customer: { select: { name: true } },
              property: { select: { name: true, address: true, city: true, state: true } },
            },
          },
        },
      });
      upcoming = assignments
        .filter((a: any) => a.job?.scheduledDate && new Date(a.job.scheduledDate) >= since)
        .map((a: any) => ({
          id: a.id,
          jobId: a.job?.id,
          jobNumber: a.job?.jobNumber,
          title: a.job?.title ?? 'Job',
          status: a.job?.status ?? 'scheduled',
          scheduledDate: a.job?.scheduledDate?.toISOString() ?? null,
          scheduledTime: a.job?.scheduledTime ?? null,
          estimatedHours: a.job?.estimatedHours ? Number(a.job.estimatedHours) : null,
          customerName: a.job?.customer?.name ?? null,
          propertyName: a.job?.property?.name ?? null,
          address: a.job?.property?.address ?? null,
          city: a.job?.property?.city ?? null,
          state: a.job?.property?.state ?? null,
        }));
    } else if (teamMember) {
      const shifts = await prisma.shift.findMany({
        where: { teamMemberId: teamMember.id, startTime: { gte: since } },
        orderBy: { startTime: 'asc' },
        take: 50,
        include: {
          property: { select: { name: true, address: true, city: true, state: true } },
        },
      });
      upcoming = shifts.map((s: any) => ({
        id: s.id,
        jobId: null,
        jobNumber: null,
        title: s.title ?? 'Shift',
        status: s.status,
        scheduledDate: s.startTime?.toISOString() ?? null,
        scheduledTime: s.startTime
          ? new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null,
        estimatedHours: s.startTime && s.endTime
          ? Math.round(((+new Date(s.endTime) - +new Date(s.startTime)) / 3_600_000) * 10) / 10
          : null,
        customerName: null,
        propertyName: s.property?.name ?? null,
        address: s.property?.address ?? null,
        city: s.property?.city ?? null,
        state: s.property?.state ?? null,
      }));
    }

    return NextResponse.json({ upcoming });
  } catch (error) {
    console.error('[mobile/employee/schedule]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
