'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, Lock, DollarSign, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AuditLog {
  id: string;
  action: string;
  userId: string | null;
  landlordId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  severity: string;
  createdAt: string;
}

interface AuditLogsClientProps {
  initialLogs: AuditLog[];
  stats: {
    totalLogs: number;
    criticalLogs: number;
    authEvents: number;
    financialEvents: number;
  };
}

export default function AuditLogsClient({ initialLogs, stats }: AuditLogsClientProps) {
  const [logs] = useState(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'WARNING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.startsWith('AUTH_')) return <Lock className='h-4 w-4' />;
    if (action.startsWith('PAYMENT_') || action.startsWith('PAYOUT_')) return <DollarSign className='h-4 w-4' />;
    return <Shield className='h-4 w-4' />;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-white mb-2'>Audit Logs</h1>
        <p className='text-sm text-slate-400'>Security and financial event tracking</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='rounded-xl bg-slate-900/60 border border-white/10 p-4'>
          <div className='flex items-center gap-2 text-slate-400 mb-2'>
            <Shield className='h-4 w-4' />
            <span className='text-xs'>Total Events</span>
          </div>
          <p className='text-2xl font-bold text-white'>{stats.totalLogs.toLocaleString()}</p>
        </div>
        
        <div className='rounded-xl bg-red-950/30 border border-red-800/30 p-4'>
          <div className='flex items-center gap-2 text-red-400 mb-2'>
            <AlertTriangle className='h-4 w-4' />
            <span className='text-xs'>Critical</span>
          </div>
          <p className='text-2xl font-bold text-red-400'>{stats.criticalLogs.toLocaleString()}</p>
        </div>
        
        <div className='rounded-xl bg-slate-900/60 border border-white/10 p-4'>
          <div className='flex items-center gap-2 text-slate-400 mb-2'>
            <Lock className='h-4 w-4' />
            <span className='text-xs'>Auth Events</span>
          </div>
          <p className='text-2xl font-bold text-white'>{stats.authEvents.toLocaleString()}</p>
        </div>
        
        <div className='rounded-xl bg-slate-900/60 border border-white/10 p-4'>
          <div className='flex items-center gap-2 text-slate-400 mb-2'>
            <DollarSign className='h-4 w-4' />
            <span className='text-xs'>Financial Events</span>
          </div>
          <p className='text-2xl font-bold text-white'>{stats.financialEvents.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
          <Input
            placeholder='Search by action, user ID, or IP...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 bg-slate-900/60 border-white/10'
          />
        </div>
        <div className='flex items-center gap-2'>
          <Filter className='h-4 w-4 text-slate-400' />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className='bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white'
          >
            <option value='all'>All Severities</option>
            <option value='INFO'>Info</option>
            <option value='WARNING'>Warning</option>
            <option value='CRITICAL'>Critical</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className='rounded-xl bg-slate-900/60 border border-white/10 overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='border-white/10'>
              <TableHead className='text-slate-400'>Time</TableHead>
              <TableHead className='text-slate-400'>Action</TableHead>
              <TableHead className='text-slate-400'>Severity</TableHead>
              <TableHead className='text-slate-400'>User ID</TableHead>
              <TableHead className='text-slate-400'>IP Address</TableHead>
              <TableHead className='text-slate-400'>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center text-slate-500 py-8'>
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className='border-white/5'>
                  <TableCell className='text-slate-300 text-xs'>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {getActionIcon(log.action)}
                      <span className='text-white text-sm'>{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </TableCell>
                  <TableCell className='font-mono text-xs text-slate-400 max-w-[100px] truncate'>
                    {log.userId || '-'}
                  </TableCell>
                  <TableCell className='text-slate-300 text-sm'>
                    {log.ipAddress || '-'}
                  </TableCell>
                  <TableCell className='text-slate-400 text-xs max-w-[200px] truncate'>
                    {log.metadata ? JSON.stringify(JSON.parse(log.metadata)).slice(0, 50) + '...' : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
