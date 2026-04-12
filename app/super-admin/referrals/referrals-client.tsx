'use client';

import { useState } from 'react';
import { Gift, Users, DollarSign, Clock, CheckCircle2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Referral {
  id: string;
  referrerLandlordId: string;
  referredLandlordId: string;
  status: string;
  rewardAmount: number | null;
  createdAt: string;
  completedAt: string | null;
  referralCode: string;
}

interface ReferralCode {
  id: string;
  code: string;
  landlordId: string;
  isActive: boolean;
  createdAt: string;
}

interface ReferralsClientProps {
  initialReferrals: Referral[];
  referralCodes: ReferralCode[];
  stats: {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalCreditsIssued: number;
  };
}

export default function ReferralsClient({ initialReferrals, referralCodes, stats }: ReferralsClientProps) {
  const [referrals] = useState(initialReferrals);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch = 
      ref.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.referrerLandlordId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-white mb-2'>Referral Program</h1>
        <p className='text-sm text-slate-400'>Track referrals and manage rewards</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4'>
          <div className='flex items-center gap-2 text-white/80 mb-2'>
            <Gift className='h-4 w-4' />
            <span className='text-xs'>Total Referrals</span>
          </div>
          <p className='text-2xl font-bold text-white'>{stats.totalReferrals.toLocaleString()}</p>
        </div>
        
        <div className='rounded-xl bg-slate-900/60 border border-white/10 p-4'>
          <div className='flex items-center gap-2 text-emerald-400 mb-2'>
            <CheckCircle2 className='h-4 w-4' />
            <span className='text-xs'>Completed</span>
          </div>
          <p className='text-2xl font-bold text-emerald-400'>{stats.completedReferrals.toLocaleString()}</p>
        </div>
        
        <div className='rounded-xl bg-slate-900/60 border border-white/10 p-4'>
          <div className='flex items-center gap-2 text-amber-400 mb-2'>
            <Clock className='h-4 w-4' />
            <span className='text-xs'>Pending</span>
          </div>
          <p className='text-2xl font-bold text-amber-400'>{stats.pendingReferrals.toLocaleString()}</p>
        </div>
        
        <div className='rounded-xl bg-slate-900/60 border border-white/10 p-4'>
          <div className='flex items-center gap-2 text-violet-400 mb-2'>
            <DollarSign className='h-4 w-4' />
            <span className='text-xs'>Credits Issued</span>
          </div>
          <p className='text-2xl font-bold text-violet-400'>${stats.totalCreditsIssued.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
          <Input
            placeholder='Search by code or landlord ID...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 bg-slate-900/60 border-white/10'
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white'
        >
          <option value='all'>All Status</option>
          <option value='pending'>Pending</option>
          <option value='completed'>Completed</option>
          <option value='expired'>Expired</option>
        </select>
      </div>

      {/* Referrals Table */}
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold text-white'>Recent Referrals</h2>
        <div className='rounded-xl bg-slate-900/60 border border-white/10 overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='border-white/10'>
                <TableHead className='text-slate-400'>Code</TableHead>
                <TableHead className='text-slate-400'>Referrer</TableHead>
                <TableHead className='text-slate-400'>Referred</TableHead>
                <TableHead className='text-slate-400'>Status</TableHead>
                <TableHead className='text-slate-400'>Reward</TableHead>
                <TableHead className='text-slate-400'>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center text-slate-500 py-8'>
                    No referrals found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReferrals.map((ref) => (
                  <TableRow key={ref.id} className='border-white/5'>
                    <TableCell className='font-mono text-violet-400'>{ref.referralCode}</TableCell>
                    <TableCell className='font-mono text-xs text-slate-400 max-w-[100px] truncate'>
                      {ref.referrerLandlordId}
                    </TableCell>
                    <TableCell className='font-mono text-xs text-slate-400 max-w-[100px] truncate'>
                      {ref.referredLandlordId}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ref.status === 'completed' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : ref.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {ref.status}
                      </span>
                    </TableCell>
                    <TableCell className='text-white'>
                      {ref.rewardAmount ? `$${ref.rewardAmount}` : '-'}
                    </TableCell>
                    <TableCell className='text-slate-300 text-sm'>
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Active Referral Codes */}
      <div className='space-y-4'>
        <h2 className='text-lg font-semibold text-white'>Active Referral Codes</h2>
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
          {referralCodes.filter(c => c.isActive).slice(0, 12).map((code) => (
            <div 
              key={code.id}
              className='rounded-lg bg-slate-900/60 border border-white/10 p-3 text-center'
            >
              <p className='font-mono text-violet-400 font-bold'>{code.code}</p>
              <p className='text-xs text-slate-500 mt-1'>
                {new Date(code.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
