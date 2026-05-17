/**
 * GET /api/mobile/contractor/crew-locations
 *
 * Returns active crew members (clocked-in employees) with their last known
 * GPS coordinates, job site, and clock-in time. Used by the mobile app's
 * Live Crew Map screen.
 *
 * Auth: Bearer mobile token, contractor role only.
 *
 * Response:
 *   {
 *     crew: Array<{
 *       entryId, employeeId, employeeName,
 *       lat, lng,            // null if location not captured
 *       clockIn,             // ISO string
 *       elapsedMinutes,
 *       jobId, jobTitle,     // null if no job linked
 *       address              // optional, from clockInLocation JSON
 *     }>,
 *     count
 *   }
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
    if (payload.role !== 'contractor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profile = await prisma.contractorProfile.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const db = prisma as any;

    // Active = clocked-in (clockOut is null)
    const activeEntries = await db.contractorTimeEntry.findMany({
      where: {
        contractorId: profile.id,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
      select: {
        id: true,
        clockIn: true,
        clockInLocation: true,
        employee: { select: { id: true, firstName: true, lastName: true } },
        job: { select: { id: true, title: true, jobNumber: true } },
      },
    });

    const now = Date.now();
    const crew = activeEntries.map((e: any) => {
      const loc = e.clockInLocation as { lat?: number; lng?: number; address?: string } | null;
      const elapsedMinutes = Math.floor((now - new Date(e.clockIn).getTime()) / 60000);
      return {
        entryId: e.id,
        employeeId: e.employee?.id ?? null,
        employeeName: e.employee
          ? `${e.employee.firstName ?? ''} ${e.employee.lastName ?? ''}`.trim() || 'Unnamed'
          : 'Unnamed',
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
        address: loc?.address ?? null,
        clockIn: new Date(e.clockIn).toISOString(),
        elapsedMinutes,
        jobId: e.job?.id ?? null,
        jobTitle: e.job?.title ?? null,
        jobNumber: e.job?.jobNumber ?? null,
      };
    });

    return NextResponse.json({ crew, count: crew.length });
  } catch (error) {
    console.error('[mobile/contractor/crew-locations]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
