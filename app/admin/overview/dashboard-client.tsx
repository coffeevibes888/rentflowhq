'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import {
  Building2, Users, FileText, Wrench, DollarSign, Wallet,
  MessageCircle, TrendingUp, ArrowUpRight, ArrowDownRight,
  ChevronRight, Calendar, AlertTriangle, CheckCircle2, Clock,
  Home, ClipboardList, Shield, Plus, ExternalLink, Copy, Share2,
} from 'lucide-react';

interface DashboardStats {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  propertiesCount: number;
  tenantsCount: number;
  applicationsCount: number;
  ticketsCount: number;
  urgentTickets: number;
  openTickets: number;
  messagesCount: number;
  rentCollectedThisMonth: number;
  rentCollectedYtd: number;
  scheduledRentMonthly: number;
  collectionRate: number;
  availableBalance: number;
  leasesExpiringSoon: number;
}

interface RecentLease {
  id: string;
  status: string;
  rentAmount: number;
  startDate: string;
  createdAt: string;
  tenant: { name: string | null } | null;
  unit: { name: string; property: { name: string } | null } | null;
}

interface RecentApplication {
  id: string;
  fullName: string | null;
  status: string;
  createdAt: string;
  unit: { name: string; property: { name: string } | null } | null;
}

interface RecentTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  tenant: { name: string | null } | null;
}

interface DashboardClientProps {
  stats: DashboardStats;
  recentLeases: RecentLease[];
  recentApplications: RecentApplication[];
  recentTickets: RecentTicket[];
  listingUrl: string;
  contractorUrl: string;
  landlordName: string;
  isAdmin: boolean;
}

