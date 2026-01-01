'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  Users, 
  MousePointer, 
  TrendingUp,
  Copy,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Settings
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface AffiliateStats {
  code: string;
  referralLink: string;
  totalClicks: number;
  totalSignups: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  tier: string;
  status: string;
}

interface Referral {
  id: string;
  landlordName: string;
  subscriptionTier: string;
  commissionAmount: number;
  commissionStatus: string;
  createdAt: string;
  pendingUntil: string;
}

export default function AffiliateDashboard() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutRequested, setPayoutRequested] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/affiliate/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setReferrals(data.referrals);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requestPayout = async () => {
    try {
      const response = await fetch('/api/affiliate/payout', {
        method: 'POST',
      });
      if (response.ok) {
        setPayoutRequested(true);
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Failed to request payout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Unable to load dashboard data. Please try again.</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Clicks', 
      value: stats.totalClicks.toLocaleString(), 
      icon: MousePointer, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    { 
      label: 'Total Signups', 
      value: stats.totalSignups.toLocaleString(), 
      icon: Users, 
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    { 
      label: 'Pending Earnings', 
      value: `$${stats.pendingEarnings.toFixed(2)}`, 
      icon: Clock, 
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20'
    },
    { 
      label: 'Total Earned', 
      value: `$${stats.totalEarnings.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20'
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Affiliate Dashboard</h1>
          <p className="text-slate-400">Track your referrals and earnings</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/affiliate-program/settings">
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            stats.tier === 'platinum' ? 'bg-violet-500/20 text-violet-300' :
            stats.tier === 'gold' ? 'bg-amber-500/20 text-amber-300' :
            stats.tier === 'silver' ? 'bg-slate-500/20 text-slate-300' :
            'bg-blue-500/20 text-blue-300'
          }`}>
            {stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1)} Tier
          </span>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Your Referral Link</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700">
              <Input
                value={stats.referralLink}
                readOnly
                className="bg-transparent border-0 text-violet-400 focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(stats.referralLink)}
                className="text-slate-400 hover:text-white"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-lg bg-violet-600/20 border border-violet-500/30">
              <span className="text-sm text-slate-400">Code:</span>
              <span className="ml-2 font-mono font-bold text-violet-400">{stats.code}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div 
            key={stat.label}
            className="rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Payout Section */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Available for Payout</h2>
            <p className="text-3xl font-bold text-green-400 mt-2">
              ${(stats.totalEarnings - stats.pendingEarnings - stats.paidEarnings).toFixed(2)}
            </p>
            <p className="text-sm text-slate-400 mt-1">Minimum payout: $25.00</p>
          </div>
          <Button
            onClick={requestPayout}
            disabled={(stats.totalEarnings - stats.pendingEarnings - stats.paidEarnings) < 25 || payoutRequested}
            className="bg-green-600 hover:bg-green-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {payoutRequested ? 'Payout Requested' : 'Request Payout'}
          </Button>
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Referrals</h2>
        
        {referrals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No referrals yet</p>
            <p className="text-sm text-slate-500 mt-1">Share your link to start earning!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Commission</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-slate-800">
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        referral.subscriptionTier === 'enterprise' ? 'bg-amber-500/20 text-amber-300' :
                        referral.subscriptionTier === 'pro' ? 'bg-violet-500/20 text-violet-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {referral.subscriptionTier.charAt(0).toUpperCase() + referral.subscriptionTier.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-green-400">
                      ${referral.commissionAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        referral.commissionStatus === 'paid' ? 'bg-green-500/20 text-green-300' :
                        referral.commissionStatus === 'approved' ? 'bg-blue-500/20 text-blue-300' :
                        referral.commissionStatus === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {referral.commissionStatus === 'pending' 
                          ? `Pending until ${new Date(referral.pendingUntil).toLocaleDateString()}`
                          : referral.commissionStatus.charAt(0).toUpperCase() + referral.commissionStatus.slice(1)
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
