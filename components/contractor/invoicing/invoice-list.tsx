'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Send, Eye } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  status: string;
  total: number;
  amountDue: number;
  dueDate: string;
  createdAt: string;
}

interface InvoiceListProps {
  invoices: Invoice[];
  onView: (id: string) => void;
  onSend: (id: string) => void;
  onDownload: (id: string) => void;
}

export function InvoiceList({ invoices, onView, onSend, onDownload }: InvoiceListProps) {
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

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
          <p className="text-gray-600 text-center">
            Create your first invoice to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Due:</span>
                    <span className="ml-2 font-medium">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount Due:</span>
                    <span className="ml-2 font-medium">
                      ${invoice.amountDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(invoice.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                {invoice.status !== 'paid' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSend(invoice.id)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(invoice.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
