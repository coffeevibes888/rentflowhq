import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Plus, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/contractor/expense-list';

export const metadata: Metadata = {
  title: 'Expenses',
};

export default async function ExpensesPage() {
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

  // Fetch expenses
  const [expenses, monthExpenses, yearExpenses] = await Promise.all([
    prisma.contractorExpense.findMany({
      where: { contractorId: contractorProfile.id },
      orderBy: { expenseDate: 'desc' },
    }),
    
    prisma.contractorExpense.aggregate({
      where: {
        contractorId: contractorProfile.id,
        expenseDate: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    
    prisma.contractorExpense.aggregate({
      where: {
        contractorId: contractorProfile.id,
        expenseDate: { gte: startOfYear },
      },
      _sum: { amount: true },
    }),
  ]);

  // Calculate stats
  const totalExpenses = expenses.length;
  const monthTotal = Number(monthExpenses._sum.amount || 0);
  const yearTotal = Number(yearExpenses._sum.amount || 0);
  
  const pendingExpenses = expenses.filter((e) => e.status === 'pending').length;
  const approvedExpenses = expenses.filter((e) => e.status === 'approved').length;
  
  const billableExpenses = expenses.filter((e) => e.billable).length;
  const billableAmount = expenses
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Category breakdown
  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category;
    acc[category] = (acc[category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Expenses</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage business expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-2 border-gray-200">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/contractor/expenses/new">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-2 border-black shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Log Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">This Month</p>
          <p className="text-2xl font-bold text-red-600">
            ${monthTotal.toFixed(0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {expenses.filter((e) => new Date(e.expenseDate) >= startOfMonth).length} expenses
          </p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">This Year</p>
          <p className="text-2xl font-bold text-gray-900">
            ${yearTotal.toFixed(0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {totalExpenses} total
          </p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Billable</p>
          <p className="text-2xl font-bold text-emerald-600">
            ${billableAmount.toFixed(0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {billableExpenses} expenses
          </p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{pendingExpenses}</p>
          <p className="text-xs text-gray-500 mt-1">
            {approvedExpenses} approved
          </p>
        </div>
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
          <div className="p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
          </div>
          <div className="p-5">
            <div className="grid md:grid-cols-5 gap-4">
              {topCategories.map(([category, amount]) => (
                <div key={category} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1 capitalize">
                    {category.replace('_', ' ')}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    ${amount.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {expenses.filter((e) => e.category === category).length} expenses
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Expenses</h3>
        </div>
        <div className="p-5">
          <ExpenseList expenses={expenses} />
        </div>
      </div>
    </div>
  );
}
