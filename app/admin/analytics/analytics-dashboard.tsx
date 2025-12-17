'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs/index';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Home,
  Download,
  Calculator,
  FileText,
  Building,
  CreditCard,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  PenTool,
  Plus,
  Wrench,
  ShieldAlert,
  Percent,
  Activity,
  LineChart,
  Landmark,
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacancyRate: number;
  averageRent: number;
  totalTenants: number;
  monthlyRevenue: number[];
  monthlyExpenses: number[];

  physicalOccupancy: number;
  economicOccupancy: number;
  rentPossibleThisMonth: number;
  rentCollectedThisMonth: number;
  vacancyLossThisMonth: number;

  maintenanceCostsThisMonth: number;
  platformFeesThisMonth: number;
  otherExpensesThisMonth: number;
  totalExpensesThisMonth: number;
  expensesRecordedThisMonth: boolean;
  netProfitThisMonth: number;
  profitMarginThisMonth: number;
  expenseBreakdownThisMonth: Array<{ category: string; amount: number }>;

  tenantQuality: {
    onTimePaymentPercent: number;
    latePaymentFrequency: number;
    avgDaysLate: number;
    worstTenants: Array<{
      tenantId: string;
      onTimePercent: number;
      latePaymentFrequency: number;
      avgDaysLate: number;
      maintenanceRequests: number;
      violationCount: number;
    }>;
  };

  maintenanceAnalytics: {
    totalCost: number;
    costPerUnit: number;
    avgResolutionTimeDays: number;
    emergencyRatio: number;
    repeatIssues: Array<{ unitId: string; title: string; count: number }>;
  };

  vacancyAnalytics: {
    avgDaysVacant: number;
    vacancyCostYtd: number;
    currentVacantUnits: Array<{ unitId: string; propertyId: string; daysVacant: number }>;
  };

  marketComparison: {
    marketAverageRent: number | null;
    delta: number | null;
    source: string | null;
    effectiveDate: string | null;
  };

  portfolioHealth: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
  };

  propertyPerformance: Array<{
    id: string;
    name: string;
    revenue: number;
    expenses: number;
    occupancyRate: number;
    units: number;
  }>;
}

