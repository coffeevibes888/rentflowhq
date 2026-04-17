'use client';

import { useState } from 'react';
import {
  FileText, Plus, Send, CheckCircle2, XCircle, Clock,
  Copy, ExternalLink, Trash2, Eye, AlertTriangle,
  Loader2, Filter, Search, FileSignature,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Job { id: string; title: string; jobNumber: string; }

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  type: string;
  status: string;
  customerName: string;
  customerEmail: string;
  contractAmount: string | null;
  sentAt: string | null;
  signedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  job: { title: string; jobNumber: string } | null;
}

interface Props {
  initialContracts: Contract[];
  jobs: Job[];
  appUrl: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft:    { label: 'Draft',    className: 'bg-gray-100 text-gray-700',    icon: FileText },
  sent:     { label: 'Sent',     className: 'bg-blue-100 text-blue-700',    icon: Send },
  viewed:   { label: 'Viewed',   className: 'bg-violet-100 text-violet-700', icon: Eye },
  signed:   { label: 'Signed',   className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  declined: { label: 'Declined', className: 'bg-red-100 text-red-700',      icon: XCircle },
  expired:  { label: 'Expired',  className: 'bg-amber-100 text-amber-700',  icon: AlertTriangle },
  void:     { label: 'Void',     className: 'bg-gray-100 text-gray-500',    icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  service_agreement: 'Service Agreement',
  change_order: 'Change Order',
  proposal: 'Proposal',
  scope_of_work: 'Scope of Work',
  warranty: 'Warranty',
  other: 'Contract',
};

const DEFAULT_TEMPLATE = `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into between:

Contractor: [CONTRACTOR NAME]
Customer: [CUSTOMER NAME]

SCOPE OF WORK
[Describe the work to be performed]

TERMS & CONDITIONS
1. Payment is due upon completion unless otherwise agreed.
2. Any changes to scope require a written change order.
3. Contractor is not responsible for pre-existing conditions.
4. Customer is responsible for providing access to work area.

PAYMENT TERMS
[Describe payment schedule]

By signing below, both parties agree to the terms of this Agreement.`;

// ── Component ─────────────────────────────────────────────────────────────────

export function ContractsDashboard({ initialContracts, jobs, appUrl }: Props) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [voiding, setVoiding] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    title: '', type: 'service_agreement', body: DEFAULT_TEMPLATE,
    customerName: '', customerEmail: '', customerPhone: '',
    contractAmount: '', depositAmount: '', paymentTerms: '',
    jobId: '', notes: '', expiresInDays: '30',
  });
  const [creating, setCreating] = useState(false);

  // Stats
  const stats = {
    total: contracts.length,
    draft: contracts.filter(c => c.status === 'draft').length,
    sent: contracts.filter(c => ['sent', 'viewed'].includes(c.status)).length,
    signed: contracts.filter(c => c.status === 'signed').length,
    pending: contracts.filter(c => ['sent', 'viewed'].includes(c.status)).length,
  };

  const filtered = contracts.filter(c => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.contractNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleCreate() {
    if (!form.title || !form.customerName || !form.customerEmail || !form.body) return;
    setCreating(true);
    try {
      const res = await fetch('/api/contractor/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contractAmount: form.contractAmount ? parseFloat(form.contractAmount) : undefined,
          depositAmount: form.depositAmount ? parseFloat(form.depositAmount) : undefined,
          expiresInDays: parseInt(form.expiresInDays) || 30,
          jobId: form.jobId || undefined,
        }),
      });
      if (res.ok) {
        const { contract } = await res.json();
        setContracts(prev => [contract, ...prev]);
        setShowCreate(false);
        setForm({
          title: '', type: 'service_agreement', body: DEFAULT_TEMPLATE,
          customerName: '', customerEmail: '', customerPhone: '',
          contractAmount: '', depositAmount: '', paymentTerms: '',
          jobId: '', notes: '', expiresInDays: '30',
        });
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleSend(contract: Contract) {
    setSending(contract.id);
    try {
      const res = await fetch(`/api/contractor/contracts/${contract.id}/send`, { method: 'POST' });
      if (res.ok) {
        const { signingUrl: url } = await res.json();
        setContracts(prev => prev.map(c =>
          c.id === contract.id ? { ...c, status: 'sent', sentAt: new Date().toISOString() } : c
        ));
        setSigningUrl(url);
        setSelectedContract({ ...contract, status: 'sent' });
      }
    } finally {
      setSending(null);
    }
  }

  async function handleVoid(contract: Contract) {
    if (!confirm('Void this contract? This cannot be undone.')) return;
    setVoiding(contract.id);
    try {
      const res = await fetch(`/api/contractor/contracts/${contract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'void' }),
      });
      if (res.ok) {
        setContracts(prev => prev.map(c => c.id === contract.id ? { ...c, status: 'void' } : c));
      }
    } finally {
      setVoiding(null);
    }
  }

  async function handleDelete(contract: Contract) {
    if (!confirm('Delete this draft contract?')) return;
    const res = await fetch(`/api/contractor/contracts/${contract.id}`, { method: 'DELETE' });
    if (res.ok) setContracts(prev => prev.filter(c => c.id !== contract.id));
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getSigningUrl(contract: Contract): string {
    return `${appUrl}/sign/contractor/${contract.id}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create, send, and track customer contracts</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white border-2 border-black shadow-lg w-fit"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-gray-100', text: 'text-gray-700' },
          { label: 'Awaiting Signature', value: stats.sent, color: 'bg-blue-100', text: 'text-blue-700' },
          { label: 'Signed', value: stats.signed, color: 'bg-emerald-100', text: 'text-emerald-700' },
          { label: 'Draft', value: stats.draft, color: 'bg-gray-100', text: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-gray-200 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contract list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <FileSignature className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-1">No contracts yet</p>
          <p className="text-sm text-gray-500 mb-6">Create your first contract and send it for signing.</p>
          <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> New Contract
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(contract => {
            const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft;
            const StatusIcon = cfg.icon;
            const isExpiringSoon = contract.expiresAt && !['signed', 'void', 'declined', 'expired'].includes(contract.status) &&
              new Date(contract.expiresAt).getTime() - Date.now() < 3 * 86_400_000;

            return (
              <div key={contract.id} className="rounded-xl border-2 border-gray-200 bg-white shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-gray-900">{contract.title}</span>
                      <span className="text-xs text-gray-400">{contract.contractNumber}</span>
                      <Badge className={`${cfg.className} flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                      {isExpiringSoon && (
                        <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Expiring Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {contract.customerName} · {contract.customerEmail}
                      {contract.contractAmount && ` · ${formatCurrency(Number(contract.contractAmount))}`}
                    </p>
                    {contract.job && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Job: {contract.job.title} ({contract.job.jobNumber})
                      </p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>Created {new Date(contract.createdAt).toLocaleDateString()}</span>
                      {contract.sentAt && <span>Sent {new Date(contract.sentAt).toLocaleDateString()}</span>}
                      {contract.signedAt && <span className="text-emerald-600">Signed {new Date(contract.signedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {contract.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSend(contract)}
                          disabled={sending === contract.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {sending === contract.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Send className="h-3.5 w-3.5 mr-1.5" />}
                          Send
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleDelete(contract)}
                          className="border-red-200 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {['sent', 'viewed'].includes(contract.status) && (
                      <>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => {
                            const url = signingUrl || getSigningUrl(contract);
                            copyLink(url);
                          }}
                          className="border-gray-200 text-sm"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1.5" />
                          {copied ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleVoid(contract)}
                          disabled={voiding === contract.id}
                          className="border-gray-200 text-gray-500"
                        >
                          {voiding === contract.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Void'}
                        </Button>
                      </>
                    )}
                    {contract.status === 'signed' && (
                      <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1 px-3 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Signing URL modal */}
      {signingUrl && selectedContract && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-7 w-7 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Contract Sent!</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Share this link with <strong>{selectedContract.customerName}</strong> to sign.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-lg p-3 mb-5">
              <p className="flex-1 text-sm text-gray-700 font-mono break-all">{signingUrl}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => copyLink(signingUrl)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(signingUrl, '_blank')}
                className="border-2 border-gray-200"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setSigningUrl(null)} className="border-2 border-gray-200">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Contract modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">New Contract</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Roof Repair Agreement"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Customer info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Customer Name *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Customer Email *</label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Financial */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Contract Amount</label>
                  <input
                    type="number"
                    value={form.contractAmount}
                    onChange={e => setForm(f => ({ ...f, contractAmount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Deposit</label>
                  <input
                    type="number"
                    value={form.depositAmount}
                    onChange={e => setForm(f => ({ ...f, depositAmount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Expires In (days)</label>
                  <input
                    type="number"
                    value={form.expiresInDays}
                    onChange={e => setForm(f => ({ ...f, expiresInDays: e.target.value }))}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Link to job */}
              {jobs.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Link to Job (optional)</label>
                  <select
                    value={form.jobId}
                    onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))}
                    className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    <option value="">No job linked</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.jobNumber})</option>)}
                  </select>
                </div>
              )}

              {/* Body */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Contract Body *</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={12}
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-mono focus:border-blue-400 focus:outline-none resize-y"
                />
              </div>

              {/* Payment terms */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Payment Terms</label>
                <input
                  type="text"
                  value={form.paymentTerms}
                  onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))}
                  placeholder="e.g. 50% deposit, 50% on completion"
                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button
                onClick={handleCreate}
                disabled={creating || !form.title || !form.customerName || !form.customerEmail}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Contract
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="border-2 border-gray-200">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
