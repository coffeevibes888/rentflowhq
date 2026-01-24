import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InvoiceList } from '@/components/contractor/invoice-list';

export const metadata: Metadata = {
  title: 'Invoices',
};

export default async function InvoicesPage() {
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

  // Fetch all invoices
  const invoices = await prisma.contractorInvoice.findMany({
    where: { contractorId: contractorProfile.id },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate stats
  const totalInvoices = invoices.length;
  const draftInvoices = invoices.filter((i) => i.status === 'draft').length;
  const sentInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'viewed').length;
  const paidInvoices = invoices.filter((i) => i.status === 'paid').length;
  const overdueInvoices = invoices.filter((i) => 
    (i.status === 'sent' || i.status === 'viewed' || i.status === 'partial') && 
    new Date(i.dueDate) < new Date()
  ).length;

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const paidAmount = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
  const outstandingAmount = invoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Invoices</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage customer invoices
          </p>
        </div>
        <Link href="/contractor/invoices/new">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-2 border-black shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
          <p className="text-xs text-gray-500 mt-1">
            ${totalAmount.toFixed(0)}
          </p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Draft</p>
          <p className="text-2xl font-bold text-gray-600">{draftInvoices}</p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Sent</p>
          <p className="text-2xl font-bold text-blue-600">{sentInvoices}</p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-emerald-600">{paidInvoices}</p>
          <p className="text-xs text-gray-500 mt-1">
            ${paidAmount.toFixed(0)}
          </p>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{overdueInvoices}</p>
          <p className="text-xs text-gray-500 mt-1">
            ${outstandingAmount.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Invoices</h3>
        </div>
        <div className="p-5">
          <InvoiceList invoices={invoices} />
        </div>
      </div>
    </div>
  );
}
