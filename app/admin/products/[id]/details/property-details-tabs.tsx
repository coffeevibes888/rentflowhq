'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Building2, Users, FileText, Wrench, DollarSign, Download, 
  ChevronRight, Phone, Mail, Calendar, AlertCircle,
  Clock, Home, FileSignature, BarChart3, X, Bell, Plus, Receipt
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface PropertyDetailsTabsProps {
  property: any;
  rentPayments: any[];
  landlordId: string;
}

export function PropertyDetailsTabs({ property, rentPayments, landlordId }: PropertyDetailsTabsProps) {
  const router = useRouter();
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewingLease, setViewingLease] = useState<any | null>(null);
  
  // Expense dialog state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('maintenance');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseIncurredAt, setExpenseIncurredAt] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  // Aggregate data
  const allTickets = property.units.flatMap((u: any) => u.tickets);
  const openTickets = allTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress');
  
  const allLeases = property.units.flatMap((u: any) => 
    u.leases.map((l: any) => ({ ...l, unitName: l.unitName || u.name }))
  );
  const activeLeases = allLeases.filter((l: any) => l.status === 'active' || l.status === 'pending');
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
            <p className="text-xs uppercase tracking-[0.2em] text-violet-200/70">Property Management</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-white">{property.name}</h1>
            <p className="text-slate-300/80 text-sm">
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
                className="border-white/10 text-black"
                onClick={() => handleCreateInvoice(property.units[0].id)}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            ) : property.units.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-white/10 text-black">
                    <Receipt className="w-4 h-4 mr-2" />
                    Create Invoice
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
            
            <Button variant="outline" className="border-white/10 text-black" onClick={() => setExpenseDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
            <Button asChild variant="outline" className="border-white/10 text-black">
              <Link href={`/admin/products/${property.id}`}>Edit Property</Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start bg-slate-900/60 border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-4">
              <Building2 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tenants" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-4">
              <Users className="w-4 h-4 mr-2" />
              Tenants
              {activeLeases.length > 0 && (
                <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 text-xs">{activeLeases.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="financials" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-4">
              <BarChart3 className="w-4 h-4 mr-2" />
              Financial History
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

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Units Overview */}
              <Card className="border-white/10 bg-slate-900/60">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Units
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.units.map((unit: any) => (
                    <div key={unit.id} className="rounded-lg border border-white/10 bg-slate-800/60 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{unit.name}</span>
                        <Badge variant="outline" className={unit.isAvailable ? 'border-emerald-400/40 text-emerald-200' : 'border-blue-400/40 text-blue-200'}>
                          {unit.isAvailable ? 'Available' : 'Occupied'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        {unit.type} • {unit.bedrooms ?? '—'} bd • {unit.bathrooms ?? '—'} ba • {formatCurrency(unit.rentAmount)}/mo
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Maintenance Tickets */}
              <Card className="border-white/10 bg-slate-900/60">
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
                    <Button variant="outline" size="sm" className="border-white/10 text-black">
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
                      <TenantCard 
                        key={lease.id} 
                        lease={lease} 
                        isExpanded={selectedTenant === lease.id}
                        onToggle={() => setSelectedTenant(selectedTenant === lease.id ? null : lease.id)}
                        propertyId={property.id}
                        onViewLease={() => setViewingLease(lease)}
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
              {/* Year Selector */}
              <Card className="border-white/10 bg-slate-900/60 h-fit">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Tax Years</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {years.map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedYear === year 
                          ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 text-white' 
                          : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{year}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <div className="space-y-6">
                <Card className="border-white/10 bg-slate-900/60">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{selectedYear} Financial Summary</CardTitle>
                      <CardDescription className="text-slate-400">
                        Income and expenses for tax reporting
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-white/10 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 text-white hover:opacity-90">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                      <Button variant="outline" size="sm" className="border-white/10 bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 text-white hover:opacity-90">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FinancialSummary 
                      year={selectedYear} 
                      rentPayments={rentPayments} 
                      expenses={property.expenses}
                    />
                  </CardContent>
                </Card>

                {/* Monthly Breakdown */}
                <Card className="border-white/10 bg-slate-900/60">
                  <CardHeader>
                    <CardTitle className="text-white">Monthly Breakdown - {selectedYear}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MonthlyBreakdown 
                      year={selectedYear} 
                      rentPayments={rentPayments}
                      expenses={property.expenses}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

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

function TenantCard({ lease, isExpanded, onToggle, propertyId, onViewLease }: { 
  lease: any; 
  isExpanded: boolean;
  onToggle: () => void;
  propertyId: string;
  onViewLease: () => void;
}) {
  const tenant = lease.tenant;
  const payments = lease.rentPayments || [];
  const paidPayments = payments.filter((p: any) => p.status === 'paid');
  const overduePayments = payments.filter((p: any) => p.status === 'overdue');
  const totalOwed = payments
    .filter((p: any) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  const needsLandlordSignature = lease.signatureRequests?.some(
    (sr: any) => sr.role === 'landlord' && sr.status !== 'signed'
  );

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden">
      {/* Header - Always visible */}
      <button 
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 flex items-center justify-center">
            {tenant?.image ? (
              <Image src={tenant.image} alt={tenant.name} width={48} height={48} className="rounded-full" />
            ) : (
              <Users className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">{tenant?.name || 'Unknown Tenant'}</p>
            <p className="text-xs text-slate-400">Unit {lease.unitName} • {formatCurrency(lease.rentAmount)}/mo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {overduePayments.length > 0 && (
            <Badge className="bg-red-500/20 text-red-300 border-red-400/30">
              {formatCurrency(totalOwed)} overdue
            </Badge>
          )}
          {needsLandlordSignature && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30">
              Needs signature
            </Badge>
          )}
          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">{tenant?.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">{tenant?.phoneNumber || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">Move-in: {new Date(lease.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">Lease ends: {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'Month-to-month'}</span>
            </div>
          </div>

          {/* Payment History */}
          <div className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
            <h4 className="text-sm font-medium text-white mb-3">Payment History</h4>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <p className="text-2xl font-bold text-emerald-400">{paidPayments.length}</p>
                <p className="text-xs text-slate-400">On Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{overduePayments.length}</p>
                <p className="text-xs text-slate-400">Late/Overdue</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalOwed)}</p>
                <p className="text-xs text-slate-400">Balance Due</p>
              </div>
            </div>
            {payments.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {payments.slice(0, 6).map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{new Date(payment.dueDate).toLocaleDateString()}</span>
                    <span className="text-slate-300">{formatCurrency(payment.amount)}</span>
                    <StatusBadge status={payment.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              onClick={onViewLease}
              className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 text-white hover:opacity-90"
            >
              <FileSignature className="w-4 h-4 mr-2" />
              {needsLandlordSignature ? 'Sign Lease' : 'View Lease'}
            </Button>
            <Link href={`/admin/applications/${tenant?.id}`}>
              <Button size="sm" variant="outline" className="border-white/10 text-black">
                <FileText className="w-4 h-4 mr-2" />
                View ID & Documents
              </Button>
            </Link>
            {totalOwed > 0 && (
              <Link href={`/admin/evictions?tenantId=${tenant?.id}&propertyId=${propertyId}`}>
                <Button size="sm" variant="outline" className="border-red-400/30 text-red-300 hover:bg-red-500/10">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Start Eviction
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
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
  rentPayments, 
  expenses 
}: { 
  year: number; 
  rentPayments: any[]; 
  expenses: any[];
}) {
  const yearPayments = rentPayments.filter(p => new Date(p.dueDate).getFullYear() === year);
  const yearExpenses = expenses.filter((e: any) => new Date(e.date).getFullYear() === year);
  
  const totalIncome = yearPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalExpenses = yearExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  // Group expenses by category
  const expensesByCategory = yearExpenses.reduce((acc: Record<string, number>, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-4">
          <p className="text-xs text-emerald-100 uppercase tracking-wide">Total Income</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-emerald-100">{yearPayments.filter(p => p.status === 'paid').length} payments received</p>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-500 p-4">
          <p className="text-xs text-red-100 uppercase tracking-wide">Total Expenses</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-red-100">{yearExpenses.length} expenses recorded</p>
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
  rentPayments, 
  expenses 
}: { 
  year: number; 
  rentPayments: any[]; 
  expenses: any[];
}) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthlyData = months.map((month, index) => {
    const monthPayments = rentPayments.filter(p => {
      const date = new Date(p.dueDate);
      return date.getFullYear() === year && date.getMonth() === index;
    });
    
    const monthExpenses = expenses.filter((e: any) => {
      const date = new Date(e.date);
      return date.getFullYear() === year && date.getMonth() === index;
    });

    const income = monthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const expenseTotal = monthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

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
