'use client';
import { useState, useEffect } from 'react';
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
  DollarSign,
  Download,
  FileText,
  Building,
  Building2,
  Plus,
  Wrench,
  ShieldAlert,
  Percent,
  Activity,
  LineChart,
  Lock,
  Home,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useSubscriptionTier } from '@/hooks/use-subscription-tier';
import Link from 'next/link';

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
  const [qbLoading, setQbLoading] = useState<boolean>(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('maintenance');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseIncurredAt, setExpenseIncurredAt] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  const { isPro } = useSubscriptionTier(landlordId);

  useEffect(() => {
    fetchAnalyticsData();
  }, [landlordId]);

  useEffect(() => {
    fetchQuickBooksStatus();
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

  const fetchQuickBooksStatus = async () => {
    try {
      const res = await fetch(`/api/integrations/quickbooks/status?landlordId=${landlordId}`);
      const json = await res.json();
      if (json?.success) {
        setQbConnected(Boolean(json?.data?.connected));
      }
    } catch (e) {
      console.error('Failed to fetch QuickBooks status:', e);
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
        alert('QuickBooks sync successful!');
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
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='rounded-2xl bg-gradient-to-br from-violet-900/60 to-indigo-900/60 border border-violet-500/20 p-5 animate-pulse'>
              <div className='h-4 bg-white/10 rounded w-3/4 mb-3'></div>
              <div className='h-8 bg-white/10 rounded w-1/2'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='rounded-2xl bg-gradient-to-br from-violet-900/60 to-indigo-900/60 border border-violet-500/20 p-8 text-center'>
        <p className='text-violet-200'>Unable to load analytics data</p>
      </div>
    );
  }

  const formatMoney = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPct = (n: number) => `${n.toFixed(1)}%`;
  const healthColor = data.portfolioHealth.score >= 80 ? 'text-emerald-400' : data.portfolioHealth.score >= 65 ? 'text-amber-400' : 'text-rose-400';
  const trendIcon = data.portfolioHealth.trend === 'improving' ? <ArrowUpRight className='h-4 w-4 text-emerald-400' /> : data.portfolioHealth.trend === 'declining' ? <ArrowDownRight className='h-4 w-4 text-rose-400' /> : null;

  return (
    <div className='space-y-6'>
      {/* Integration Buttons */}
      <div className='flex flex-wrap gap-2 justify-end'>
        {isPro ? (
          <>
            <button
              onClick={syncWithQuickBooks}
              disabled={qbLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                qbConnected 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30' 
                  : 'bg-violet-600/80 text-white hover:bg-violet-500'
              }`}
            >
              <Building className='h-4 w-4' />
              {qbConnected ? 'QuickBooks ✓' : 'Connect QuickBooks'}
            </button>
            <button
              onClick={syncWithTurboTax}
              className='flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-600/80 text-white hover:bg-violet-500 transition-all'
            >
              <FileText className='h-4 w-4' />
              TurboTax Export
            </button>
          </>
        ) : (
          <Link href='/admin/settings/subscription' className='flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-violet-600/80 text-white hover:bg-violet-500 transition-all'>
            <Lock className='h-4 w-4' />
            Unlock Integrations
          </Link>
        )}
      </div>

      {/* Portfolio Overview Stats - Like Property Dashboard */}
      <div className='rounded-2xl bg-gradient-to-br from-violet-900/80 to-indigo-900/80 border border-violet-500/20 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-white'>Portfolio Overview</h2>
          <span className='text-xs text-violet-300 bg-violet-500/20 px-2 py-1 rounded-full'>Live</span>
        </div>
        
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {/* Rent Collected */}
          <div className='rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20 p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-xs text-cyan-200 uppercase tracking-wide'>Rent Collected</span>
              <DollarSign className='h-4 w-4 text-cyan-300' />
            </div>
            <div className='text-2xl font-bold text-white'>{formatMoney(data.rentCollectedThisMonth)}</div>
            <div className='text-xs text-cyan-200/70 mt-1'>of {formatMoney(data.rentPossibleThisMonth)} possible</div>
          </div>

          {/* Total Expenses */}
          <div className='rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-600/20 border border-rose-400/20 p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-xs text-rose-200 uppercase tracking-wide'>Expenses</span>
              <Wrench className='h-4 w-4 text-rose-300' />
            </div>
            <div className='text-2xl font-bold text-white'>{formatMoney(data.totalExpensesThisMonth)}</div>
            <div className='text-xs text-rose-200/70 mt-1'>{data.expensesRecordedThisMonth ? 'this month' : 'no expenses'}</div>
          </div>

          {/* Net Cash Flow */}
          <div className='rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-400/20 p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-xs text-emerald-200 uppercase tracking-wide'>Net Cash Flow</span>
              <LineChart className='h-4 w-4 text-emerald-300' />
            </div>
            <div className={`text-2xl font-bold ${data.netProfitThisMonth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.netProfitThisMonth >= 0 ? '' : '-'}{formatMoney(data.netProfitThisMonth)}
            </div>
            <div className='text-xs text-emerald-200/70 mt-1'>{formatPct(data.profitMarginThisMonth)} margin</div>
          </div>

          {/* Portfolio Health */}
          <div className='rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-400/20 p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-xs text-amber-200 uppercase tracking-wide'>Portfolio Health</span>
              <Activity className='h-4 w-4 text-amber-300' />
            </div>
            <div className={`text-2xl font-bold ${healthColor}`}>{data.portfolioHealth.score}/100</div>
            <div className='text-xs text-amber-200/70 mt-1 flex items-center gap-1'>
              {trendIcon} {data.portfolioHealth.trend}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
        <div className='rounded-xl bg-gradient-to-br from-violet-900/60 to-indigo-900/60 border border-violet-500/20 p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <Building2 className='h-4 w-4 text-violet-300' />
            <span className='text-xs text-violet-200 uppercase'>Properties</span>
          </div>
          <div className='text-xl font-bold text-white'>{data.totalProperties}</div>
        </div>
        <div className='rounded-xl bg-gradient-to-br from-violet-900/60 to-indigo-900/60 border border-violet-500/20 p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <Home className='h-4 w-4 text-violet-300' />
            <span className='text-xs text-violet-200 uppercase'>Units</span>
          </div>
          <div className='text-xl font-bold text-white'>{data.totalUnits}</div>
          <div className='text-xs text-violet-300'>{data.occupiedUnits} occupied</div>
        </div>
        <div className='rounded-xl bg-gradient-to-br from-violet-900/60 to-indigo-900/60 border border-violet-500/20 p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <Users className='h-4 w-4 text-violet-300' />
            <span className='text-xs text-violet-200 uppercase'>Tenants</span>
          </div>
          <div className='text-xl font-bold text-white'>{data.totalTenants}</div>
        </div>
        <div className='rounded-xl bg-gradient-to-br from-violet-900/60 to-indigo-900/60 border border-violet-500/20 p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <Percent className='h-4 w-4 text-violet-300' />
            <span className='text-xs text-violet-200 uppercase'>Occupancy</span>
          </div>
          <div className='text-xl font-bold text-white'>{formatPct(data.physicalOccupancy)}</div>
        </div>
        <div className='rounded-xl bg-gradient-to-br from-violet-900/60 to-indigo-900/60 border border-violet-500/20 p-4'>
          <div className='flex items-center gap-2 mb-2'>
            <DollarSign className='h-4 w-4 text-violet-300' />
            <span className='text-xs text-violet-200 uppercase'>Avg Rent</span>
          </div>
          <div className='text-xl font-bold text-white'>{formatMoney(data.averageRent)}</div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <TabsList className='bg-violet-900/50 border border-violet-500/20'>
            <TabsTrigger triggerValue='overview'>Overview</TabsTrigger>
            <TabsTrigger triggerValue='properties'>Properties</TabsTrigger>
            <TabsTrigger triggerValue='market'>Market</TabsTrigger>
          </TabsList>

          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' size='sm' onClick={() => setExpenseDialogOpen(true)} className='border-violet-500/30 text-violet-200 hover:bg-violet-500/20'>
              <Plus className='h-4 w-4 mr-1' /> Add Expense
            </Button>
            <Button variant='outline' size='sm' onClick={() => downloadReport('csv')} className='border-violet-500/30 text-violet-200 hover:bg-violet-500/20'>
              <Download className='h-4 w-4 mr-1' /> CSV
            </Button>
            <Button variant='outline' size='sm' onClick={() => downloadReport('excel')} className='border-violet-500/30 text-violet-200 hover:bg-violet-500/20'>
              <Download className='h-4 w-4 mr-1' /> Excel
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent contentValue='overview' className='space-y-6 mt-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Occupancy Card */}
            <div className='rounded-2xl bg-gradient-to-br from-violet-900/80 to-indigo-900/80 border border-violet-500/20 p-6'>
              <h3 className='text-lg font-semibold text-white mb-1'>Occupancy</h3>
              <p className='text-xs text-violet-300 mb-4'>Physical vs economic (this month)</p>
              
              <div className='grid grid-cols-2 gap-3 mb-4'>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Physical</div>
                  <div className='text-xl font-bold text-white'>{formatPct(data.physicalOccupancy)}</div>
                </div>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Economic</div>
                  <div className='text-xl font-bold text-white'>{formatPct(data.economicOccupancy)}</div>
                </div>
              </div>
              
              <div className='rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 flex items-center justify-between'>
                <div>
                  <div className='text-xs text-rose-300 uppercase'>Vacancy Loss (Month)</div>
                  <div className='text-xl font-bold text-rose-400'>-{formatMoney(data.vacancyLossThisMonth)}</div>
                </div>
                <ShieldAlert className='h-5 w-5 text-rose-400' />
              </div>
            </div>

            {/* Expenses Card */}
            <div className='rounded-2xl bg-gradient-to-br from-violet-900/80 to-indigo-900/80 border border-violet-500/20 p-6'>
              <h3 className='text-lg font-semibold text-white mb-1'>Expenses</h3>
              <p className='text-xs text-violet-300 mb-4'>Breakdown (this month)</p>
              
              {!data.expensesRecordedThisMonth ? (
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-4 text-sm text-violet-200'>
                  No expenses recorded this period
                </div>
              ) : (
                <div className='space-y-2 mb-4'>
                  {data.expenseBreakdownThisMonth.slice(0, 4).map((row) => (
                    <div key={row.category} className='flex items-center justify-between text-sm'>
                      <span className='text-violet-200 capitalize'>{row.category.replace(/_/g, ' ')}</span>
                      <span className='font-semibold text-white'>{formatMoney(row.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Maintenance</div>
                  <div className='text-lg font-bold text-white'>{formatMoney(data.maintenanceCostsThisMonth)}</div>
                </div>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Platform Fees</div>
                  <div className='text-lg font-bold text-white'>{formatMoney(data.platformFeesThisMonth)}</div>
                </div>
              </div>
            </div>

            {/* Tenant Quality Card */}
            <div className='rounded-2xl bg-gradient-to-br from-violet-900/80 to-indigo-900/80 border border-violet-500/20 p-6'>
              <h3 className='text-lg font-semibold text-white mb-1'>Tenant Quality</h3>
              <p className='text-xs text-violet-300 mb-4'>On-time & behavior signals</p>
              
              <div className='grid grid-cols-3 gap-2 mb-4'>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>On-time</div>
                  <div className='text-lg font-bold text-emerald-400'>{formatPct(data.tenantQuality.onTimePaymentPercent)}</div>
                </div>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Late Freq</div>
                  <div className='text-lg font-bold text-amber-400'>{formatPct(data.tenantQuality.latePaymentFrequency)}</div>
                </div>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Avg Days Late</div>
                  <div className='text-lg font-bold text-white'>{data.tenantQuality.avgDaysLate.toFixed(1)}</div>
                </div>
              </div>

              {data.tenantQuality.worstTenants.length > 0 && (
                <div className='rounded-lg bg-amber-500/10 border border-amber-500/30 p-3'>
                  <div className='text-xs text-amber-300 uppercase mb-2'>Needs Attention</div>
                  {data.tenantQuality.worstTenants.slice(0, 2).map((t) => (
                    <div key={t.tenantId} className='flex items-center justify-between text-xs text-violet-200'>
                      <span>Tenant ...{t.tenantId.slice(-6)}</span>
                      <span className='text-amber-400'>{formatPct(t.onTimePercent)} on-time</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Second Row - Maintenance & Vacancy */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Maintenance Analytics */}
            <div className='rounded-2xl bg-gradient-to-br from-violet-900/80 to-indigo-900/80 border border-violet-500/20 p-6'>
              <h3 className='text-lg font-semibold text-white mb-1'>Maintenance Analytics</h3>
              <p className='text-xs text-violet-300 mb-4'>Costs + speed + repeat issues</p>
              
              <div className='grid grid-cols-4 gap-2 mb-4'>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Cost/Unit</div>
                  <div className='text-lg font-bold text-white'>{formatMoney(data.maintenanceAnalytics.costPerUnit)}</div>
                </div>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Total Cost</div>
                  <div className='text-lg font-bold text-white'>{formatMoney(data.maintenanceAnalytics.totalCost)}</div>
                </div>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Avg Resolve</div>
                  <div className='text-lg font-bold text-white'>{data.maintenanceAnalytics.avgResolutionTimeDays.toFixed(1)}d</div>
                </div>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Emergency</div>
                  <div className='text-lg font-bold text-rose-400'>{formatPct(data.maintenanceAnalytics.emergencyRatio)}</div>
                </div>
              </div>

              {data.maintenanceAnalytics.repeatIssues.length > 0 && (
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase mb-2'>Repeat Issues</div>
                  {data.maintenanceAnalytics.repeatIssues.slice(0, 3).map((issue) => (
                    <div key={`${issue.unitId}-${issue.title}`} className='flex items-center justify-between text-xs text-violet-200'>
                      <span>Unit ...{issue.unitId.slice(-4)} • {issue.title}</span>
                      <span className='text-amber-400'>{issue.count}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vacancy Analytics */}
            <div className='rounded-2xl bg-gradient-to-br from-violet-900/80 to-indigo-900/80 border border-violet-500/20 p-6'>
              <h3 className='text-lg font-semibold text-white mb-1'>Vacancy Analytics</h3>
              <p className='text-xs text-violet-300 mb-4'>Days vacant + cost impact</p>
              
              <div className='grid grid-cols-2 gap-3 mb-4'>
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase'>Avg Days Vacant</div>
                  <div className='text-xl font-bold text-white'>{data.vacancyAnalytics.avgDaysVacant.toFixed(1)}</div>
                </div>
                <div className='rounded-lg bg-rose-500/10 border border-rose-500/30 p-3'>
                  <div className='text-xs text-rose-300 uppercase'>Vacancy Cost (YTD)</div>
                  <div className='text-xl font-bold text-rose-400'>-{formatMoney(data.vacancyAnalytics.vacancyCostYtd)}</div>
                </div>
              </div>

              {data.vacancyAnalytics.currentVacantUnits.length > 0 && (
                <div className='rounded-lg bg-violet-800/50 border border-violet-500/30 p-3'>
                  <div className='text-xs text-violet-300 uppercase mb-2'>Currently Vacant</div>
                  {data.vacancyAnalytics.currentVacantUnits.slice(0, 4).map((u) => (
                    <div key={u.unitId} className='flex items-center justify-between text-xs text-violet-200'>
                      <span>Unit ...{u.unitId.slice(-4)}</span>
                      <span className='text-amber-400'>{u.daysVacant} days</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>


        {/* Properties Tab */}
        <TabsContent contentValue='properties' className='space-y-6 mt-6'>
          <div className='rounded-2xl bg-gradient-to-br from-violet-900/80 to-indigo-900/80 border border-violet-500/20 p-6'>
            <h3 className='text-lg font-semibold text-white mb-4'>Property Performance</h3>
            
            <div className='space-y-4'>
              {data.propertyPerformance.map((property) => (
                <div key={property.id} className='rounded-xl bg-violet-800/50 border border-violet-500/30 p-4'>
                  <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center'>
                        <Building2 className='h-5 w-5 text-white' />
                      </div>
                      <div>
                        <h4 className='font-semibold text-white'>{property.name}</h4>
                        <p className='text-xs text-violet-300'>{property.units} units</p>
                      </div>
                    </div>
                    <Badge className={`${property.occupancyRate > 90 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                      {property.occupancyRate.toFixed(1)}% occupied
                    </Badge>
                  </div>
                  
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                    <div className='rounded-lg bg-violet-900/50 p-3'>
                      <div className='text-xs text-violet-300'>Revenue</div>
                      <div className='text-lg font-bold text-emerald-400'>{formatMoney(property.revenue)}</div>
                    </div>
                    <div className='rounded-lg bg-violet-900/50 p-3'>
                      <div className='text-xs text-violet-300'>Expenses</div>
                      <div className='text-lg font-bold text-rose-400'>{formatMoney(property.expenses)}</div>
                    </div>
                    <div className='rounded-lg bg-violet-900/50 p-3'>
                      <div className='text-xs text-violet-300'>Net</div>
                      <div className={`text-lg font-bold ${(property.revenue - property.expenses) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {(property.revenue - property.expenses) >= 0 ? '' : '-'}{formatMoney(Math.abs(property.revenue - property.expenses))}
                      </div>
                    </div>
                    <div className='rounded-lg bg-violet-900/50 p-3'>
                      <div className='text-xs text-violet-300'>ROI</div>
                      <div className='text-lg font-bold text-white'>
                        {property.revenue > 0 ? formatPct(((property.revenue - property.expenses) / property.revenue) * 100) : '0%'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {data.propertyPerformance.length === 0 && (
                <div className='text-center py-8 text-violet-300'>
                  No properties found. Add properties to see performance data.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Market Tab */}
        <TabsContent contentValue='market' className='space-y-6 mt-6'>
          <div className='rounded-2xl bg-gradient-to-br from-violet-900/80 to-indigo-900/80 border border-violet-500/20 p-6'>
            <h3 className='text-lg font-semibold text-white mb-4'>Market Comparison</h3>
            
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='text-center rounded-xl bg-violet-800/50 border border-violet-500/30 p-6'>
                <div className='text-3xl font-bold text-cyan-400'>{formatMoney(data.averageRent)}</div>
                <div className='text-sm text-violet-300 mt-1'>Your Avg Rent</div>
                {data.marketComparison.marketAverageRent != null && data.marketComparison.delta != null ? (
                  <div className={`text-xs mt-2 flex items-center justify-center gap-1 ${data.marketComparison.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.marketComparison.delta >= 0 ? <ArrowUpRight className='h-3 w-3' /> : <ArrowDownRight className='h-3 w-3' />}
                    {formatMoney(Math.abs(data.marketComparison.delta))} vs market
                  </div>
                ) : (
                  <div className='text-xs text-violet-400 mt-2'>Set a market benchmark to compare</div>
                )}
              </div>
              
              <div className='text-center rounded-xl bg-violet-800/50 border border-violet-500/30 p-6'>
                <div className='text-3xl font-bold text-emerald-400'>{formatPct(data.physicalOccupancy)}</div>
                <div className='text-sm text-violet-300 mt-1'>Physical Occupancy</div>
                <div className='text-xs text-violet-400 mt-2'>Economic: {formatPct(data.economicOccupancy)}</div>
              </div>
              
              <div className='text-center rounded-xl bg-violet-800/50 border border-violet-500/30 p-6'>
                <div className={`text-3xl font-bold ${healthColor}`}>{data.portfolioHealth.score}</div>
                <div className='text-sm text-violet-300 mt-1'>Portfolio Health</div>
                <div className='text-xs text-violet-400 mt-2 flex items-center justify-center gap-1'>
                  {trendIcon} Trend: {data.portfolioHealth.trend}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className='sm:max-w-lg bg-slate-900 border-violet-500/30'>
          <DialogHeader>
            <DialogTitle className='text-white'>Add Expense</DialogTitle>
            <DialogDescription className='text-violet-300'>
              Record expenses for this period (maintenance, utilities, vacancy loss tracking, repairs, etc.).
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <label className='text-sm font-medium text-violet-200'>Category</label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger className='bg-violet-800/50 border-violet-500/30 text-white'>
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
              <label className='text-sm font-medium text-violet-200'>Amount</label>
              <Input
                type='number'
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder='0.00'
                className='bg-violet-800/50 border-violet-500/30 text-white'
              />
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium text-violet-200'>Incurred date</label>
              <Input
                type='date'
                value={expenseIncurredAt}
                onChange={(e) => setExpenseIncurredAt(e.target.value)}
                className='bg-violet-800/50 border-violet-500/30 text-white'
              />
            </div>

            <div className='grid gap-2'>
              <label className='text-sm font-medium text-violet-200'>Description (optional)</label>
              <Textarea
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder='e.g. HVAC service call'
                className='bg-violet-800/50 border-violet-500/30 text-white'
              />
            </div>

            <div className='flex items-center justify-between gap-3 rounded-md border border-violet-500/30 px-3 py-2'>
              <div className='flex items-center gap-2 text-sm'>
                <span className='font-medium text-violet-200'>Recurring</span>
                <span className='text-violet-400'>Mark if this repeats monthly</span>
              </div>
              <input
                type='checkbox'
                checked={expenseIsRecurring}
                onChange={(e) => setExpenseIsRecurring(e.target.checked)}
                className='accent-violet-500'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setExpenseDialogOpen(false)} disabled={expenseSubmitting} className='border-violet-500/30 text-violet-200'>
              Cancel
            </Button>
            <Button onClick={submitExpense} disabled={expenseSubmitting} className='bg-violet-600 hover:bg-violet-500'>
              {expenseSubmitting ? 'Saving…' : 'Save Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AnalyticsDashboard;
