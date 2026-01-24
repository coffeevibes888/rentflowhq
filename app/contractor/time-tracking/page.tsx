import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Calendar,
  Users,
  DollarSign,
  Download,
  CheckCircle,
  XCircle,
  PlayCircle,
} from 'lucide-react';
import Link from 'next/link';

export default async function TimeTrackingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, businessName: true },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  // Date ranges
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch time entries
  const [weekEntries, monthEntries, recentEntries, activeEmployees] =
    await Promise.all([
      // Week entries
      prisma.contractorTimeEntry.findMany({
        where: {
          employee: {
            contractorId: contractorProfile.id,
          },
          clockIn: { gte: startOfWeek },
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              payRate: true,
            },
          },
        },
      }),

      // Month entries
      prisma.contractorTimeEntry.findMany({
        where: {
          employee: {
            contractorId: contractorProfile.id,
          },
          clockIn: { gte: startOfMonth },
        },
        include: {
          employee: {
            select: {
              payRate: true,
            },
          },
        },
      }),

      // Recent entries (last 20)
      prisma.contractorTimeEntry.findMany({
        where: {
          employee: {
            contractorId: contractorProfile.id,
          },
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              photo: true,
              payRate: true,
            },
          },
        },
        orderBy: { clockIn: 'desc' },
        take: 20,
      }),

      // Active employees (currently clocked in)
      prisma.contractorTimeEntry.findMany({
        where: {
          employee: {
            contractorId: contractorProfile.id,
          },
          clockOut: null,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photo: true,
            },
          },
        },
      }),
    ]);

  // Calculate stats
  const calculateHours = (entries: typeof weekEntries) => {
    return entries.reduce((sum, entry) => {
      if (entry.clockOut) {
        const hours =
          (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) /
          (1000 * 60 * 60);
        const breakHours = (entry.breakMinutes || 0) / 60;
        return sum + hours - breakHours;
      }
      return sum;
    }, 0);
  };

  const calculateCost = (entries: typeof weekEntries) => {
    return entries.reduce((sum, entry) => {
      if (entry.clockOut) {
        const hours =
          (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) /
          (1000 * 60 * 60);
        const breakHours = (entry.breakMinutes || 0) / 60;
        const netHours = hours - breakHours;
        const cost = netHours * Number(entry.employee.payRate);
        return sum + cost;
      }
      return sum;
    }, 0);
  };

  const weekHours = calculateHours(weekEntries);
  const monthHours = calculateHours(monthEntries);
  const weekCost = calculateCost(weekEntries);
  const monthCost = calculateCost(monthEntries);

  const pendingApproval = recentEntries.filter(
    (e) => e.clockOut && !e.approved
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Time Tracking</h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitor employee hours and manage timesheets
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-2 border-gray-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/contractor/team">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-2 border-black shadow-lg">
              <Users className="h-4 w-4 mr-2" />
              Manage Team
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {weekHours.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Hours (Week)</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <Calendar className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {monthHours.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Hours (Month)</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <PlayCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {activeEmployees.length}
              </p>
              <p className="text-sm text-gray-600">Clocked In</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ${weekCost.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Cost (Week)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Currently Clocked In */}
      {activeEmployees.length > 0 && (
        <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Currently Clocked In
            </h3>
          </div>
          <div className="p-5">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEmployees.map((entry) => {
                const hoursWorked =
                  (Date.now() - new Date(entry.clockIn).getTime()) /
                  (1000 * 60 * 60);

                return (
                  <div
                    key={entry.id}
                    className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center flex-shrink-0 border-2 border-blue-200">
                        <span className="text-sm font-bold text-blue-600">
                          {entry.employee.firstName[0]}
                          {entry.employee.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">
                          {entry.employee.firstName} {entry.employee.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Clocked in at{' '}
                          {new Date(entry.clockIn).toLocaleTimeString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <PlayCircle className="h-4 w-4 text-emerald-600 animate-pulse" />
                          <span className="text-sm font-medium text-emerald-700">
                            {hoursWorked.toFixed(1)} hours
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent Time Entries */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Time Entries</h3>
            {pendingApproval > 0 && (
              <p className="text-sm text-amber-600 mt-1">
                {pendingApproval} entries pending approval
              </p>
            )}
          </div>
        </div>
        <div className="p-5">
          {recentEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">No time entries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => {
                const hours = entry.clockOut
                  ? (
                      (new Date(entry.clockOut).getTime() -
                        new Date(entry.clockIn).getTime()) /
                        (1000 * 60 * 60) -
                      (entry.breakMinutes || 0) / 60
                    ).toFixed(2)
                  : null;

                const cost = hours
                  ? parseFloat(hours) * Number(entry.employee.payRate)
                  : 0;

                return (
                  <div
                    key={entry.id}
                    className="rounded-lg border-2 border-gray-200 bg-white p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center flex-shrink-0 border-2 border-blue-200">
                          <span className="text-sm font-bold text-blue-600">
                            {entry.employee.firstName[0]}
                            {entry.employee.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {entry.employee.firstName} {entry.employee.lastName}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>
                              {new Date(entry.clockIn).toLocaleDateString()}
                            </span>
                            <span>
                              {new Date(entry.clockIn).toLocaleTimeString()} -{' '}
                              {entry.clockOut
                                ? new Date(entry.clockOut).toLocaleTimeString()
                                : 'In Progress'}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        {hours ? (
                          <>
                            <p className="text-lg font-bold text-gray-900">
                              {hours} hrs
                            </p>
                            <p className="text-sm text-gray-600">
                              ${cost.toFixed(2)}
                            </p>
                            {entry.approved ? (
                              <Badge className="bg-emerald-100 text-emerald-700 mt-2">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 mt-2">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700">
                            <PlayCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Summary
        </h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Hours</p>
            <p className="text-2xl font-bold text-gray-900">
              {monthHours.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900">
              ${monthCost.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Avg Hours/Day</p>
            <p className="text-2xl font-bold text-gray-900">
              {(monthHours / new Date().getDate()).toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Active Employees</p>
            <p className="text-2xl font-bold text-gray-900">
              {activeEmployees.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
