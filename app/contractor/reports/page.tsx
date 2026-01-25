import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Download, TrendingUp, TrendingDown, DollarSign, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { canAccessFeature } from '@/lib/services/contractor-feature-gate';

export const metadata: Metadata = {
  title: 'Financial Reports',
};

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { 
      id: true, 
      businessName: true,
      subscriptionTier: true,
    },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  // Check if contractor has access to advanced analytics
  const advancedAnalyticsAccess = await canAccessFeature(contractorProfile.id, 'advancedAnalytics');
  const hasAdvancedAnalytics = advancedAnalyticsAccess.allowed;
  
  // Basic reports are available to all tiers
  const tier = contractorProfile.subscriptionTier || 'starter';

  // Date ranges
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get monthly data for the year
  const months = [];
  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(now.getFullYear(), i, 1);
    const monthEnd = new Date(now.getFullYear(), i + 1, 0);
    months.push({ start: monthStart, end: monthEnd, name: monthStart.toLocaleString('default', { month: 'short' }) });
  }

  // Fetch financial data
  const [yearRevenue, yearExpenses, monthRevenue, monthExpenses, categoryExpenses] = await Promise.all([
    // Year revenue
    prisma.contractorJob.aggregate({
      where: {
        contractorId: contractorProfile.id,
        status: { in: ['completed', 'invoiced', 'paid'] },
        actualEndDate: { gte: startOfYear },
      },
      _sum: { actualCost: true },
    }),
    
    // Year expenses
    prisma.contractorExpense.aggregate({
      where: {
        contractorId: contractorProfile.id,
        expenseDate: { gte: startOfYear },
      },
      _sum: { amount: true },
    }),
    
    // Month revenue
    prisma.contractorJob.aggregate({
      where: {
        contractorId: contractorProfile.id,
        status: { in: ['completed', 'invoiced', 'paid'] },
        actualEndDate: { gte: startOfMonth },
      },
      _sum: { actualCost: true },
    }),
    
    // Month expenses
    prisma.contractorExpense.aggregate({
      where: {
        contractorId: contractorProfile.id,
        expenseDate: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    
    // Expenses by category
    prisma.contractorExpense.groupBy({
      by: ['category'],
      where: {
        contractorId: contractorProfile.id,
        expenseDate: { gte: startOfYear },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
  ]);

  const totalYearRevenue = Number(yearRevenue._sum.actualCost || 0);
  const totalYearExpenses = Number(yearExpenses._sum.amount || 0);
  const totalMonthRevenue = Number(monthRevenue._sum.actualCost || 0);
  const totalMonthExpenses = Number(monthExpenses._sum.amount || 0);
  
  const yearProfit = totalYearRevenue - totalYearExpenses;
  const monthProfit = totalMonthRevenue - totalMonthExpenses;
  const profitMargin = totalYearRevenue > 0 ? (yearProfit / totalYearRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Financial Reports</h1>
          <p className="text-sm text-gray-600 mt-1">
            Profit & loss statements and financial analysis
          </p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-2 border-black shadow-lg">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-emerald-100">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Revenue (YTD)</p>
          <p className="text-3xl font-bold text-emerald-600 mb-2">
            {formatCurrency(totalYearRevenue)}
          </p>
          <p className="text-xs text-gray-500">
            This month: {formatCurrency(totalMonthRevenue)}
          </p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Expenses (YTD)</p>
          <p className="text-3xl font-bold text-red-600 mb-2">
            {formatCurrency(totalYearExpenses)}
          </p>
          <p className="text-xs text-gray-500">
            This month: {formatCurrency(totalMonthExpenses)}
          </p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Net Profit (YTD)</p>
          <p className={`text-3xl font-bold mb-2 ${yearProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(yearProfit)}
          </p>
          <p className="text-xs text-gray-500">
            Margin: {profitMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Profit & Loss Statement */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Profit & Loss Statement - {now.getFullYear()}
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Revenue Section */}
            <div>
              <div className="flex justify-between items-center py-3 border-b-2 border-gray-200">
                <span className="font-semibold text-gray-900">Revenue</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(totalYearRevenue)}
                </span>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="font-semibold text-gray-900">Expenses</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(totalYearExpenses)}
                </span>
              </div>
              <div className="ml-4 space-y-2 mt-2">
                {categoryExpenses.map((cat) => (
                  <div key={cat.category} className="flex justify-between items-center py-2 text-sm">
                    <span className="text-gray-600">{cat.category}</span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(Number(cat._sum.amount || 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Profit */}
            <div className="pt-4 border-t-2 border-gray-200">
              <div className="flex justify-between items-center py-3">
                <span className="text-lg font-bold text-gray-900">Net Profit</span>
                <span className={`text-lg font-bold ${yearProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(yearProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Profit Margin</span>
                <span className="font-medium">{profitMargin.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Month
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                    Expenses
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                    Profit
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, index) => {
                  // For now, show placeholder data - in production, fetch actual monthly data
                  const monthRev = index <= now.getMonth() ? totalYearRevenue / (now.getMonth() + 1) : 0;
                  const monthExp = index <= now.getMonth() ? totalYearExpenses / (now.getMonth() + 1) : 0;
                  const monthProf = monthRev - monthExp;
                  const monthMargin = monthRev > 0 ? (monthProf / monthRev) * 100 : 0;

                  return (
                    <tr key={month.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{month.name}</td>
                      <td className="py-3 px-4 text-sm text-right text-emerald-600 font-medium">
                        {index <= now.getMonth() ? formatCurrency(monthRev) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-red-600 font-medium">
                        {index <= now.getMonth() ? formatCurrency(monthExp) : '-'}
                      </td>
                      <td className={`py-3 px-4 text-sm text-right font-medium ${monthProf >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {index <= now.getMonth() ? formatCurrency(monthProf) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900">
                        {index <= now.getMonth() ? `${monthMargin.toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Section - Enterprise Only */}
      {!hasAdvancedAnalytics && (
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-8 text-center">
          <Lock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-white mb-2">Advanced Analytics</h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Unlock powerful insights with custom dashboards, forecasting, trend analysis, 
            and advanced reporting features. Available on the Enterprise plan.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-white">
              📊 Custom Dashboards
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-white">
              📈 Revenue Forecasting
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-white">
              🎯 Performance Tracking
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-white">
              📉 Trend Analysis
            </div>
          </div>
          <Link
            href="/contractor/settings/subscription"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-full font-semibold transition-colors"
          >
            <Zap className="h-5 w-5" />
            Upgrade to Enterprise
          </Link>
        </div>
      )}

      {hasAdvancedAnalytics && (
        <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics</h3>
              <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                ENTERPRISE
              </span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 text-center py-8">
              Advanced analytics features coming soon...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
