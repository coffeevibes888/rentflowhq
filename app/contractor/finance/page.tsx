import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  AlertCircle,
  Plus,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Finance Dashboard',
};

export default async function FinanceDashboardPage() {
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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Fetch financial data
  const [
    // Invoices
    invoices,
    paidInvoices,
    overdueInvoices,
    
    // Jobs revenue
    jobsRevenue,
    lastMonthJobsRevenue,
    
    // Expenses
    expenses,
    lastMonthExpenses,
    
    // Recent transactions
    recentInvoices,
    recentExpenses,
  ] = await Promise.all([
    // All invoices this month
    prisma.contractorInvoice.findMany({
      where: {
        contractorId: contractorProfile.id,
        createdAt: { gte: startOfMonth },
      },
    }),
    
    // Paid invoices this month
    prisma.contractorInvoice.findMany({
      where: {
        contractorId: contractorProfile.id,
        status: 'paid',
        paidAt: { gte: startOfMonth },
      },
    }),
    
    // Overdue invoices
    prisma.contractorInvoice.findMany({
      where: {
        contractorId: contractorProfile.id,
        status: { in: ['sent', 'viewed', 'partial'] },
        dueDate: { lt: now },
      },
    }),
    
    // Jobs revenue this month
    prisma.contractorJob.aggregate({
      where: {
        contractorId: contractorProfile.id,
        status: { in: ['completed', 'invoiced', 'paid'] },
        actualEndDate: { gte: startOfMonth },
      },
      _sum: { actualCost: true },
    }),
    
    // Jobs revenue last month
    prisma.contractorJob.aggregate({
      where: {
        contractorId: contractorProfile.id,
        status: { in: ['completed', 'invoiced', 'paid'] },
        actualEndDate: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: { actualCost: true },
    }),
    
    // Expenses this month
    prisma.contractorExpense.aggregate({
      where: {
        contractorId: contractorProfile.id,
        expenseDate: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    
    // Expenses last month
    prisma.contractorExpense.aggregate({
      where: {
        contractorId: contractorProfile.id,
        expenseDate: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: { amount: true },
    }),
    
    // Recent invoices (last 5)
    prisma.contractorInvoice.findMany({
      where: { contractorId: contractorProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    
    // Recent expenses (last 5)
    prisma.contractorExpense.findMany({
      where: { contractorId: contractorProfile.id },
      orderBy: { expenseDate: 'desc' },
      take: 5,
    }),
  ]);

  // Calculate totals
  const totalRevenue = Number(jobsRevenue._sum.actualCost || 0);
  const lastMonthRevenue = Number(lastMonthJobsRevenue._sum.actualCost || 0);
  const totalExpenses = Number(expenses._sum.amount || 0);
  const lastMonthExpensesAmount = Number(lastMonthExpenses._sum.amount || 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0);
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0);

  // Calculate growth
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0;
  const expenseGrowth = lastMonthExpensesAmount > 0
    ? ((totalExpenses - lastMonthExpensesAmount) / lastMonthExpensesAmount) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Finance Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track revenue, expenses, and profitability
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/contractor/expenses/new">
            <Button variant="outline" className="border-2 border-gray-200">
              <Plus className="h-4 w-4 mr-2" />
              Log Expense
            </Button>
          </Link>
          <Link href="/contractor/invoices/new">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-2 border-black shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue */}
        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-emerald-100">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            {revenueGrowth !== 0 && (
              <Badge className={revenueGrowth > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-gray-500">
            Last month: {formatCurrency(lastMonthRevenue)}
          </p>
        </div>

        {/* Expenses */}
        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            {expenseGrowth !== 0 && (
              <Badge className={expenseGrowth < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                {expenseGrowth > 0 ? '+' : ''}{expenseGrowth.toFixed(1)}%
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-xs text-gray-500">
            Last month: {formatCurrency(lastMonthExpensesAmount)}
          </p>
        </div>

        {/* Net Profit */}
        <div className="rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <Badge className={netProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
              {netProfit >= 0 ? 'Profit' : 'Loss'}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-1">Net Profit</p>
          <p className={`text-3xl font-bold mb-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(netProfit)}
          </p>
          <p className="text-xs text-gray-500">
            Margin: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              <p className="text-sm text-gray-600">Invoices</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{paidInvoices.length}</p>
              <p className="text-sm text-gray-600">Paid</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalOutstanding)}
              </p>
              <p className="text-sm text-gray-600">Outstanding</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalOverdue)}
              </p>
              <p className="text-sm text-gray-600">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Invoices */}
        <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
            <Link href="/contractor/invoices" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="p-5">
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No invoices yet</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/contractor/invoices/${invoice.id}`}
                    className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Invoice #{invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(Number(invoice.total))}
                        </p>
                        <Badge
                          className={
                            invoice.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700 mt-1'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-700 mt-1'
                              : 'bg-amber-100 text-amber-700 mt-1'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
            <Link href="/contractor/expenses" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="p-5">
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No expenses yet</p>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <Link
                    key={expense.id}
                    href={`/contractor/expenses/${expense.id}`}
                    className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {expense.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {expense.category} • {new Date(expense.expenseDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-bold text-red-600">
                          -{formatCurrency(Number(expense.amount))}
                        </p>
                        <Badge
                          className={
                            expense.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700 mt-1'
                              : 'bg-amber-100 text-amber-700 mt-1'
                          }
                        >
                          {expense.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/contractor/invoices/new">
            <Button variant="outline" className="w-full border-2 border-gray-200 h-auto py-4 flex-col gap-2">
              <FileText className="h-5 w-5" />
              <span className="text-sm">New Invoice</span>
            </Button>
          </Link>
          <Link href="/contractor/expenses/new">
            <Button variant="outline" className="w-full border-2 border-gray-200 h-auto py-4 flex-col gap-2">
              <TrendingDown className="h-5 w-5" />
              <span className="text-sm">Log Expense</span>
            </Button>
          </Link>
          <Link href="/contractor/reports">
            <Button variant="outline" className="w-full border-2 border-gray-200 h-auto py-4 flex-col gap-2">
              <Download className="h-5 w-5" />
              <span className="text-sm">Reports</span>
            </Button>
          </Link>
          <Link href="/contractor/payments">
            <Button variant="outline" className="w-full border-2 border-gray-200 h-auto py-4 flex-col gap-2">
              <CreditCard className="h-5 w-5" />
              <span className="text-sm">Payments</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
