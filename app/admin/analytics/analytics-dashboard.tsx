'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs/index';
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
  ArrowDownRight
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

  useEffect(() => {
    fetchAnalyticsData();
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
      const response = await fetch('/api/integrations/quickbooks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId })
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Successfully synced with QuickBooks!');
      } else {
        alert('Sync failed: ' + result.message);
      }
    } catch (error) {
      console.error('QuickBooks sync failed:', error);
      alert('QuickBooks sync failed');
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

  const profitMargin = data.totalRevenue > 0 ? ((data.netProfit / data.totalRevenue) * 100) : 0;

  return (
    <div className='space-y-6'>
      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Total Revenue</span>
            <DollarSign className='h-4 w-4 text-violet-200/80' />
          </div>
          <div>
            <div className='text-2xl font-semibold text-slate-50'>${data.totalRevenue.toLocaleString()}</div>
            <p className='text-xs text-slate-300/80 mt-1'>
              <TrendingUp className='inline h-3 w-3 mr-1' />
              +12.5% from last month
            </p>
          </div>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Net Profit</span>
            <TrendingUp className='h-4 w-4 text-violet-200/80' />
          </div>
          <div>
            <div className='text-2xl font-semibold text-slate-50'>${data.netProfit.toLocaleString()}</div>
            <p className='text-xs text-slate-300/80 mt-1'>
              <ArrowUpRight className='inline h-3 w-3 mr-1 text-green-400' />
              {profitMargin.toFixed(1)}% profit margin
            </p>
          </div>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Occupancy Rate</span>
            <Home className='h-4 w-4 text-violet-200/80' />
          </div>
          <div>
            <div className='text-2xl font-semibold text-slate-50'>{(100 - data.vacancyRate).toFixed(1)}%</div>
            <p className='text-xs text-slate-300/80 mt-1'>
              {data.occupiedUnits} of {data.totalUnits} units occupied
            </p>
          </div>
        </div>

        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4 flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-slate-300/90 uppercase tracking-wide'>Total Tenants</span>
            <Users className='h-4 w-4 text-violet-200/80' />
          </div>
          <div>
            <div className='text-2xl font-semibold text-slate-50'>{data.totalTenants}</div>
            <p className='text-xs text-slate-300/80 mt-1'>
              <ArrowUpRight className='inline h-3 w-3 mr-1 text-green-400' />
              +2 new this month
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <TabsList value={activeTab} onValueChange={setActiveTab} className='grid w-full sm:w-auto grid-cols-2 lg:grid-cols-5'>
            <TabsTrigger value={activeTab} onValueChange={setActiveTab} triggerValue='overview'>Overview</TabsTrigger>
            <TabsTrigger value={activeTab} onValueChange={setActiveTab} triggerValue='properties'>Properties</TabsTrigger>
            <TabsTrigger value={activeTab} onValueChange={setActiveTab} triggerValue='roi'>ROI Analysis</TabsTrigger>
            <TabsTrigger value={activeTab} onValueChange={setActiveTab} triggerValue='market'>Market</TabsTrigger>
            <TabsTrigger value={activeTab} onValueChange={setActiveTab} triggerValue='integrations'>Integrations</TabsTrigger>
          </TabsList>

          <div className='flex gap-2'>
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

        <TabsContent value='overview' contentValue='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>Monthly financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-80 flex items-center justify-center text-slate-500'>
                  <BarChart3 className='h-12 w-12 mr-2' />
                  Chart visualization coming soon
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss Summary</CardTitle>
                <CardDescription>Year-to-date financial overview</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex justify-between'>
                  <span>Total Revenue:</span>
                  <span className='font-semibold text-green-600'>+${data.totalRevenue.toLocaleString()}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Total Expenses:</span>
                  <span className='font-semibold text-red-600'>-${data.totalExpenses.toLocaleString()}</span>
                </div>
                <div className='border-t pt-4 flex justify-between'>
                  <span className='font-semibold'>Net Profit:</span>
                  <span className={`font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${data.netProfit.toLocaleString()}
                  </span>
                </div>
                <div className='flex justify-between text-sm text-slate-600'>
                  <span>Average Monthly Rent:</span>
                  <span>${data.averageRent.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='properties' contentValue='properties' className='space-y-6'>
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

        <TabsContent value='roi' contentValue='roi' className='space-y-6'>
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
                    <input type='number' className='w-full mt-1 p-2 border rounded' placeholder='100000' />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Annual Net Income</label>
                    <input type='number' className='w-full mt-1 p-2 border rounded' placeholder='12000' />
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

        <TabsContent value='market' contentValue='market' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Market Comparison</CardTitle>
              <CardDescription>Compare your properties to market averages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-blue-600'>$1,250</div>
                  <div className='text-sm text-slate-600'>Your Average Rent</div>
                  <div className='text-xs text-green-600 mt-1'>+5% vs market</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-green-600'>95%</div>
                  <div className='text-sm text-slate-600'>Your Occupancy</div>
                  <div className='text-xs text-green-600 mt-1'>+8% vs market</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-purple-600'>8.5%</div>
                  <div className='text-sm text-slate-600'>Your ROI</div>
                  <div className='text-xs text-green-600 mt-1'>+2% vs market</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='integrations' contentValue='integrations' className='space-y-6'>
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
                  <Badge variant='outline'>Not Connected</Badge>
                </div>
                <div className='space-y-2 text-sm text-slate-600'>
                  <p>• Sync rent payments and expenses</p>
                  <p>• Automatic categorization</p>
                  <p>• Real-time financial tracking</p>
                </div>
                <Button className='w-full' onClick={syncWithQuickBooks}>
                  <CreditCard className='h-4 w-4 mr-2' />
                  Connect QuickBooks
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
    </div>
  );
};

export default AnalyticsDashboard;
