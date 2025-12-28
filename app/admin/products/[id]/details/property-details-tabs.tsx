'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Building2, Users, FileText, Wrench, DollarSign, Download, 
  ChevronRight, Phone, Mail, Calendar, AlertCircle,
  Clock, Home, FileSignature, BarChart3, X, Bell, Plus, Receipt, TrendingUp,
  FileSpreadsheet, Loader2, PieChart, MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PropertyZillowData } from '@/components/admin/property-zillow-data';
import CashoutDialog from '@/components/admin/cashout-dialog';
import { ArrowDownToLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedTenantCard } from '@/components/admin/enhanced-tenant-card';
import { VacantUnitCard } from '@/components/admin/vacant-unit-card';
import { PastTenantsTab } from '@/components/admin/past-tenants-tab';
import { History } from 'lucide-react';
import TenantComms from '@/components/admin/tenant-comms';

interface CashoutInfo {
  canCashOut: boolean;
  availableBalance: number;
  hasBankAccount: boolean;
  bankAccount: {
    last4: string;
    bankName: string | null;
    isVerified: boolean;
  } | null;
  defaultBankLast4: string | null;
}

interface PropertyDetailsTabsProps {
  property: any;
  rentPayments: any[];
  landlordId: string;
  isPro?: boolean;
  cashoutInfo?: CashoutInfo;
  tenants?: Array<{
    id: string;
    name: string;
    email: string;
    unitName?: string;
    propertyName?: string;
  }>;
}

