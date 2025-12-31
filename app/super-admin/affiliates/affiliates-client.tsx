'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  code: string;
  status: string;
  commissionBasic: number;
  commissionPro: number;
  commissionEnterprise: number;
  paymentMethod: string | null;
  paymentEmail: string | null;
  paymentPhone: string | null;
  minimumPayout: number;
  totalClicks: number;
  totalSignups: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  tier: string;
  notes: string | null;
  createdAt: string;
  _count: {
    referrals: number;
    payouts: number;
    clicks: number;
  };
}

interface Referral {
  id: string;
  subscriptionTier: string;
  subscriptionPrice: number;
  commissionAmount: number;
  commissionStatus: string;
  createdAt: string;
  affiliate: { name: string; code: string };
  landlord: { name: string; subdomain: string; subscriptionTier: string };
}

interface AffiliatesClientProps {
  initialAffiliates: Affiliate[];
  stats: {
    totalAffiliates: number;
    activeAffiliates: number;
    totalReferrals: number;
    pendingCommissions: number;
    approvedCommissions: number;
    totalPaid: number;
  };
  recentReferrals: Referral[];
}

function StatCard({ label, value, icon: Icon, variant = 'default' }: {
  label: string;
  value: string | number;
  icon: any;
  variant?: 'default' | 'success' | 'warning' | 'info';
}) {
  const variants = {
    default: 'bg-slate-900/60 border-white/10',
    success: 'bg-emerald-950/50 border-emerald-800/50',
    warning: 'bg-amber-950/50 border-amber-800/50',
    info: 'bg-blue-950/50 border-blue-800/50',
  };
  const iconVariants = {
    default: 'text-slate-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
  };

  return (
    <div className={`rounded-xl border p-4 ${variants[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${iconVariants[variant]}`} />
      </div>
    </div>
  );
}

