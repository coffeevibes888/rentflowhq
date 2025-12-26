'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, DollarSign, TrendingUp, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface Payment {
  id: string;
  amount: string;
  platformFee: string;
  netAmount: string;
  status: string;
  paidAt: string | null;
  contractor: { name: string; email: string };
  workOrder: { title: string };
  createdAt: string;
}

interface SpendingReport {
  contractor: { id: string; name: string; email: string } | undefined;
  totalSpent: string;
  paymentCount: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

export default function ContractorPaymentsTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [spendingReport, setSpendingReport] = useState<SpendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractorFilter, setContractorFilter] = useState<string>('all');
  const [contractors, setContractors] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (contractorFilter !== 'all') params.set('contractorId', contractorFilter);

      const res = await fetch(`/api/contractor-payments?${params}`);
      const data = await res.json();

      if (data.payments) {
        setPayments(data.payments);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSpendingReport = async () => {
    try {
      const res = await fetch('/api/contractors/reports/spending');
      const data = await res.json();

      if (data.report) {
        setSpendingReport(data.report);
      }
    } catch (error) {
      console.error('Failed to fetch spending report:', error);
    }
  };

  const fetchContractors = async () => {
    try {
      const res = await fetch('/api/contractors');
      const data = await res.json();
      if (data.contractors) {
        setContractors(data.contractors.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchSpendingReport();
    fetchContractors();
  }, [contractorFilter]);

  const totalSpent = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalFees = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.platformFee), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p) => p.status === 'completed').length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFees)}</div>
            <p className="text-xs text-muted-foreground">2.5% per payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contractors Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spendingReport.length}</div>
            <p className="text-xs text-muted-foreground">unique contractors</p>
          </CardContent>
        </Card>
      </div>

      {/* Spending by Contractor */}
      {spendingReport.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spending by Contractor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {spendingReport.map((item) => (
                <div
                  key={item.contractor?.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{item.contractor?.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.paymentCount} payment{item.paymentCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(parseFloat(item.totalSpent))}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Payment History</h3>
          <div className="flex gap-2">
            <Select value={contractorFilter} onValueChange={setContractorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by contractor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contractors</SelectItem>
                {contractors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No payments yet</h3>
              <p className="text-muted-foreground">
                Payments will appear here after you pay contractors for completed work
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{payment.contractor.name}</p>
                      <p className="text-sm text-muted-foreground">{payment.workOrder.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(parseFloat(payment.amount))}</p>
                      <p className="text-xs text-muted-foreground">
                        Fee: {formatCurrency(parseFloat(payment.platformFee))}
                      </p>
                      <Badge className={`mt-1 ${statusColors[payment.status]}`}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
