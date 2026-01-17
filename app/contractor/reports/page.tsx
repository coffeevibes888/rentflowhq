import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Clock,
  Target,
  Award,
  Calendar
} from 'lucide-react';
import { startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'contractor') {
    return redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!contractorProfile) {
    return redirect('/contractor/profile');
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Fetch all data
  const [
    jobs,
    thisMonthJobs,
    lastMonthJobs,
    customers,
    employees,
    timeEntries,
    expenses,
  ] = await Promise.all([
    prisma.contractorJob.findMany({
      where: { contractorId: contractorProfile.id },
      select: {
        id: true,
        status: true,
        estimatedCost: true,
        laborCost: true,
        materialCost: true,
        createdAt: true,
        estimatedStartDate: true,
        estimatedEndDate: true,
      },
    }),
    prisma.contractorJob.findMany({
      where: {
        contractorId: contractorProfile.id,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: { estimatedCost: true, status: true },
    }),
    prisma.contractorJob.findMany({
      where: {
        contractorId: contractorProfile.id,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      select: { estimatedCost: true },
    }),
    prisma.contractorCustomer.findMany({
      where: { contractorId: contractorProfile.id },
      select: { status: true, createdAt: true },
    }),
    prisma.contractorEmployee.findMany({
      where: { contractorId: contractorProfile.id },
      select: { status: true },
    }),
    prisma.contractorTimeEntry.findMany({
      where: {
        contractorId: contractorProfile.id,
        clockIn: { gte: monthStart },
      },
      select: { clockIn: true, clockOut: true },
    }),
    prisma.contractorExpense.findMany({
      where: {
        contractorId: contractorProfile.id,
        date: { gte: monthStart },
      },
      select: { amount: true, category: true },
    }),
  ]);

  // Calculate financial metrics
  const totalRevenue = jobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + (j.estimatedCost || 0), 0);

  const thisMonthRevenue = thisMonthJobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + (j.estimatedCost || 0), 0);

  const lastMonthRevenue = lastMonthJobs
    .reduce((sum, j) => sum + (j.estimatedCost || 0), 0);

  const revenueGrowth = lastMonthRevenue > 0
    ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : '0';

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profitMargin = totalRevenue > 0
    ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1)
    : '0';

  // Calculate job metrics
  const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const quotedJobs = jobs.filter(j => j.status === 'quoted').length;
  const completionRate = jobs.length > 0
    ? ((completedJobs / jobs.length) * 100).toFixed(1)
    : '0';

  // Calculate customer metrics
  const activeCustomers = customers.filter(c => c.status === 'customer').length;
  const leads = customers.filter(c => c.status === 'lead').length;
  const thisMonthCustomers = customers.filter(
    c => c.createdAt >= monthStart && c.createdAt <= monthEnd
  ).length;

  // Calculate employee metrics
  const activeEmployees = employees.filter(e => e.status === 'active').length;

  // Calculate time tracking metrics
  const totalHours = timeEntries.reduce((sum, entry) => {
    if (!entry.clockOut) return sum;
    const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  const avgHoursPerDay = timeEntries.length > 0 ? (totalHours / 30).toFixed(1) : '0';

  // Calculate expense breakdown
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-white/70 mt-1">Track your business performance and growth</p>
      </div>

      {/* Financial Overview */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Financial Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <DollarSign className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${thisMonthRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-white/70">This Month Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <TrendingUp className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{revenueGrowth}%</p>
                  <p className="text-sm text-white/70">Revenue Growth</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Target className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{profitMargin}%</p>
                  <p className="text-sm text-white/70">Profit Margin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <DollarSign className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${totalExpenses.toLocaleString()}
                  </p>
                  <p className="text-sm text-white/70">Total Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job Performance */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Job Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Briefcase className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{activeJobs}</p>
                  <p className="text-sm text-white/70">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Award className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{completedJobs}</p>
                  <p className="text-sm text-white/70">Completed Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Calendar className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{quotedJobs}</p>
                  <p className="text-sm text-white/70">Quoted Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <TrendingUp className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{completionRate}%</p>
                  <p className="text-sm text-white/70">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer & Team Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Customers & Team</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Users className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{activeCustomers}</p>
                  <p className="text-sm text-white/70">Active Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Target className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{leads}</p>
                  <p className="text-sm text-white/70">Active Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Users className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{activeEmployees}</p>
                  <p className="text-sm text-white/70">Active Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Clock className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{avgHoursPerDay}</p>
                  <p className="text-sm text-white/70">Avg Hours/Day</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expense Breakdown */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Expense Breakdown (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(expensesByCategory).length === 0 ? (
            <p className="text-white/60 text-center py-8">No expenses recorded this month</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-white capitalize">{category.replace('_', ' ')}</span>
                    <span className="text-white font-semibold">${amount.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