export default function AffiliatesClient({
  initialAffiliates,
  stats,
  recentReferrals,
}: AffiliatesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState(initialAffiliates);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    code: '',
    paymentMethod: 'paypal',
    paymentEmail: '',
    paymentPhone: '',
    commissionBasic: 5,
    commissionPro: 10,
    commissionEnterprise: 25,
    notes: '',
  });

  const filteredAffiliates = affiliates.filter(a => {
    const matchesSearch = !search || 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copied!', description: 'Affiliate link copied to clipboard' });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.code) {
      toast({ title: 'Error', description: 'Name, email, and code are required', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/super-admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: 'Success', description: 'Affiliate created successfully' });
      setShowCreateModal(false);
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this affiliate?')) return;

    try {
      const res = await fetch(`/api/super-admin/affiliates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      toast({ title: 'Deleted', description: 'Affiliate deleted successfully' });
      setAffiliates(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete affiliate', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>;
      case 'paused': return <Badge className="bg-amber-500/20 text-amber-400">Paused</Badge>;
      case 'terminated': return <Badge className="bg-red-500/20 text-red-400">Terminated</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-500/20 text-amber-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved': return <Badge className="bg-blue-500/20 text-blue-400"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'paid': return <Badge className="bg-emerald-500/20 text-emerald-400"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'cancelled': return <Badge className="bg-red-500/20 text-red-400"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Affiliate Program</h1>
          <p className="text-slate-400 text-sm">Manage affiliates and track referral commissions</p>
        </div>
        <Button onClick={() => {
          setFormData({
            name: '', email: '', phone: '', code: '',
            paymentMethod: 'paypal', paymentEmail: '', paymentPhone: '',
            commissionBasic: 5, commissionPro: 10, commissionEnterprise: 25, notes: '',
          });
          setShowCreateModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Affiliate
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Affiliates" value={stats.totalAffiliates} icon={Users} />
        <StatCard label="Active" value={stats.activeAffiliates} icon={CheckCircle} variant="success" />
        <StatCard label="Total Referrals" value={stats.totalReferrals} icon={TrendingUp} variant="info" />
        <StatCard label="Pending" value={formatCurrency(stats.pendingCommissions)} icon={Clock} variant="warning" />
        <StatCard label="Ready to Pay" value={formatCurrency(stats.approvedCommissions)} icon={DollarSign} variant="info" />
        <StatCard label="Total Paid" value={formatCurrency(stats.totalPaid)} icon={DollarSign} variant="success" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/60 border-white/10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-slate-900/60 border-white/10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Affiliates Table */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Affiliates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">Affiliate</TableHead>
                <TableHead className="text-slate-400">Code</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Clicks</TableHead>
                <TableHead className="text-slate-400 text-right">Signups</TableHead>
                <TableHead className="text-slate-400 text-right">Earnings</TableHead>
                <TableHead className="text-slate-400 text-right">Pending</TableHead>
                <TableHead className="text-slate-400"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAffiliates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                    No affiliates found
                  </TableCell>
                </TableRow>
              ) : filteredAffiliates.map((affiliate) => (
                <TableRow key={affiliate.id} className="border-white/5">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{affiliate.name}</p>
                      <p className="text-xs text-slate-400">{affiliate.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-slate-800 rounded text-cyan-400 text-sm">
                        {affiliate.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(affiliate.code)}
                        className="h-7 w-7 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                  <TableCell className="text-right text-slate-300">{affiliate.totalClicks}</TableCell>
                  <TableCell className="text-right text-slate-300">{affiliate._count.referrals}</TableCell>
                  <TableCell className="text-right text-emerald-400 font-medium">
                    {formatCurrency(affiliate.totalEarnings)}
                  </TableCell>
                  <TableCell className="text-right text-amber-400">
                    {formatCurrency(affiliate.pendingEarnings)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedAffiliate(affiliate);
                          setShowDetailModal(true);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyLink(affiliate.code)}>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(affiliate.id)}
                          className="text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Affiliate</TableHead>
                <TableHead className="text-slate-400">New Landlord</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400 text-right">Commission</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReferrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No referrals yet
                  </TableCell>
                </TableRow>
              ) : recentReferrals.map((referral) => (
                <TableRow key={referral.id} className="border-white/5">
                  <TableCell className="text-slate-300">
                    {formatDateTime(new Date(referral.createdAt)).dateOnly}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white">{referral.affiliate.name}</p>
                      <code className="text-xs text-cyan-400">{referral.affiliate.code}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white">{referral.landlord.name}</p>
                      <p className="text-xs text-slate-400">{referral.landlord.subdomain}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {referral.subscriptionTier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-emerald-400 font-medium">
                    {formatCurrency(referral.commissionAmount)}
                  </TableCell>
                  <TableCell>{getCommissionStatusBadge(referral.commissionStatus)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-slate-900 border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Affiliate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Referral Code *</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="SISTER5"
                    className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500 uppercase"
                  />
                  <Button type="button" variant="outline" onClick={generateCode} className="border-white/20 text-white hover:bg-slate-700">
                    Generate
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Pro ($29.99)</Label>
                <Input
                  type="number"
                  value={formData.commissionBasic}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionBasic: Number(e.target.value) }))}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Enterprise ($79.99)</Label>
                <Input
                  type="number"
                  value={formData.commissionPro}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionPro: Number(e.target.value) }))}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Custom</Label>
                <Input
                  type="number"
                  value={formData.commissionEnterprise}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionEnterprise: Number(e.target.value) }))}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, paymentMethod: v }))}
                >
                  <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Payment Email/Phone</Label>
                <Input
                  value={formData.paymentEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentEmail: e.target.value }))}
                  placeholder="payment@email.com"
                  className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any notes about this affiliate..."
                className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-white/20 text-white hover:bg-slate-700">Cancel</Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Affiliate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="bg-slate-900 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Affiliate Details</DialogTitle>
          </DialogHeader>
          {selectedAffiliate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">{selectedAffiliate.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-400">Email:</span> <span className="text-white">{selectedAffiliate.email}</span></p>
                    <p><span className="text-slate-400">Phone:</span> <span className="text-white">{selectedAffiliate.phone || 'N/A'}</span></p>
                    <p><span className="text-slate-400">Status:</span> {getStatusBadge(selectedAffiliate.status)}</p>
                    <p><span className="text-slate-400">Tier:</span> <Badge variant="outline" className="capitalize">{selectedAffiliate.tier}</Badge></p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Referral Link</h4>
                  <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                    <code className="text-cyan-400 text-sm flex-1 truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}?ref=${selectedAffiliate.code}` : `?ref=${selectedAffiliate.code}`}
                    </code>
                    <Button size="sm" variant="ghost" onClick={() => copyLink(selectedAffiliate.code)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{selectedAffiliate.totalClicks}</p>
                  <p className="text-xs text-slate-400">Total Clicks</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{selectedAffiliate._count.referrals}</p>
                  <p className="text-xs text-slate-400">Signups</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(selectedAffiliate.totalEarnings)}</p>
                  <p className="text-xs text-slate-400">Total Earned</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-400">{formatCurrency(selectedAffiliate.pendingEarnings)}</p>
                  <p className="text-xs text-slate-400">Pending</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Commission Rates</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-lg font-bold text-white">{formatCurrency(selectedAffiliate.commissionBasic)}</p>
                    <p className="text-xs text-slate-400">Basic Plan ($29.99)</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-lg font-bold text-white">{formatCurrency(selectedAffiliate.commissionPro)}</p>
                    <p className="text-xs text-slate-400">Pro Plan ($79.99)</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-lg font-bold text-white">{formatCurrency(selectedAffiliate.commissionEnterprise)}</p>
                    <p className="text-xs text-slate-400">Enterprise</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Payment Info</h4>
                <div className="p-3 bg-slate-800 rounded-lg space-y-1 text-sm">
                  <p><span className="text-slate-400">Method:</span> <span className="text-white capitalize">{selectedAffiliate.paymentMethod || 'Not set'}</span></p>
                  <p><span className="text-slate-400">Email/Phone:</span> <span className="text-white">{selectedAffiliate.paymentEmail || selectedAffiliate.paymentPhone || 'Not set'}</span></p>
                  <p><span className="text-slate-400">Min Payout:</span> <span className="text-white">{formatCurrency(selectedAffiliate.minimumPayout)}</span></p>
                </div>
              </div>

              {selectedAffiliate.notes && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Notes</h4>
                  <p className="text-sm text-slate-300 p-3 bg-slate-800 rounded-lg">{selectedAffiliate.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