export function PropertyDetailsTabs({ property, rentPayments, landlordId, isPro = false, cashoutInfo, tenants = [] }: PropertyDetailsTabsProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Calculate active leases first to determine initial expanded state
  const allLeases = property.units.flatMap((u: any) => 
    u.leases.map((l: any) => ({ ...l, unitName: l.unitName || u.name }))
  );
  const activeLeases = allLeases.filter((l: any) => 
    l.status === 'active' || l.status === 'pending' || l.status === 'pending_signature'
  );
  
  // Auto-expand if only one tenant
  const [selectedTenant, setSelectedTenant] = useState<string | null>(
    activeLeases.length === 1 ? activeLeases[0].id : null
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [viewingLease, setViewingLease] = useState<any | null>(null);
  const [showCashoutDialog, setShowCashoutDialog] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [showInvestorReport, setShowInvestorReport] = useState(false);
  const [investorReportData, setInvestorReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Expense dialog state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('maintenance');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseIncurredAt, setExpenseIncurredAt] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  // Refresh handler for tenant lifecycle actions
  const handleTenantRefresh = () => {
    router.refresh();
  };

  // Export handlers
  const handleExportCSV = async () => {
    setExportingCsv(true);
    try {
      const params = new URLSearchParams({
        propertyId: property.id,
        year: selectedYear.toString(),
        period: selectedQuarter ? 'quarterly' : 'yearly',
        format: 'csv',
      });
      if (selectedQuarter) params.append('quarter', selectedQuarter.toString());

      const res = await fetch(`/api/reports/financial?${params}`);
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${selectedYear}${selectedQuarter ? `-Q${selectedQuarter}` : ''}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: 'CSV exported successfully' });
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      // First get the investor report data
      const params = new URLSearchParams({
        propertyId: property.id,
        year: selectedYear.toString(),
        period: selectedQuarter ? 'quarterly' : 'yearly',
      });
      if (selectedQuarter) params.append('quarter', selectedQuarter.toString());

      const dataRes = await fetch(`/api/reports/investor?${params}`);
      if (!dataRes.ok) throw new Error('Failed to get report data');
      const reportData = await dataRes.json();

      // Then generate PDF
      const pdfRes = await fetch('/api/reports/investor/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData, format: 'pdf' }),
      });

      if (!pdfRes.ok) throw new Error('PDF generation failed');
      
      const blob = await pdfRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `investor-report-${selectedYear}${selectedQuarter ? `-Q${selectedQuarter}` : ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: 'PDF exported successfully' });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleViewInvestorReport = async (period: 'quarterly' | 'yearly', quarter?: number) => {
    setLoadingReport(true);
    try {
      const params = new URLSearchParams({
        propertyId: property.id,
        year: selectedYear.toString(),
        period,
      });
      if (quarter) params.append('quarter', quarter.toString());

      const res = await fetch(`/api/reports/investor?${params}`);
      if (!res.ok) throw new Error('Failed to load report');
      
      const data = await res.json();
      setInvestorReportData(data);
      setShowInvestorReport(true);
    } catch (error) {
      toast({ title: 'Failed to load report', variant: 'destructive' });
    } finally {
      setLoadingReport(false);
    }
  };

  // Aggregate data
  const allTickets = property.units.flatMap((u: any) => u.tickets);
  const openTickets = allTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress');
  
  // allLeases and activeLeases are calculated at the top of the component
  const pastLeases = allLeases.filter((l: any) => l.status === 'ended' || l.status === 'terminated');

  // Calculate financial summary
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];

  // Get units with active leases for invoice creation
  const unitsWithTenants = property.units.filter((unit: any) => 
    unit.leases?.some((lease: any) => lease.status === 'active')
  );

  const handleCreateInvoice = (unitId: string) => {
    router.push(`/admin/invoices?unitId=${unitId}&propertyId=${property.id}`);
  };

  const submitExpense = async () => {
    try {
      setExpenseSubmitting(true);

      const payload = {
        landlordId,
        propertyId: property.id,
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
      // Refresh the page to show new expense
      window.location.reload();
    } catch (e) {
      console.error('Failed to add expense:', e);
      alert('Failed to add expense');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  return (
    <main className="w-full px-4 py-8 md:px-0">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-black text-2xl font-bold">Property Management</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{property.name}</h1>
            <p className="text-black text-sm">
              {property.type} • {property.address && typeof property.address === 'object'
                ? `${(property.address as any).street ?? ''} ${(property.address as any).city ?? ''}`.trim()
                : ''}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Create Invoice Button */}
            {property.units.length === 1 ? (
              <Button 
                variant="outline" 
                className="border-white/10 text-white text-xs sm:text-sm"
                onClick={() => handleCreateInvoice(property.units[0].id)}
              >
                <Receipt className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline text-white">Create</span> Invoice
              </Button>
            ) : property.units.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-white/10 text-green text-xs sm:text-sm">
                    <Receipt className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline text-white">Create Invoice</span> 
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {property.units.map((unit: any) => {
                    const activeLease = unit.leases?.find((l: any) => l.status === 'active');
                    const tenantName = activeLease?.tenant?.name;
                    return (
                      <DropdownMenuItem 
                        key={unit.id}
                        onClick={() => handleCreateInvoice(unit.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{unit.name}</span>
                          {tenantName && (
                            <span className="text-xs text-muted-foreground">{tenantName}</span>
                          )}
                          {!activeLease && (
                            <span className="text-xs text-amber-500">No active tenant</span>
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            
            {/* Cash Out Button - only show if property has bank account */}
            {cashoutInfo?.canCashOut && cashoutInfo.hasBankAccount && (
              <Button 
                variant="outline" 
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs sm:text-sm"
                onClick={() => setShowCashoutDialog(true)}
              >
                <ArrowDownToLine className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Cash Out</span>
              </Button>
            )}
            
            <Button variant="outline" className="border-white/10 text-white text-xs sm:text-sm" onClick={() => setExpenseDialogOpen(true)}>
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add</span> Expense
            </Button>
            <Button asChild variant="outline" className="border-white/10 text-white text-xs sm:text-sm">
              <Link href={`/admin/products/${property.id}`}>
                <span className="hidden sm:inline ">Edit Property</span>
                <span className="sm:hidden">Edit</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full flex flex-wrap gap-1 bg-gradient-to-r from-indigo-700 to-indigo-900 border border-white/10 p-1 rounded-xl h-auto text-white">
            <TabsTrigger value="overview" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm sm:px-4">
              <Building2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline text-white">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="communications" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm sm:px-4 text-white">
              <MessageCircle className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline text-white font-bold">Communications</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm sm:px-4 text-white">
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline text-white font-bold">Tenants</span>
              {activeLeases.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs">{activeLeases.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="financials" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm sm:px-4 text-white">
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline text-white font-bold">Financials</span>
            </TabsTrigger>
            <TabsTrigger value="past-tenants" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-3 py-2 text-xs sm:text-sm sm:px-4 text-white">
              <History className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline text-white font-bold">Past Tenants</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Quick Stats - Gradient Cards */}
            <div className="relative rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 bg-blue-700" />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Property Overview</h3>
                  <span className="text-xs text-violet-200/80 bg-white/5 px-2 py-1 rounded-full ring-1 ring-white/10">Live</span>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm shadow-2xl drop-shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-black">Total Units</div>
                      <Home className="h-4 w-4 text-white/90" />
                    </div>
                    <div className="text-2xl font-bold text-white">{property.units.length}</div>
                    <div className="text-[10px] text-white/80">{property.units.filter((u: any) => u.isAvailable).length} available</div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm shadow-2xl drop-shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-black">Occupied</div>
                      <Users className="h-4 w-4 text-white/90" />
                    </div>
                    <div className="text-2xl font-bold text-white">{property.units.filter((u: any) => !u.isAvailable).length}</div>
                    <div className="text-[10px] text-emerald-100">
                      {Math.round((property.units.filter((u: any) => !u.isAvailable).length / property.units.length) * 100)}% occupancy
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm shadow-2xl drop-shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-black">Open Tickets</div>
                      <Wrench className="h-4 w-4 text-white/90" />
                    </div>
                    <div className="text-2xl font-bold text-white">{openTickets.length}</div>
                    <div className="text-[10px] text-red-100">{allTickets.length} total</div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm shadow-2xl drop-shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-black">Monthly Revenue</div>
                      <DollarSign className="h-4 w-4 text-white/90" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(activeLeases.reduce((sum: number, l: any) => sum + l.rentAmount, 0))}
                    </div>
                    <div className="text-[10px] text-emerald-100">{activeLeases.length} active leases</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 ">
              {/* Units Overview */}
              <Card className="border-white/10 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Units
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.units.map((unit: any) => (
                    <div key={unit.id} className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border border-white/10 p-4 space-y-2 backdrop-blur-sm shadow-2xl drop-shadow-2xl text-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-black font-semibold">{unit.name}</span>
                        <Badge variant="outline" className={unit.isAvailable ? 'border-emerald-400/40 text-black' : 'border-green-400/40 text-black'}>
                          {unit.isAvailable ? 'Available' : 'Occupied'}
                        </Badge>
                      </div>
                      <p className="text-xs text-black font-semibold">
                        {unit.type} • {unit.bedrooms ?? '—'} bd • {unit.bathrooms ?? '—'} ba • {formatCurrency(unit.rentAmount)}/mo
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Maintenance Tickets */}
              <Card className="border-white/10 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      Maintenance Tickets
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {openTickets.length} open, {allTickets.length} total
                    </CardDescription>
                  </div>
                  <Link href="/admin/maintenance">
                    <Button variant="outline" size="sm" className="border-white/10 text-white">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allTickets.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No maintenance tickets</p>
                  ) : (
                    allTickets.slice(0, 5).map((ticket: any) => (
                      <Link 
                        key={ticket.id} 
                        href={`/admin/maintenance/${ticket.id}`}
                        className="block rounded-lg border border-white/10 bg-slate-800/60 p-4 hover:border-violet-400/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{ticket.title}</p>
                            <p className="text-xs text-slate-400 truncate">{ticket.description}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {ticket.tenant?.name} • {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge status={ticket.status} />
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* COMMUNICATIONS TAB */}
          <TabsContent value="communications" className="mt-6">
            <div className="space-y-6">
              {/* Communications Header */}
              <Card className="border-white/10 bg-gradient-to-r from-indigo-700 to-indigo-900">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Property Communications
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Message tenants at {property.name} directly from here
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Tenant Communications Component */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-700 to-indigo-900 backdrop-blur-xl shadow-2xl overflow-hidden">
                <TenantComms 
                  tenants={tenants.length > 0 ? tenants : activeLeases.map((lease: any) => ({
                    id: lease.tenant?.id || '',
                    name: lease.tenant?.name || 'Unknown Tenant',
                    email: lease.tenant?.email || '',
                    unitName: lease.unitName,
                    propertyName: property.name,
                  })).filter((t: any) => t.id)}
                  landlordId={landlordId}
                  hideHeader
                />
              </div>
            </div>
          </TabsContent>

          {/* TENANTS TAB */}
          <TabsContent value="tenants" className="mt-6 space-y-6">
            {/* Current Tenants */}
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Current Tenants
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {activeLeases.length} active lease{activeLeases.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeLeases.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No active tenants</p>
                ) : (
                  <div className="space-y-4">
                    {activeLeases.map((lease: any) => (
                      <EnhancedTenantCard 
                        key={lease.id} 
                        lease={lease} 
                        isExpanded={selectedTenant === lease.id}
                        onToggle={() => setSelectedTenant(selectedTenant === lease.id ? null : lease.id)}
                        propertyId={property.id}
                        onViewLease={() => setViewingLease(lease)}
                        onRefresh={handleTenantRefresh}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Tenants */}
            {pastLeases.length > 0 && (
              <Card className="border-white/10 bg-slate-900/60">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Past Tenants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pastLeases.map((lease: any) => (
                      <div key={lease.id} className="rounded-lg border border-white/10 bg-slate-800/40 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-300">{lease.tenant?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">
                              Unit {lease.unitName} • {new Date(lease.startDate).toLocaleDateString()} - {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-slate-500/40 text-slate-400">
                            {lease.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* FINANCIALS TAB */}
          <TabsContent value="financials" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
              {/* Year & Quarter Selector */}
              <div className="space-y-4">
                <Card className="border-white/10 bg-slate-900/60 h-fit">
                  <CardHeader className="pb-2 lg:pb-4">
                    <CardTitle className="text-white text-lg">Tax Years</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 lg:p-4">
                    <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:overflow-visible">
                      {years.map(year => (
                        <button
                          key={year}
                          onClick={() => { setSelectedYear(year); setSelectedQuarter(null); }}
                          className={`flex-shrink-0 text-left px-4 py-2 lg:py-3 rounded-lg transition-colors ${
                            selectedYear === year && !selectedQuarter
                              ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 text-white' 
                              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{year}</span>
                            <ChevronRight className="w-4 h-4 hidden lg:block" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quarterly Reports */}
                <Card className="border-white/10 bg-slate-900/60 h-fit">
                  <CardHeader className="pb-2 lg:pb-4">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <PieChart className="w-4 h-4" />
                      Quarterly
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 lg:p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                      {[1, 2, 3, 4].map(q => (
                        <button
                          key={q}
                          onClick={() => setSelectedQuarter(q)}
                          className={`text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                            selectedQuarter === q
                              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white' 
                              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          Q{q} {selectedYear}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Investor Reports */}
                <Card className="border-violet-500/30 bg-gradient-to-br from-violet-900/40 to-purple-900/40 h-fit">
                  <CardHeader className="pb-2 lg:pb-4">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-violet-400" />
                      Investor Reports
                    </CardTitle>
                    <CardDescription className="text-violet-200/70 text-xs">
                      Professional reports with charts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 lg:p-4 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-violet-400/30 text-violet-200 hover:bg-violet-500/20 justify-start"
                      onClick={() => handleViewInvestorReport('yearly')}
                      disabled={loadingReport}
                    >
                      {loadingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      {selectedYear} Annual Report
                    </Button>
                    {selectedQuarter && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-violet-400/30 text-violet-200 hover:bg-violet-500/20 justify-start"
                        onClick={() => handleViewInvestorReport('quarterly', selectedQuarter)}
                        disabled={loadingReport}
                      >
                        {loadingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                        Q{selectedQuarter} {selectedYear} Report
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Financial Summary */}
              <div className="space-y-6">
                <Card className="border-white/10 bg-slate-900/60">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-white">
                        {selectedQuarter ? `Q${selectedQuarter} ` : ''}{selectedYear} Financial Summary
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Income and expenses for {selectedQuarter ? 'quarterly' : 'tax'} reporting
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="border-white/10 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 text-white hover:opacity-90 text-xs sm:text-sm">
                            {exportingPdf || exportingCsv ? (
                              <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 sm:mr-2" />
                            )}
                            <span className="hidden sm:inline">Export</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-white">
                          <DropdownMenuItem onClick={handleExportPDF} disabled={exportingPdf} className="cursor-pointer text-white hover:bg-slate-800 focus:bg-slate-800 focus:text-white">
                            <FileText className="w-4 h-4 mr-2" />
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleExportCSV} disabled={exportingCsv} className="cursor-pointer text-white hover:bg-slate-800 focus:bg-slate-800 focus:text-white">
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export as CSV
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem 
                            onClick={() => handleViewInvestorReport(selectedQuarter ? 'quarterly' : 'yearly', selectedQuarter || undefined)} 
                            disabled={loadingReport}
                            className="cursor-pointer text-white hover:bg-slate-800 focus:bg-slate-800 focus:text-white"
                          >
                            <PieChart className="w-4 h-4 mr-2" />
                            View Investor Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FinancialSummary 
                      year={selectedYear} 
                      quarter={selectedQuarter}
                      rentPayments={rentPayments} 
                      expenses={property.expenses}
                    />
                  </CardContent>
                </Card>

                {/* Monthly Breakdown */}
                <Card className="border-white/10 bg-slate-900/60">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Monthly Breakdown - {selectedQuarter ? `Q${selectedQuarter} ` : ''}{selectedYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MonthlyBreakdown 
                      year={selectedYear}
                      quarter={selectedQuarter}
                      rentPayments={rentPayments}
                      expenses={property.expenses}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* PAST TENANTS TAB */}
          <TabsContent value="past-tenants" className="mt-6">
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Past Tenants
                </CardTitle>
                <CardDescription className="text-slate-400">
                  History of previous tenants at this property
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PastTenantsTab propertyId={property.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Investor Report Modal */}
      {showInvestorReport && investorReportData && (
        <InvestorReportModal
          data={investorReportData}
          onClose={() => { setShowInvestorReport(false); setInvestorReportData(null); }}
          onExportPdf={handleExportPDF}
          onExportCsv={handleExportCSV}
          exportingPdf={exportingPdf}
          exportingCsv={exportingCsv}
        />
      )}

      {/* Lease Viewer Modal */}
      {viewingLease && (
        <LeaseViewerModal 
          lease={viewingLease} 
          onClose={() => setViewingLease(null)} 
        />
      )}

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Record an expense for {property.name}
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

      {/* Cashout Dialog */}
      {cashoutInfo && (
        <CashoutDialog
          open={showCashoutDialog}
          onOpenChange={setShowCashoutDialog}
          availableBalance={cashoutInfo.availableBalance}
          properties={[{
            id: property.id,
            name: property.name,
            hasBankAccount: cashoutInfo.hasBankAccount,
            bankAccount: cashoutInfo.bankAccount,
          }]}
          preselectedPropertyId={property.id}
          defaultBankLast4={cashoutInfo.defaultBankLast4}
          onSuccess={() => window.location.reload()}
        />
      )}
    </main>
  );
}


// Helper Components
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    in_progress: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    pending: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    paid: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    overdue: 'bg-red-500/20 text-red-300 border-red-400/30',
  };

  return (
    <Badge variant="outline" className={styles[status] || 'border-slate-400/30 text-slate-300'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}


function LeaseViewerModal({ lease, onClose }: { lease: any; onClose: () => void }) {
  const tenantSignature = lease.signatureRequests?.find((sr: any) => sr.role === 'tenant');
  const landlordSignature = lease.signatureRequests?.find((sr: any) => sr.role === 'landlord');
  
  const tenantSigned = tenantSignature?.status === 'signed';
  const landlordSigned = landlordSignature?.status === 'signed';
  const awaitingLandlordSignature = tenantSigned && !landlordSigned;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-slate-900">
          <div>
            <h2 className="text-xl font-semibold text-white">Lease Document</h2>
            <p className="text-sm text-slate-400">
              {lease.propertyName || 'Property'} • Unit {lease.unitName}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Signature Alert */}
          {awaitingLandlordSignature && (
            <div className="rounded-xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <Bell className="h-6 w-6 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2 text-lg">
                    Lease Requires Your Signature
                  </h3>
                  <p className="text-sm text-slate-200 mb-4">
                    {lease.tenant?.name || 'The tenant'} signed this lease
                    {tenantSignature?.signedAt ? ` on ${new Date(tenantSignature.signedAt).toLocaleDateString()}` : ''}.
                    Please review and sign to complete the agreement.
                  </p>
                  <Link href={`/admin/leases/${lease.id}`}>
                    <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90">
                      <FileSignature className="w-4 h-4 mr-2" />
                      Sign Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Lease Details */}
          <div className="rounded-xl border border-white/10 bg-slate-800/60 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Property</p>
                <p className="text-sm text-slate-100">
                  {lease.propertyName || 'Property'} • Unit {lease.unitName}
                </p>
                <p className="text-xs text-slate-400">{lease.unitType}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {tenantSigned && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/50">
                    Tenant Signed
                  </Badge>
                )}
                {landlordSigned && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/50">
                    Landlord Signed
                  </Badge>
                )}
                {!tenantSigned && !landlordSigned && (
                  <Badge className="bg-slate-500/20 text-slate-300 border-slate-400/50">
                    Pending Signatures
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tenant</p>
                <p className="text-slate-100">{lease.tenant?.name || 'Tenant'}</p>
                {lease.tenant?.email && <p className="text-xs text-slate-400">{lease.tenant.email}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Lease Dates</p>
                <p className="text-slate-100">
                  {new Date(lease.startDate).toLocaleDateString()} –{' '}
                  {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Ongoing'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Monthly Rent</p>
                <p className="text-slate-100">{formatCurrency(lease.rentAmount)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Billing Day</p>
                <p className="text-slate-100">Day {lease.billingDayOfMonth || 1} of each month</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</p>
                <Badge variant="outline" className={
                  lease.status === 'active' 
                    ? 'border-emerald-400/40 text-emerald-200' 
                    : 'border-amber-400/40 text-amber-200'
                }>
                  {lease.status}
                </Badge>
              </div>
            </div>

            {/* Signature History */}
            {(tenantSigned || landlordSigned) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Signature History</p>
                {tenantSigned && tenantSignature?.signedAt && (
                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-100">Tenant:</strong> Signed on {new Date(tenantSignature.signedAt).toLocaleString()}
                  </p>
                )}
                {landlordSigned && landlordSignature?.signedAt && (
                  <p className="text-xs text-slate-300">
                    <strong className="text-slate-100">Landlord:</strong> Signed on {new Date(landlordSignature.signedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-white/10 text-xs text-slate-400 leading-relaxed space-y-2">
              <p>
                This is a lease summary generated by the system. Use this together with your signed lease documents and any state-specific addenda.
              </p>
              <p>
                Landlord and tenant agree to the terms of the full lease agreement, including rent amount, due dates,
                late fees, house rules, and all attached addenda.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} className="border-white/10 text-black">
              Close
            </Button>
            <Link href={`/admin/leases/${lease.id}`}>
              <Button className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 text-white hover:opacity-90">
                <FileSignature className="w-4 h-4 mr-2" />
                Open Full Lease Page
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


// Financial Summary Component
function FinancialSummary({ 
  year,
  quarter,
  rentPayments, 
  expenses 
}: { 
  year: number;
  quarter?: number | null;
  rentPayments: any[]; 
  expenses: any[];
}) {
  // Filter by year and optionally by quarter
  const filterByPeriod = (date: Date) => {
    if (date.getFullYear() !== year) return false;
    if (quarter) {
      const month = date.getMonth();
      const quarterStart = (quarter - 1) * 3;
      const quarterEnd = quarterStart + 2;
      return month >= quarterStart && month <= quarterEnd;
    }
    return true;
  };

  const periodPayments = rentPayments.filter(p => filterByPeriod(new Date(p.dueDate)));
  const periodExpenses = expenses.filter((e: any) => filterByPeriod(new Date(e.incurredAt || e.date || e.createdAt)));
  
  const totalIncome = periodPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  const totalExpenses = periodExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const netIncome = totalIncome - totalExpenses;

  // Group expenses by category
  const expensesByCategory = periodExpenses.reduce((acc: Record<string, number>, e: any) => {
    const cat = e.category || 'other';
    acc[cat] = (acc[cat] || 0) + Number(e.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-4">
          <p className="text-xs text-emerald-100 uppercase tracking-wide">Total Income</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-emerald-100">{periodPayments.filter(p => p.status === 'paid').length} payments received</p>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-500 p-4">
          <p className="text-xs text-red-100 uppercase tracking-wide">Total Expenses</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-red-100">{periodExpenses.length} expenses recorded</p>
        </div>
        <div className={`rounded-xl p-4 ${netIncome >= 0 ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-gradient-to-r from-amber-600 to-orange-500'}`}>
          <p className="text-xs text-white/80 uppercase tracking-wide">Net Income</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(netIncome)}</p>
          <p className="text-xs text-white/80">{netIncome >= 0 ? 'Profit' : 'Loss'}</p>
        </div>
      </div>

      {/* Expense Breakdown */}
      {Object.keys(expensesByCategory).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-slate-800/60 p-4">
          <h4 className="text-sm font-medium text-white mb-3">Expense Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(expensesByCategory).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-slate-300 capitalize">{category.replace(/_/g, ' ')}</span>
                <span className="text-sm font-medium text-white">{formatCurrency(amount as number)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Monthly Breakdown Component
function MonthlyBreakdown({ 
  year,
  quarter,
  rentPayments, 
  expenses 
}: { 
  year: number;
  quarter?: number | null;
  rentPayments: any[]; 
  expenses: any[];
}) {
  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter months based on quarter
  const startMonth = quarter ? (quarter - 1) * 3 : 0;
  const endMonth = quarter ? startMonth + 2 : 11;
  const months = allMonths.slice(startMonth, endMonth + 1);

  const monthlyData = months.map((month, idx) => {
    const index = startMonth + idx;
    const monthPayments = rentPayments.filter(p => {
      const date = new Date(p.dueDate);
      return date.getFullYear() === year && date.getMonth() === index;
    });
    
    const monthExpenses = expenses.filter((e: any) => {
      const date = new Date(e.incurredAt || e.date || e.createdAt);
      return date.getFullYear() === year && date.getMonth() === index;
    });

    const income = monthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const expenseTotal = monthExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    return {
      month,
      income,
      expenses: expenseTotal,
      net: income - expenseTotal,
      paymentCount: monthPayments.filter(p => p.status === 'paid').length,
    };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-2 text-slate-400 font-medium">Month</th>
            <th className="text-right py-3 px-2 text-slate-400 font-medium">Income</th>
            <th className="text-right py-3 px-2 text-slate-400 font-medium">Expenses</th>
            <th className="text-right py-3 px-2 text-slate-400 font-medium">Net</th>
          </tr>
        </thead>
        <tbody>
          {monthlyData.map((data) => (
            <tr key={data.month} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-3 px-2 text-white">{data.month}</td>
              <td className="py-3 px-2 text-right text-emerald-400">
                {data.income > 0 ? formatCurrency(data.income) : '—'}
              </td>
              <td className="py-3 px-2 text-right text-red-400">
                {data.expenses > 0 ? formatCurrency(data.expenses) : '—'}
              </td>
              <td className={`py-3 px-2 text-right font-medium ${data.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.income > 0 || data.expenses > 0 ? formatCurrency(data.net) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/20">
            <td className="py-3 px-2 text-white font-semibold">Total</td>
            <td className="py-3 px-2 text-right text-emerald-400 font-semibold">
              {formatCurrency(monthlyData.reduce((sum, d) => sum + d.income, 0))}
            </td>
            <td className="py-3 px-2 text-right text-red-400 font-semibold">
              {formatCurrency(monthlyData.reduce((sum, d) => sum + d.expenses, 0))}
            </td>
            <td className={`py-3 px-2 text-right font-semibold ${
              monthlyData.reduce((sum, d) => sum + d.net, 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {formatCurrency(monthlyData.reduce((sum, d) => sum + d.net, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}


// Investor Report Modal Component
function InvestorReportModal({ 
  data, 
  onClose, 
  onExportPdf, 
  onExportCsv,
  exportingPdf,
  exportingCsv
}: { 
  data: any; 
  onClose: () => void;
  onExportPdf: () => void;
  onExportCsv: () => void;
  exportingPdf: boolean;
  exportingCsv: boolean;
}) {
  const { executiveSummary, portfolio, propertyPerformance, charts, collectionSummary, leaseSummary } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-500/30 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-violet-900 to-purple-900">
          <div>
            <h2 className="text-2xl font-bold text-white">Investor Report</h2>
            <p className="text-sm text-violet-200">{data.periodLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              disabled={exportingCsv}
              className="border-violet-400/30 text-violet-200 hover:bg-violet-500/20"
            >
              {exportingCsv ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
              CSV
            </Button>
            <Button
              onClick={onExportPdf}
              disabled={exportingPdf}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90"
            >
              {exportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Download PDF
            </Button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Executive Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-5">
              <p className="text-xs text-emerald-100 uppercase tracking-wide mb-1">Total Income</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(executiveSummary.totalIncome)}</p>
              <p className={`text-sm mt-2 ${parseFloat(executiveSummary.incomeGrowth) >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                {parseFloat(executiveSummary.incomeGrowth) >= 0 ? '▲' : '▼'} {executiveSummary.incomeGrowth}% vs prior period
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-red-600 to-red-700 p-5">
              <p className="text-xs text-red-100 uppercase tracking-wide mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(executiveSummary.totalExpenses)}</p>
              <p className={`text-sm mt-2 ${parseFloat(executiveSummary.expenseGrowth) <= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                {parseFloat(executiveSummary.expenseGrowth) >= 0 ? '▲' : '▼'} {executiveSummary.expenseGrowth}% vs prior period
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 p-5">
              <p className="text-xs text-violet-100 uppercase tracking-wide mb-1">Net Operating Income</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(executiveSummary.netOperatingIncome)}</p>
              <p className={`text-sm mt-2 ${parseFloat(executiveSummary.netGrowth) >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                {parseFloat(executiveSummary.netGrowth) >= 0 ? '▲' : '▼'} {executiveSummary.netGrowth}% vs prior period
              </p>
            </div>
          </div>

          {/* Portfolio Overview */}
          <Card className="border-white/10 bg-slate-800/60">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-violet-400" />
                Portfolio Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-slate-900/60">
                  <p className="text-3xl font-bold text-white">{portfolio.propertyCount}</p>
                  <p className="text-xs text-slate-400 uppercase">Properties</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-900/60">
                  <p className="text-3xl font-bold text-white">{portfolio.totalUnits}</p>
                  <p className="text-xs text-slate-400 uppercase">Total Units</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-900/60">
                  <p className="text-3xl font-bold text-emerald-400">{portfolio.occupancyRate}%</p>
                  <p className="text-xs text-slate-400 uppercase">Occupancy</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-900/60">
                  <p className="text-3xl font-bold text-cyan-400">{formatCurrency(portfolio.avgRentPerUnit)}</p>
                  <p className="text-xs text-slate-400 uppercase">Avg Rent/Unit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend Chart */}
          <Card className="border-white/10 bg-slate-800/60">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-400" />
                Monthly Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-2">
                {charts.monthlyTrend.map((m: any, i: number) => {
                  const maxVal = Math.max(...charts.monthlyTrend.map((x: any) => Math.max(x.income, x.expenses)), 1);
                  const incomeHeight = (m.income / maxVal) * 100;
                  const expenseHeight = (m.expenses / maxVal) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex gap-1 items-end h-36 w-full justify-center">
                        <div 
                          className="w-3 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t"
                          style={{ height: `${incomeHeight}%`, minHeight: m.income > 0 ? '4px' : '0' }}
                          title={`Income: ${formatCurrency(m.income)}`}
                        />
                        <div 
                          className="w-3 bg-gradient-to-t from-red-600 to-red-400 rounded-t"
                          style={{ height: `${expenseHeight}%`, minHeight: m.expenses > 0 ? '4px' : '0' }}
                          title={`Expenses: ${formatCurrency(m.expenses)}`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">{m.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  Income
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-500" />
                  Expenses
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Collection & Lease Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collection Summary */}
            <Card className="border-white/10 bg-slate-800/60">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Rent Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Due</span>
                  <span className="text-white font-medium">{formatCurrency(collectionSummary.totalDue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Collected</span>
                  <span className="text-emerald-400 font-medium">{formatCurrency(collectionSummary.collected)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Outstanding</span>
                  <span className="text-red-400 font-medium">{formatCurrency(collectionSummary.outstanding)}</span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Collection Rate</span>
                    <span className="text-white">{collectionSummary.collectionRate}%</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${collectionSummary.collectionRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lease Summary */}
            <Card className="border-white/10 bg-slate-800/60">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-violet-400" />
                  Lease Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Active Leases</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300">{leaseSummary.activeLeases}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Expiring in 30 days</span>
                  <Badge className={leaseSummary.expiringIn30Days > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}>
                    {leaseSummary.expiringIn30Days}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Expiring in 90 days</span>
                  <Badge className="bg-blue-500/20 text-blue-300">{leaseSummary.expiringIn90Days}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Month-to-Month</span>
                  <Badge className="bg-violet-500/20 text-violet-300">{leaseSummary.monthToMonth}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expense Breakdown */}
          {charts.expenseBreakdown && charts.expenseBreakdown.length > 0 && (
            <Card className="border-white/10 bg-slate-800/60">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-violet-400" />
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {charts.expenseBreakdown.map((e: any, i: number) => {
                    const colors = ['bg-violet-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-red-500', 'bg-slate-500'];
                    return (
                      <div key={i} className="p-3 rounded-lg bg-slate-900/60 flex items-center gap-3">
                        <div className={`w-3 h-3 rounded ${colors[i % colors.length]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium truncate">{e.category}</p>
                          <p className="text-xs text-slate-400">{formatCurrency(e.amount)} ({e.percentage}%)</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Performance Table */}
          <Card className="border-white/10 bg-slate-800/60">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-violet-400" />
                Property Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-2 text-slate-400 font-medium">Property</th>
                      <th className="text-center py-3 px-2 text-slate-400 font-medium">Units</th>
                      <th className="text-center py-3 px-2 text-slate-400 font-medium">Occupancy</th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">Income</th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">Expenses</th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">NOI</th>
                      <th className="text-center py-3 px-2 text-slate-400 font-medium">Collection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyPerformance.map((p: any) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2">
                          <p className="text-white font-medium">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.address}</p>
                        </td>
                        <td className="py-3 px-2 text-center text-white">{p.units}</td>
                        <td className="py-3 px-2 text-center">
                          <Badge className={p.occupancyRate >= 90 ? 'bg-emerald-500/20 text-emerald-300' : p.occupancyRate >= 70 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}>
                            {p.occupancyRate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right text-emerald-400">{formatCurrency(p.income)}</td>
                        <td className="py-3 px-2 text-right text-red-400">{formatCurrency(p.expenses)}</td>
                        <td className={`py-3 px-2 text-right font-medium ${p.noi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(p.noi)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge className={p.collectionRate >= 95 ? 'bg-emerald-500/20 text-emerald-300' : p.collectionRate >= 80 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}>
                            {p.collectionRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-slate-500 pt-4 border-t border-white/10">
            <p>Report generated on {new Date(data.generatedAt).toLocaleString()}</p>
            <p>Prepared by {data.preparedBy} • Confidential</p>
          </div>
        </div>
      </div>
    </div>
  );
}
