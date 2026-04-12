'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, ChevronDown, ChevronUp, Calendar, DollarSign, Home, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TenantHistoryRecord {
  id: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  unitName?: string;
  leaseStartDate: string;
  leaseEndDate?: string;
  rentAmount?: number;
  departureType?: string;
  departureDate?: string;
  departureNotes?: string;
  depositAmount?: number;
  depositRefunded?: number;
  depositDeducted?: number;
  wasEvicted: boolean;
  evictionReason?: string;
  createdAt: string;
}

interface PastTenantsTabProps {
  propertyId: string;
  unitId?: string;
}

const departureTypeLabels: Record<string, { label: string; color: string }> = {
  eviction: { label: 'Evicted', color: 'bg-red-500/20 text-red-300 border-red-400/30' },
  voluntary: { label: 'Voluntary', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
  lease_end: { label: 'Lease Ended', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
  mutual_agreement: { label: 'Mutual', color: 'bg-amber-500/20 text-amber-300 border-amber-400/30' },
};

export function PastTenantsTab({ propertyId, unitId }: PastTenantsTabProps) {
  const [tenants, setTenants] = useState<TenantHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departureFilter, setDepartureFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, [propertyId, unitId, departureFilter, page]);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (departureFilter !== 'all') {
        params.append('departureType', departureFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const endpoint = unitId
        ? `/api/admin/units/${unitId}/tenant-history?${params}`
        : `/api/admin/properties/${propertyId}/tenant-history?${params}`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch tenant history');
      
      const data = await res.json();
      setTenants(page === 1 ? data.history : [...tenants, ...data.history]);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchTenants();
  };

  const filteredTenants = tenants.filter((tenant) =>
    tenant.tenantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by tenant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={departureFilter} onValueChange={(v) => { setDepartureFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-white/10 text-white">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10">
            <SelectItem value="all" className="text-white">All Types</SelectItem>
            <SelectItem value="voluntary" className="text-white">Voluntary</SelectItem>
            <SelectItem value="eviction" className="text-white">Eviction</SelectItem>
            <SelectItem value="lease_end" className="text-white">Lease Ended</SelectItem>
            <SelectItem value="mutual_agreement" className="text-white">Mutual Agreement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading && page === 1 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTenants} className="mt-4 border-white/10">
            Retry
          </Button>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="text-center py-8">
          <User className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No past tenants found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTenants.map((tenant) => {
            const isExpanded = expandedId === tenant.id;
            const typeConfig = departureTypeLabels[tenant.departureType || 'voluntary'] || departureTypeLabels.voluntary;
            
            return (
              <div
                key={tenant.id}
                className="rounded-lg border border-white/10 bg-slate-800/60 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : tenant.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-medium text-white truncate">{tenant.tenantName}</p>
                      <p className="text-xs text-slate-400">
                        {tenant.unitName && `Unit ${tenant.unitName} • `}
                        {tenant.departureDate
                          ? `Left ${new Date(tenant.departureDate).toLocaleDateString()}`
                          : tenant.leaseEndDate
                          ? `Ended ${new Date(tenant.leaseEndDate).toLocaleDateString()}`
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    {/* Lease Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">Start:</span>
                        <span className="text-white">
                          {new Date(tenant.leaseStartDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">End:</span>
                        <span className="text-white">
                          {tenant.leaseEndDate
                            ? new Date(tenant.leaseEndDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      {tenant.rentAmount && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400">Rent:</span>
                          <span className="text-white">{formatCurrency(tenant.rentAmount)}/mo</span>
                        </div>
                      )}
                      {tenant.unitName && (
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400">Unit:</span>
                          <span className="text-white">{tenant.unitName}</span>
                        </div>
                      )}
                    </div>

                    {/* Deposit Info */}
                    {(tenant.depositAmount || tenant.depositRefunded || tenant.depositDeducted) && (
                      <div className="rounded-lg bg-slate-900/40 border border-white/5 p-3">
                        <p className="text-xs text-slate-400 mb-2">Deposit Summary</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-white">
                              {formatCurrency(tenant.depositAmount || 0)}
                            </p>
                            <p className="text-[10px] text-slate-500">Original</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-emerald-400">
                              {formatCurrency(tenant.depositRefunded || 0)}
                            </p>
                            <p className="text-[10px] text-slate-500">Refunded</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-red-400">
                              {formatCurrency(tenant.depositDeducted || 0)}
                            </p>
                            <p className="text-[10px] text-slate-500">Deducted</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Eviction Info */}
                    {tenant.wasEvicted && tenant.evictionReason && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                        <p className="text-xs text-red-400 mb-1">Eviction Reason</p>
                        <p className="text-sm text-white">{tenant.evictionReason}</p>
                      </div>
                    )}

                    {/* Departure Notes */}
                    {tenant.departureNotes && (
                      <div className="rounded-lg bg-slate-900/40 border border-white/5 p-3">
                        <p className="text-xs text-slate-400 mb-1">Notes</p>
                        <p className="text-sm text-slate-300">{tenant.departureNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={loading}
                className="border-white/10 text-slate-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