interface AnalyticsDashboardProps {
  landlordId: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ landlordId }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [qbConnected, setQbConnected] = useState<boolean>(false);
  const [qbCompanyName, setQbCompanyName] = useState<string | null>(null);
  const [qbLoading, setQbLoading] = useState<boolean>(false);
  const [dsConnected, setDsConnected] = useState<boolean>(false);
  const [dsLoading, setDsLoading] = useState<boolean>(false);

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [benchmarkDialogOpen, setBenchmarkDialogOpen] = useState(false);

  const [expenseCategory, setExpenseCategory] = useState('maintenance');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseIncurredAt, setExpenseIncurredAt] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  const [benchmarkAverageRent, setBenchmarkAverageRent] = useState('');
  const [benchmarkEffectiveDate, setBenchmarkEffectiveDate] = useState('');
  const [benchmarkSource, setBenchmarkSource] = useState('manual');
  const [benchmarkZip, setBenchmarkZip] = useState('');
  const [benchmarkSubmitting, setBenchmarkSubmitting] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [landlordId]);

  useEffect(() => {
    fetchQuickBooksStatus();
    fetchDocuSignStatus();
  }, [landlordId]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/landlord/analytics?landlordId=${landlordId}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitExpense = async () => {
    try {
      setExpenseSubmitting(true);

      const payload = {
        landlordId,
        category: expenseCategory,
        amount: expenseAmount,
        incurredAt: expenseIncurredAt || new Date().toISOString().slice(0, 10),
        description: expenseDescription,
        isRecurring: expenseIsRecurring,
      };

      const res = await fetch('/api/landlord/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        alert(json?.message || 'Failed to add expense');
        return;
      }

      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseIsRecurring(false);
      setExpenseDialogOpen(false);
      await fetchAnalyticsData();
    } catch (e) {
      console.error('Failed to add expense:', e);
      alert('Failed to add expense');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const submitBenchmark = async () => {
    try {
      setBenchmarkSubmitting(true);

      const payload = {
        landlordId,
        averageRent: benchmarkAverageRent,
        effectiveDate: benchmarkEffectiveDate || new Date().toISOString().slice(0, 10),
        source: benchmarkSource,
        zip: benchmarkZip || null,
      };

      const res = await fetch('/api/landlord/market-benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        alert(json?.message || 'Failed to set market benchmark');
        return;
      }

      setBenchmarkAverageRent('');
      setBenchmarkZip('');
      setBenchmarkDialogOpen(false);
      await fetchAnalyticsData();
    } catch (e) {
      console.error('Failed to set benchmark:', e);
      alert('Failed to set market benchmark');
    } finally {
      setBenchmarkSubmitting(false);
    }
  };

  const fetchQuickBooksStatus = async () => {
    try {
      const res = await fetch(`/api/integrations/quickbooks/status?landlordId=${landlordId}`);
      const json = await res.json();
      if (json?.success) {
        const connected = Boolean(json?.data?.connected);
        setQbConnected(connected);
        const companyName =
          json?.data?.companyInfo?.CompanyInfo?.CompanyName ||
          json?.data?.companyInfo?.CompanyInfo?.LegalName ||
          null;
        setQbCompanyName(companyName);
      }
    } catch (e) {
      console.error('Failed to fetch QuickBooks status:', e);
    }
  };

  const fetchDocuSignStatus = async () => {
    try {
      const res = await fetch(`/api/integrations/docusign/status?landlordId=${landlordId}`);
      const json = await res.json();
      if (json?.success) {
        const connected = Boolean(json?.data?.connected);
        setDsConnected(connected);
      }
    } catch (e) {
      console.error('Failed to fetch DocuSign status:', e);
    }
  };

  const downloadReport = async (format: 'csv' | 'excel') => {
    try {
      const response = await fetch(`/api/landlord/analytics/export?landlordId=${landlordId}&format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const syncWithQuickBooks = async () => {
    try {
      setQbLoading(true);

      if (!qbConnected) {
        window.location.href = `/api/integrations/quickbooks/connect?landlordId=${landlordId}`;
        return;
      }

      const response = await fetch('/api/integrations/quickbooks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId }),
      });
      const result = await response.json();

      if (result.success) {
        await fetchQuickBooksStatus();
        alert('QuickBooks connection verified.');
      } else {
        if (result.code === 'QUICKBOOKS_NOT_CONNECTED') {
          window.location.href = `/api/integrations/quickbooks/connect?landlordId=${landlordId}`;
          return;
        }
        alert('Sync failed: ' + result.message);
      }
    } catch (error) {
      console.error('QuickBooks sync failed:', error);
      alert('QuickBooks sync failed');
    } finally {
      setQbLoading(false);
    }
  };

  const connectDocuSign = async () => {
    try {
      setDsLoading(true);

      if (!dsConnected) {
        window.location.href = `/api/docusign/connect?landlordId=${landlordId}`;
        return;
      }

      // If already connected, verify the connection
      await fetchDocuSignStatus();
      alert('DocuSign connection verified.');
    } catch (error) {
      console.error('DocuSign connection failed:', error);
      alert('DocuSign connection failed');
    } finally {
      setDsLoading(false);
    }
  };

  const syncWithTurboTax = async () => {
    try {
      const response = await fetch('/api/integrations/turbotax/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId })
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Successfully prepared tax data for TurboTax!');
      } else {
        alert('Tax preparation failed: ' + result.message);
      }
    } catch (error) {
      console.error('TurboTax sync failed:', error);
      alert('Tax preparation failed');
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {[...Array(8)].map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardHeader className='pb-2'>
                <div className='h-4 bg-slate-200 rounded w-3/4'></div>
              </CardHeader>
              <CardContent>
                <div className='h-8 bg-slate-200 rounded w-1/2'></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <p className='text-center text-slate-500'>Unable to load analytics data</p>
        </CardContent>
      </Card>
    );
  }

  const formatMoney = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const formatPct = (n: number) => `${n.toFixed(1)}%`;
  const healthColor =
    data.portfolioHealth.score >= 80
      ? 'text-emerald-300'
      : data.portfolioHealth.score >= 65
        ? 'text-amber-300'
        : 'text-rose-300';

  return (
    <div className='space-y-6'>
      {/* Key Metrics */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Rent Collected (Month)</span>
            <DollarSign className='h-4 w-4 text-violet-200/80' />
          </div>
          <div className='text-2xl font-semibold text-slate-50'>{formatMoney(data.rentCollectedThisMonth)}</div>
          <div className='text-xs text-slate-300/80'>
            Possible: {formatMoney(data.rentPossibleThisMonth)}
          </div>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Expenses (Month)</span>
            <Wrench className='h-4 w-4 text-violet-200/80' />
          </div>
          <div className='text-2xl font-semibold text-slate-50'>{formatMoney(data.totalExpensesThisMonth)}</div>
          <div className='text-xs text-slate-300/80'>
            {data.expensesRecordedThisMonth ? 'Recorded expenses this period' : 'No expenses recorded this period'}
          </div>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Net Cash Flow (Month)</span>
            <LineChart className='h-4 w-4 text-violet-200/80' />
          </div>
          <div className='text-2xl font-semibold text-slate-50'>{formatMoney(data.netProfitThisMonth)}</div>
          <div className='text-xs text-slate-300/80 flex items-center gap-1'>
            <Percent className='h-3 w-3' />
            {formatPct(data.profitMarginThisMonth)} margin
          </div>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Portfolio Health</span>
            <Activity className='h-4 w-4 text-violet-200/80' />
          </div>
          <div className={`text-2xl font-semibold ${healthColor}`}>{data.portfolioHealth.score} / 100</div>
          <div className='text-xs text-slate-300/80'>Trend: {data.portfolioHealth.trend}</div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <TabsList className='grid w-full sm:w-auto grid-cols-2 lg:grid-cols-5'>
            <TabsTrigger triggerValue='overview'>Overview</TabsTrigger>
            <TabsTrigger triggerValue='properties'>Properties</TabsTrigger>
            <TabsTrigger triggerValue='roi'>ROI Analysis</TabsTrigger>
            <TabsTrigger triggerValue='market'>Market</TabsTrigger>
            <TabsTrigger triggerValue='integrations'>Integrations</TabsTrigger>
          </TabsList>

          <div className='flex flex-wrap gap-2 w-full sm:w-auto'>
            <Button variant='outline' size='sm' onClick={() => setExpenseDialogOpen(true)}>
              <Plus className='h-4 w-4 mr-2' />
              Add Expense
            </Button>
            <Button variant='outline' size='sm' onClick={() => setBenchmarkDialogOpen(true)}>
              <Landmark className='h-4 w-4 mr-2' />
              Set Market Avg
            </Button>
            <Button variant='outline' size='sm' onClick={() => downloadReport('csv')}>
              <Download className='h-4 w-4 mr-2' />
              CSV
            </Button>
            <Button variant='outline' size='sm' onClick={() => downloadReport('excel')}>
              <Download className='h-4 w-4 mr-2' />
              Excel
            </Button>
          </div>
        </div>

        <TabsContent contentValue='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            <Card className='border-white/10 bg-slate-900/60 text-slate-50'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base'>Occupancy</CardTitle>
                <CardDescription className='text-slate-300/80'>Physical vs economic (this month)</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Physical</div>
                    <div className='text-lg font-semibold'>{formatPct(data.physicalOccupancy)}</div>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Economic</div>
                    <div className='text-lg font-semibold'>{formatPct(data.economicOccupancy)}</div>
                  </div>
                </div>
                <div className='rounded-lg border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-3'>
                  <div>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Vacancy Loss (Month)</div>
                    <div className='text-lg font-semibold text-rose-200'>-{formatMoney(data.vacancyLossThisMonth).slice(1)}</div>
                  </div>
                  <ShieldAlert className='h-5 w-5 text-rose-200/80' />
                </div>
              </CardContent>
            </Card>

            <Card className='border-white/10 bg-slate-900/60 text-slate-50'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base'>Expenses</CardTitle>
                <CardDescription className='text-slate-300/80'>Breakdown (this month)</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {!data.expensesRecordedThisMonth ? (
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-200/90'>
                    No expenses recorded this period
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {data.expenseBreakdownThisMonth.slice(0, 6).map((row) => (
                      <div key={row.category} className='flex items-center justify-between text-sm'>
                        <span className='text-slate-200/90 capitalize'>{row.category.replace(/_/g, ' ')}</span>
                        <span className='font-semibold text-slate-50'>{formatMoney(row.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className='grid grid-cols-2 gap-3 text-xs text-slate-300/80'>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='uppercase tracking-wide'>Maintenance</div>
                    <div className='text-sm font-semibold text-slate-50'>{formatMoney(data.maintenanceCostsThisMonth)}</div>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='uppercase tracking-wide'>Platform Fees</div>
                    <div className='text-sm font-semibold text-slate-50'>{formatMoney(data.platformFeesThisMonth)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-white/10 bg-slate-900/60 text-slate-50'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base'>Tenant Quality</CardTitle>
                <CardDescription className='text-slate-300/80'>On-time & behavior signals</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid grid-cols-3 gap-3'>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>On-time</div>
                    <div className='text-sm font-semibold text-slate-50'>{formatPct(data.tenantQuality.onTimePaymentPercent)}</div>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Late freq</div>
                    <div className='text-sm font-semibold text-slate-50'>{formatPct(data.tenantQuality.latePaymentFrequency)}</div>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Avg days late</div>
                    <div className='text-sm font-semibold text-slate-50'>{data.tenantQuality.avgDaysLate.toFixed(1)}</div>
                  </div>
                </div>

                {data.tenantQuality.worstTenants.length > 0 && (
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80 mb-2'>Needs attention</div>
                    <div className='space-y-2'>
                      {data.tenantQuality.worstTenants.slice(0, 3).map((t) => (
                        <div key={t.tenantId} className='flex items-center justify-between text-xs'>
                          <span className='text-slate-200/90'>Tenant {t.tenantId.slice(-6)}</span>
                          <span className='text-slate-300/80'>On-time {formatPct(t.onTimePercent)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <Card className='border-white/10 bg-slate-900/60 text-slate-50'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base'>Maintenance Analytics</CardTitle>
                <CardDescription className='text-slate-300/80'>Costs + speed + repeat issues</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Cost / unit</div>
                    <div className='text-sm font-semibold text-slate-50'>{formatMoney(data.maintenanceAnalytics.costPerUnit)}</div>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Total cost</div>
                    <div className='text-sm font-semibold text-slate-50'>{formatMoney(data.maintenanceAnalytics.totalCost)}</div>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Avg resolve</div>
                    <div className='text-sm font-semibold text-slate-50'>{data.maintenanceAnalytics.avgResolutionTimeDays.toFixed(1)}d</div>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Emergency</div>
                    <div className='text-sm font-semibold text-slate-50'>{formatPct(data.maintenanceAnalytics.emergencyRatio)}</div>
                  </div>
                </div>

                {data.maintenanceAnalytics.repeatIssues.length > 0 && (
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80 mb-2'>Repeat issues</div>
                    <div className='space-y-2'>
                      {data.maintenanceAnalytics.repeatIssues.slice(0, 3).map((issue) => (
                        <div key={`${issue.unitId}-${issue.title}`} className='flex items-center justify-between text-xs'>
                          <span className='text-slate-200/90'>Unit {issue.unitId.slice(-4)} • {issue.title}</span>
                          <span className='text-slate-300/80'>{issue.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className='border-white/10 bg-slate-900/60 text-slate-50'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base'>Vacancy Analytics</CardTitle>
                <CardDescription className='text-slate-300/80'>Days vacant + cost impact</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Avg days vacant</div>
                    <div className='text-sm font-semibold text-slate-50'>{data.vacancyAnalytics.avgDaysVacant.toFixed(1)}</div>
                  </div>
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80'>Vacancy cost (YTD)</div>
                    <div className='text-sm font-semibold text-rose-200'>-{formatMoney(data.vacancyAnalytics.vacancyCostYtd).slice(1)}</div>
                  </div>
                </div>

                {data.vacancyAnalytics.currentVacantUnits.length > 0 && (
                  <div className='rounded-lg border border-white/10 bg-white/5 p-3'>
                    <div className='text-[11px] uppercase tracking-wide text-slate-300/80 mb-2'>Currently vacant</div>
                    <div className='space-y-2'>
                      {data.vacancyAnalytics.currentVacantUnits.slice(0, 5).map((u) => (
                        <div key={u.unitId} className='flex items-center justify-between text-xs'>
                          <span className='text-slate-200/90'>Unit {u.unitId.slice(-4)}</span>
                          <span className='text-slate-300/80'>{u.daysVacant} days</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent contentValue='properties' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Property Performance</CardTitle>
              <CardDescription>Individual property analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {data.propertyPerformance.map((property) => (
                  <div key={property.id} className='border rounded-lg p-4'>
                    <div className='flex justify-between items-start mb-2'>
                      <h3 className='font-semibold'>{property.name}</h3>
                      <Badge variant={property.occupancyRate > 90 ? 'default' : 'secondary'}>
                        {property.occupancyRate.toFixed(1)}% occupied
                      </Badge>
                    </div>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                      <div>
                        <span className='text-slate-600'>Revenue:</span>
                        <p className='font-semibold text-green-600'>${property.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className='text-slate-600'>Expenses:</span>
                        <p className='font-semibold text-red-600'>${property.expenses.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className='text-slate-600'>Net:</span>
                        <p className={`font-semibold ${(property.revenue - property.expenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${(property.revenue - property.expenses).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className='text-slate-600'>Units:</span>
                        <p className='font-semibold'>{property.units}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent contentValue='roi' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>ROI Calculator</CardTitle>
                <CardDescription>Calculate return on investment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>Total Investment</label>
                    <Input type='number' className='mt-1' placeholder='100000' />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Annual Net Income</label>
                    <Input type='number' className='mt-1' placeholder='12000' />
                  </div>
                  <Button className='w-full'>
                    <Calculator className='h-4 w-4 mr-2' />
                    Calculate ROI
                  </Button>
                  <div className='p-4 bg-slate-50 rounded'>
                    <div className='text-2xl font-bold text-green-600'>12.0%</div>
                    <div className='text-sm text-slate-600'>Annual ROI</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investment Projections</CardTitle>
                <CardDescription>5-year growth forecast</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center text-slate-500'>
                  <TrendingUp className='h-12 w-12 mr-2' />
                  Projection chart coming soon
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent contentValue='market' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Market Comparison</CardTitle>
              <CardDescription>Compare your properties to market averages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-blue-600'>{formatMoney(data.averageRent)}</div>
                  <div className='text-sm text-slate-600'>Your Avg Rent</div>
                  {data.marketComparison.marketAverageRent != null && data.marketComparison.delta != null ? (
                    <div className={`text-xs mt-1 ${data.marketComparison.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.marketComparison.delta >= 0 ? '▲' : '▼'} {formatMoney(Math.abs(data.marketComparison.delta))} vs market
                    </div>
                  ) : (
                    <div className='text-xs text-slate-500 mt-1'>Set a market benchmark to compare</div>
                  )}
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-green-600'>{formatPct(data.physicalOccupancy)}</div>
                  <div className='text-sm text-slate-600'>Physical Occupancy</div>
                  <div className='text-xs text-slate-500 mt-1'>Economic: {formatPct(data.economicOccupancy)}</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-purple-600'>{data.portfolioHealth.score}</div>
                  <div className='text-sm text-slate-600'>Portfolio Health</div>
                  <div className='text-xs text-slate-500 mt-1'>Trend: {data.portfolioHealth.trend}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent contentValue='integrations' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building className='h-5 w-5' />
                  QuickBooks Integration
                </CardTitle>
                <CardDescription>Sync your financial data with QuickBooks</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Connection Status:</span>
                  <Badge variant='outline'>
                    {qbConnected ? `Connected${qbCompanyName ? ` (${qbCompanyName})` : ''}` : 'Not Connected'}
                  </Badge>
                </div>
                <div className='space-y-2 text-sm text-slate-600'>
                  <p>• Sync rent payments and expenses</p>
                  <p>• Automatic categorization</p>
                  <p>• Real-time financial tracking</p>
                </div>
                <Button className='w-full' onClick={syncWithQuickBooks} disabled={qbLoading}>
                  <CreditCard className='h-4 w-4 mr-2' />
                  {qbConnected ? 'Verify Connection' : 'Connect QuickBooks'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <PenTool className='h-5 w-5' />
                  DocuSign Integration
                </CardTitle>
                <CardDescription>Send and sign lease agreements electronically</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Connection Status:</span>
                  <Badge variant='outline'>
                    {dsConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                <div className='space-y-2 text-sm text-slate-600'>
                  <p>• Send lease agreements for electronic signature</p>
                  <p>• Track signing status and completion</p>
                  <p>• Legal compliance and audit trails</p>
                </div>
                <Button className='w-full' onClick={connectDocuSign} disabled={dsLoading}>
                  <PenTool className='h-4 w-4 mr-2' />
                  {dsConnected ? 'Verify Connection' : 'Connect DocuSign'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  TurboTax Integration
                </CardTitle>
                <CardDescription>Prepare tax data for easy filing</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Tax Year:</span>
                  <Badge variant='outline'>2024</Badge>
                </div>
                <div className='space-y-2 text-sm text-slate-600'>
                  <p>• Schedule E preparation</p>
                  <p>• Depreciation calculations</p>
                  <p>• Expense categorization</p>
                </div>
                <Button className='w-full' onClick={syncWithTurboTax}>
                  <FileText className='h-4 w-4 mr-2' />
                  Prepare Tax Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Record expenses for this period (maintenance, utilities, vacancy loss tracking, repairs, etc.).
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Category</label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='maintenance'>Maintenance</SelectItem>
                  <SelectItem value='platform_fees'>Platform fees</SelectItem>
                  <SelectItem value='vacancy_loss'>Vacancy loss</SelectItem>
                  <SelectItem value='owner_paid_utilities'>Owner-paid utilities</SelectItem>
                  <SelectItem value='one_time_repairs'>One-time repairs</SelectItem>
                  <SelectItem value='recurring_expenses'>Recurring expenses</SelectItem>
                  <SelectItem value='other'>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Amount</label>
              <Input
                type='number'
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder='0.00'
              />
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Incurred date</label>
              <Input
                type='date'
                value={expenseIncurredAt}
                onChange={(e) => setExpenseIncurredAt(e.target.value)}
              />
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Description (optional)</label>
              <Textarea
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder='e.g. HVAC service call'
              />
            </div>

            <div className='flex items-center justify-between gap-3 rounded-md border border-input px-3 py-2'>
              <div className='flex items-center gap-2 text-sm'>
                <span className='font-medium'>Recurring</span>
                <span className='text-slate-500'>Mark if this repeats monthly</span>
              </div>
              <input
                type='checkbox'
                checked={expenseIsRecurring}
                onChange={(e) => setExpenseIsRecurring(e.target.checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setExpenseDialogOpen(false)} disabled={expenseSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitExpense} disabled={expenseSubmitting}>
              {expenseSubmitting ? 'Saving…' : 'Save Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={benchmarkDialogOpen} onOpenChange={setBenchmarkDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Set Market Benchmark</DialogTitle>
            <DialogDescription>
              Store a market average rent for comparison (manual input is fine).
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Market average rent</label>
              <Input
                type='number'
                value={benchmarkAverageRent}
                onChange={(e) => setBenchmarkAverageRent(e.target.value)}
                placeholder='2150'
              />
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Effective date</label>
              <Input
                type='date'
                value={benchmarkEffectiveDate}
                onChange={(e) => setBenchmarkEffectiveDate(e.target.value)}
              />
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium'>ZIP (optional)</label>
              <Input value={benchmarkZip} onChange={(e) => setBenchmarkZip(e.target.value)} placeholder='89101' />
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium'>Source</label>
              <Input value={benchmarkSource} onChange={(e) => setBenchmarkSource(e.target.value)} placeholder='manual' />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setBenchmarkDialogOpen(false)} disabled={benchmarkSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitBenchmark} disabled={benchmarkSubmitting}>
              {benchmarkSubmitting ? 'Saving…' : 'Save Benchmark'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalyticsDashboard;
