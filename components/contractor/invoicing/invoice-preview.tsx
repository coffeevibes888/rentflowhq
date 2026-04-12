'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  type: string;
}

interface InvoicePreviewProps {
  invoice: {
    invoiceNumber: string;
    status: string;
    contractor: {
      businessName: string;
      email: string;
      phone?: string;
      logoUrl?: string;
    };
    lineItems: LineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    depositPaid: number;
    dueDate: string;
    createdAt: string;
    notes?: string;
    terms?: string;
  };
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              {invoice.contractor.logoUrl && (
                <img 
                  src={invoice.contractor.logoUrl} 
                  alt="Logo" 
                  className="h-16 mb-4"
                />
              )}
              <h2 className="text-2xl font-bold">{invoice.contractor.businessName}</h2>
              <p className="text-gray-600">{invoice.contractor.email}</p>
              {invoice.contractor.phone && (
                <p className="text-gray-600">{invoice.contractor.phone}</p>
              )}
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold">INVOICE</h1>
              <p className="text-sm text-gray-600">{invoice.invoiceNumber}</p>
              <Badge className={`mt-2 ${getStatusColor(invoice.status)}`}>
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Price</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 capitalize">{item.type}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
                <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}
            {invoice.depositPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Deposit Paid:</span>
                <span className="font-medium">-${invoice.depositPaid.toFixed(2)}</span>
              </div>
            )}
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium">-${invoice.amountPaid.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Amount Due:</span>
              <span>${invoice.amountDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}

          {/* Terms */}
          {invoice.terms && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Terms & Conditions</h3>
              <p className="text-sm text-gray-700">{invoice.terms}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
