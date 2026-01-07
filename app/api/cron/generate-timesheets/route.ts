import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

// Timesheet generation cron job
// Runs: Weekly on Monday at 1 AM UTC
// Generates timesheets for the previous week for all enterprise landlords

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results = {
    landlords: 0,
    timesheetsCreated: 0,
    errors: [] as string[],
  };

  try {
    // Get previous week's date range
    const now = new Date();
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });

    // Find all enterprise landlords with active team members
    const enterpriseLandlords = await prisma.landlord.findMany({
      where: {
        subscriptionTier: { in: ['enterprise', 'Enterprise'] },
        teamMembers: {
          some: { status: 'active' },
        },
      },
      include: {
        teamMembers: {
          where: { status: 'active' },
          include: {
            compensation: true,
          },
        },
        payrollSettings: true,
      },
    });

    results.landlords = enterpriseLandlords.length;

    for (const landlord of enterpriseLandlords) {
      for (const teamMember of landlord.teamMembers) {
        try {
          // Check if timesheet already exists for this period
          const existingTimesheet = await prisma.timesheet.findFirst({
            where: {
              teamMemberId: teamMember.id,
              periodStart: lastWeekStart,
              periodEnd: lastWeekEnd,
            },
          });

          if (existingTimesheet) {
            continue; // Skip if already exists
          }

          // Get time entries for this period
          const timeEntries = await prisma.timeEntry.findMany({
            where: {
              teamMemberId: teamMember.id,
              clockIn: { gte: lastWeekStart },
              clockOut: { lte: lastWeekEnd, not: null },
              timesheetId: null, // Not already assigned to a timesheet
            },
          });

          if (timeEntries.length === 0) {
            continue; // No time entries, skip
          }

          // Calculate hours
          const totalMinutes = timeEntries.reduce((sum, e) => sum + (e.totalMinutes || 0), 0);
          const totalHours = totalMinutes / 60;

          // Get overtime threshold from settings or default to 40
          const overtimeThreshold = landlord.payrollSettings?.overtimeThreshold 
            ? Number(landlord.payrollSettings.overtimeThreshold) 
            : 40;

          const regularHours = Math.min(totalHours, overtimeThreshold);
          const overtimeHours = Math.max(0, totalHours - overtimeThreshold);

          // Create timesheet
          const timesheet = await prisma.timesheet.create({
            data: {
              landlordId: landlord.id,
              teamMemberId: teamMember.id,
              periodStart: lastWeekStart,
              periodEnd: lastWeekEnd,
              totalHours,
              regularHours,
              overtimeHours,
              status: 'draft',
            },
          });

          // Link time entries to timesheet
          await prisma.timeEntry.updateMany({
            where: {
              id: { in: timeEntries.map(e => e.id) },
            },
            data: {
              timesheetId: timesheet.id,
            },
          });

          results.timesheetsCreated++;
        } catch (error) {
          const errorMsg = `Failed to create timesheet for team member ${teamMember.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      timestamp: new Date().toISOString(),
      period: {
        start: format(lastWeekStart, 'yyyy-MM-dd'),
        end: format(lastWeekEnd, 'yyyy-MM-dd'),
      },
      results,
    });
  } catch (error) {
    console.error('Timesheet generation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Also support POST for manual triggering
export async function POST(req: NextRequest) {
  return GET(req);
}