export default function DashboardClient({
  stats,
  recentLeases,
  recentApplications,
  recentTickets,
  listingUrl,
  contractorUrl,
  landlordName,
  isAdmin,
}: DashboardClientProps) {
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);

  const handleCopy = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(label);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className='w-full space-y-5'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-black'>
            Property Dashboard
          </h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>
            Manage your properties, tenants, and operations
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Link
            href='/admin/products'
            className='px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5'
          >
            <Plus className='h-3.5 w-3.5' />
            Add Property
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        <KPICard
          title='Rent Collected'
          value={formatCurrency(stats.rentCollectedThisMonth)}
          subtitle={`${stats.collectionRate}% of scheduled`}
          icon={DollarSign}
          gradient='from-emerald-400 to-cyan-400'
          href='/admin/revenue'
        />
        <KPICard
          title='Occupancy Rate'
          value={`${stats.occupancyRate}%`}
          subtitle={`${stats.occupiedUnits} of ${stats.totalUnits} units`}
          icon={Building2}
          gradient='from-blue-400 to-indigo-400'
          href='/admin/products'
        />
        <KPICard
          title='Open Tickets'
          value={String(stats.openTickets)}
          subtitle={`${stats.urgentTickets} urgent`}
          icon={Wrench}
          gradient='from-violet-400 to-purple-400'
          href='/admin/maintenance'
          alert={stats.urgentTickets > 0}
        />
        <KPICard
          title='Applications'
          value={String(stats.applicationsCount)}
          subtitle='Review pending'
          icon={FileText}
          gradient='from-amber-400 to-orange-400'
          href='/admin/applications'
        />
      </div>

      {/* Summary Bar */}
      <div className='relative rounded-xl border border-gray-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 overflow-hidden'>
        <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-200/30 to-transparent rounded-bl-full' />
        <div className='relative p-4'>
          <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4'>
            <SummaryItem label='Properties' value={String(stats.propertiesCount)} />
            <SummaryItem label='Total Units' value={String(stats.totalUnits)} />
            <SummaryItem label='Tenants' value={String(stats.tenantsCount)} />
            <SummaryItem label='Vacant Units' value={String(stats.vacantUnits)} />
            <SummaryItem label='Rent (YTD)' value={formatCurrency(stats.rentCollectedYtd)} />
            <SummaryItem label='Available Balance' value={formatCurrency(stats.availableBalance)} />
          </div>
        </div>
      </div>

      {/* Alerts Banner */}
      {(stats.urgentTickets > 0 || stats.leasesExpiringSoon > 0) && (
        <div className='flex flex-wrap gap-2'>
          {stats.urgentTickets > 0 && (
            <Link
              href='/admin/maintenance'
              className='flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors'
            >
              <AlertTriangle className='h-3.5 w-3.5' />
              {stats.urgentTickets} urgent maintenance {stats.urgentTickets === 1 ? 'ticket' : 'tickets'}
              <ChevronRight className='h-3 w-3' />
            </Link>
          )}
          {stats.leasesExpiringSoon > 0 && (
            <Link
              href='/admin/leases'
              className='flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors'
            >
              <Calendar className='h-3.5 w-3.5' />
              {stats.leasesExpiringSoon} {stats.leasesExpiringSoon === 1 ? 'lease expires' : 'leases expire'} within 60 days
              <ChevronRight className='h-3 w-3' />
            </Link>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        {/* Recent Activity - 2 cols */}
        <div className='lg:col-span-2 space-y-4'>
          {/* Recent Leases */}
          <div className='rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
            <div className='flex items-center justify-between p-4 border-b border-gray-100'>
              <div>
                <h3 className='text-sm font-bold text-gray-800'>Recent Leases</h3>
                <p className='text-[11px] text-gray-500'>Latest lease activity</p>
              </div>
              <Link href='/admin/leases' className='text-[11px] text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1'>
                View All <ChevronRight className='h-3 w-3' />
              </Link>
            </div>
            {recentLeases.length === 0 ? (
              <div className='p-8 text-center text-gray-400 text-sm'>No leases yet</div>
            ) : (
              <div className='divide-y divide-gray-50'>
                {recentLeases.map((lease) => (
                  <Link
                    key={lease.id}
                    href={`/admin/leases/${lease.id}`}
                    className='flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors'
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      lease.status === 'active' ? 'bg-green-100 text-green-600' :
                      lease.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      <ClipboardList className='h-4 w-4' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-semibold text-gray-800 truncate'>
                        {lease.tenant?.name || 'Unnamed Tenant'}
                      </p>
                      <p className='text-[10px] text-gray-500'>
                        {lease.unit?.property?.name} · {lease.unit?.name}
                      </p>
                    </div>
                    <div className='text-right hidden sm:block'>
                      <p className='text-xs font-bold text-gray-800'>{formatCurrency(lease.rentAmount)}/mo</p>
                      <p className='text-[10px] text-gray-400'>
                        {new Date(lease.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <StatusBadge status={lease.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Maintenance */}
          <div className='rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
            <div className='flex items-center justify-between p-4 border-b border-gray-100'>
              <div>
                <h3 className='text-sm font-bold text-gray-800'>Maintenance Tickets</h3>
                <p className='text-[11px] text-gray-500'>Recent work requests</p>
              </div>
              <Link href='/admin/maintenance' className='text-[11px] text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1'>
                View All <ChevronRight className='h-3 w-3' />
              </Link>
            </div>
            {recentTickets.length === 0 ? (
              <div className='p-8 text-center text-gray-400 text-sm'>No tickets yet</div>
            ) : (
              <div className='divide-y divide-gray-50'>
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/admin/maintenance/${ticket.id}`}
                    className='flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors'
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      ticket.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                      ticket.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Wrench className='h-4 w-4' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-semibold text-gray-800 truncate'>{ticket.title}</p>
                      <p className='text-[10px] text-gray-500'>
                        {ticket.tenant?.name || 'Unknown'} · {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {ticket.priority === 'urgent' && (
                      <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600'>Urgent</span>
                    )}
                    <StatusBadge status={ticket.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className='space-y-4'>
          {/* Quick Actions */}
          <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
            <h3 className='text-sm font-bold text-gray-800 mb-3'>Quick Actions</h3>
            <div className='grid grid-cols-2 gap-2'>
              {[
                { label: 'Properties', href: '/admin/products', icon: Building2, color: 'from-cyan-400 to-blue-400' },
                { label: 'Tenants', href: '/admin/tenants', icon: Users, color: 'from-violet-400 to-purple-400' },
                { label: 'Leases', href: '/admin/leases', icon: ClipboardList, color: 'from-emerald-400 to-teal-400' },
                { label: 'Maintenance', href: '/admin/maintenance', icon: Wrench, color: 'from-orange-400 to-red-400' },
                { label: 'Messages', href: isAdmin ? '/admin/messages' : '/admin/tenant-messages', icon: MessageCircle, color: 'from-blue-400 to-indigo-400' },
                { label: 'Documents', href: '/admin/documents', icon: FileText, color: 'from-pink-400 to-rose-400' },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className='flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group'
                >
                  <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    <action.icon className='h-4 w-4' />
                  </div>
                  <span className='text-[11px] font-medium text-gray-700'>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Applications */}
          <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-bold text-gray-800'>Applications</h3>
              <Link href='/admin/applications' className='text-[11px] text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1'>
                View All <ChevronRight className='h-3 w-3' />
              </Link>
            </div>
            {recentApplications.length === 0 ? (
              <p className='text-xs text-gray-400 text-center py-4'>No applications yet</p>
            ) : (
              <div className='space-y-2'>
                {recentApplications.slice(0, 4).map((app) => (
                  <Link
                    key={app.id}
                    href={`/admin/applications/${app.id}`}
                    className='flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <div className='h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0'>
                      {(app.fullName || '?')[0].toUpperCase()}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-[11px] font-semibold text-gray-800 truncate'>{app.fullName || 'Unknown'}</p>
                      <p className='text-[10px] text-gray-500 truncate'>
                        {app.unit?.property?.name} · {app.unit?.name}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Share Links */}
          <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
            <h3 className='text-sm font-bold text-gray-800 mb-3'>Share Links</h3>
            <div className='space-y-2'>
              {listingUrl && (
                <div className='flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100'>
                  <div className='h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center text-white shrink-0'>
                    <Home className='h-4 w-4' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-[11px] font-semibold text-gray-800'>Listing Page</p>
                    <p className='text-[10px] text-gray-500 truncate'>{listingUrl}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(listingUrl, 'listing')}
                    className='p-1.5 rounded-md hover:bg-gray-200 transition-colors'
                    title='Copy link'
                  >
                    {copiedUrl === 'listing' ? (
                      <CheckCircle2 className='h-3.5 w-3.5 text-green-500' />
                    ) : (
                      <Copy className='h-3.5 w-3.5 text-gray-400' />
                    )}
                  </button>
                </div>
              )}
              <div className='flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100'>
                <div className='h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center text-white shrink-0'>
                  <Wrench className='h-4 w-4' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-[11px] font-semibold text-gray-800'>Contractor Sign-up</p>
                  <p className='text-[10px] text-gray-500 truncate'>Invite contractors</p>
                </div>
                <button
                  onClick={() => handleCopy(contractorUrl, 'contractor')}
                  className='p-1.5 rounded-md hover:bg-gray-200 transition-colors'
                  title='Copy link'
                >
                  {copiedUrl === 'contractor' ? (
                    <CheckCircle2 className='h-3.5 w-3.5 text-green-500' />
                  ) : (
                    <Copy className='h-3.5 w-3.5 text-gray-400' />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-bold text-gray-800'>Financials</h3>
              <Link href='/admin/revenue' className='text-[11px] text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1'>
                Details <ChevronRight className='h-3 w-3' />
              </Link>
            </div>
            <div className='space-y-3'>
              <FinancialRow label='Scheduled Rent' value={formatCurrency(stats.scheduledRentMonthly)} color='text-gray-800' />
              <FinancialRow label='Collected This Month' value={formatCurrency(stats.rentCollectedThisMonth)} color='text-emerald-600' />
              <FinancialRow label='Collected YTD' value={formatCurrency(stats.rentCollectedYtd)} color='text-blue-600' />
              <div className='border-t border-gray-100 pt-2'>
                <FinancialRow label='Available to Cash Out' value={formatCurrency(stats.availableBalance)} color='text-gray-900' bold />
              </div>
              <Link
                href='/admin/payouts'
                className='flex items-center justify-center gap-1 text-[11px] text-cyan-600 hover:text-cyan-700 font-medium py-2 rounded-lg border border-dashed border-gray-200 hover:border-cyan-300 transition-colors'
              >
                <Wallet className='h-3 w-3' /> Cash Out
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function KPICard({ title, value, subtitle, icon: Icon, gradient, href, alert }: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className='relative rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-all overflow-hidden group'
    >
      <div className={`absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl ${gradient} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity`} />
      {alert && (
        <div className='absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse' />
      )}
      <div className='flex items-start justify-between'>
        <div className='space-y-1'>
          <p className='text-[10px] sm:text-xs text-gray-500 font-medium'>{title}</p>
          <p className='text-lg sm:text-xl md:text-2xl font-bold text-gray-900'>{value}</p>
          <p className='text-[10px] text-gray-400'>{subtitle}</p>
        </div>
        <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
          <Icon className='h-4 w-4' />
        </div>
      </div>
    </Link>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className='space-y-0.5'>
      <div className='text-[9px] sm:text-[10px] text-gray-500 font-semibold uppercase tracking-wide'>{label}</div>
      <div className='text-sm sm:text-base font-bold text-gray-800'>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-50', text: 'text-green-600', label: 'Active' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending' },
    approved: { bg: 'bg-green-50', text: 'text-green-600', label: 'Approved' },
    rejected: { bg: 'bg-red-50', text: 'text-red-600', label: 'Rejected' },
    denied: { bg: 'bg-red-50', text: 'text-red-600', label: 'Denied' },
    open: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Open' },
    in_progress: { bg: 'bg-violet-50', text: 'text-violet-600', label: 'In Progress' },
    completed: { bg: 'bg-green-50', text: 'text-green-600', label: 'Completed' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Expired' },
    terminated: { bg: 'bg-red-50', text: 'text-red-600', label: 'Terminated' },
    draft: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Draft' },
    signed: { bg: 'bg-green-50', text: 'text-green-600', label: 'Signed' },
  };

  const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-500', label: status.replace(/_/g, ' ') };

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text} capitalize`}>
      {c.label}
    </span>
  );
}

function FinancialRow({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className='flex items-center justify-between'>
      <span className='text-[11px] text-gray-500'>{label}</span>
      <span className={`text-xs ${bold ? 'font-bold' : 'font-semibold'} ${color}`}>{value}</span>
    </div>
  );
}
