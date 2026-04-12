'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cancelInvoice, markInvoicePaid } from '@/lib/actions/invoice.actions';
import { Button } from '@/components/ui/button';

interface Invoice {
  id: string;
  propertyName: string;
  tenantName: string;
  tenantEmail: string;
  amount: number;
  reason: string;
  description: string | null;
  dueDate: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export default function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCancel = async (invoiceId: string) => {
    setLoadingId(invoiceId);
    const result = await cancelInvoice(invoiceId);
    if (result.success) {
      toast({ description: result.message });
    } else {
      toast({ variant: 'destructive', description: result.message });
    }
    setLoadingId(null);
  };

  const handleMarkPaid = async (invoiceId: string) => {
    setLoadingId(invoiceId);
    const result = await markInvoicePaid(invoiceId);
    if (result.success) {
      toast({ description: result.message });
    } else {
      toast({ variant: 'destructive', description: result.message });
    }
    setLoadingId(null);
  };

  if (invoices.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">
        No invoices yet. Create one to get started.
      </p>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-slate-100 text-slate-600',
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-slate-900">{invoice.reason}</p>
              <p className="text-xs text-slate-500">
                {invoice.propertyName} • {invoice.tenantName}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(
                invoice.status
              )}`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-900">
              ${invoice.amount.toFixed(2)}
            </span>
            <span className="text-slate-500">
              Due: {new Date(invoice.dueDate).toLocaleDateString()}
            </span>
          </div>

          {invoice.description && (
            <p className="text-xs text-slate-600">{invoice.description}</p>
          )}

          {invoice.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkPaid(invoice.id)}
                disabled={loadingId === invoice.id}
              >
                Mark Paid
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleCancel(invoice.id)}
                disabled={loadingId === invoice.id}
              >
                Cancel
              </Button>
            </div>
          )}

          {invoice.paidAt && (
            <p className="text-xs text-green-600">
              Paid on {new Date(invoice.paidAt).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
