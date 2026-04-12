'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, ChevronRight, History, Users, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface VacantUnitCardProps {
  unit: {
    id: string;
    name: string;
    type?: string;
    bedrooms?: number;
    bathrooms?: number;
    rentAmount?: number;
    sizeSqFt?: number;
    isAvailable: boolean;
  };
  propertyId: string;
  onViewPastTenants?: () => void;
}

export function VacantUnitCard({ unit, propertyId, onViewPastTenants }: VacantUnitCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-700/60 flex items-center justify-center flex-shrink-0 border border-dashed border-slate-500/40">
            <Home className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-slate-300">Unit {unit.name}</p>
            <p className="text-xs text-slate-500">
              {unit.type || 'Unit'} • {formatCurrency(Number(unit.rentAmount || 0))}/mo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 text-[10px] sm:text-xs">
            Vacant
          </Badge>
          <ChevronRight
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Unit Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {unit.bedrooms !== undefined && (
              <div className="text-center p-2 rounded-lg bg-slate-900/40 border border-white/5">
                <p className="text-lg font-bold text-white">{unit.bedrooms}</p>
                <p className="text-[10px] text-slate-400">Bedrooms</p>
              </div>
            )}
            {unit.bathrooms !== undefined && (
              <div className="text-center p-2 rounded-lg bg-slate-900/40 border border-white/5">
                <p className="text-lg font-bold text-white">{unit.bathrooms}</p>
                <p className="text-[10px] text-slate-400">Bathrooms</p>
              </div>
            )}
            {unit.sizeSqFt && (
              <div className="text-center p-2 rounded-lg bg-slate-900/40 border border-white/5">
                <p className="text-lg font-bold text-white">{unit.sizeSqFt.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Sq Ft</p>
              </div>
            )}
            <div className="text-center p-2 rounded-lg bg-slate-900/40 border border-white/5">
              <p className="text-lg font-bold text-emerald-400">
                {formatCurrency(Number(unit.rentAmount || 0))}
              </p>
              <p className="text-[10px] text-slate-400">Rent/mo</p>
            </div>
          </div>

          {/* Status Message */}
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <p className="text-sm text-emerald-300">Ready for new tenant</p>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              This unit is available and can be listed for rent.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/products/${propertyId}/units/${unit.id}`}>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 text-white hover:opacity-90 text-xs sm:text-sm"
              >
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit Unit</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            </Link>
            {onViewPastTenants && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewPastTenants}
                className="border-white/10 text-slate-300 hover:bg-slate-800 text-xs sm:text-sm"
              >
                <History className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Past Tenants</span>
                <span className="sm:hidden">History</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
