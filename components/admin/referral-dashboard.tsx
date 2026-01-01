'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, CheckCircle2, Users, DollarSign, Clock, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ReferralStats {
  code: string | null;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  availableCredits: number;
  referrals: Array<{
    id: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
    rewardAmount: number | null;
    referredName: string;
  }>;
}

interface ReferralDashboardProps {
  landlordId: string;
}

export default function ReferralDashboard({ landlordId }: ReferralDashboardProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralLink, setReferralLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralData();
  }, [landlordId]);

  const fetchReferralData = async () => {
    try {
      const res = await fetch(`/api/landlord/referrals?landlordId=${landlordId}`);
      const data = await res.json();
      
      if (res.ok) {
        setStats(data.stats);
        setReferralLink(data.referralLink);
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard.',
    });
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Property Flow HQ',
          text: 'I use Property Flow HQ for property management. Sign up with my link and we both get $50 credit!',
          url: referralLink,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      copyLink();
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-violet-400' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-3'>
        <div className='rounded-full bg-violet-500/20 p-3 border border-violet-500/30'>
          <Gift className='h-6 w-6 text-violet-400' />
        </div>
        <div>
          <h2 className='text-xl font-bold text-white'>Referral Program</h2>
          <p className='text-sm text-slate-400'>Earn $50 for every landlord you refer</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4'>
          <div className='flex items-center gap-2 text-slate-400 mb-2'>
            <Users className='h-4 w-4' />
            <span className='text-xs'>Total Referrals</span>
          </div>
          <p className='text-2xl font-bold text-white'>{stats?.totalReferrals || 0}</p>
        </div>
        
        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4'>
          <div className='flex items-center gap-2 text-slate-400 mb-2'>
            <CheckCircle2 className='h-4 w-4' />
            <span className='text-xs'>Completed</span>
          </div>
          <p className='text-2xl font-bold text-emerald-400'>{stats?.completedReferrals || 0}</p>
        </div>
        
        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4'>
          <div className='flex items-center gap-2 text-slate-400 mb-2'>
            <Clock className='h-4 w-4' />
            <span className='text-xs'>Pending</span>
          </div>
          <p className='text-2xl font-bold text-amber-400'>{stats?.pendingReferrals || 0}</p>
        </div>
        
        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-4'>
          <div className='flex items-center gap-2 text-slate-400 mb-2'>
            <DollarSign className='h-4 w-4' />
            <span className='text-xs'>Available Credit</span>
          </div>
          <p className='text-2xl font-bold text-violet-400'>${stats?.availableCredits || 0}</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className='rounded-xl border border-violet-500/30 bg-violet-500/10 p-6'>
        <h3 className='font-semibold text-white mb-2'>Your Referral Link</h3>
        <p className='text-sm text-slate-300 mb-4'>
          Share this link with other landlords. When they sign up and collect their first rent payment, you both get $50 credit.
        </p>
        
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='flex-1 bg-slate-900/60 rounded-lg px-4 py-3 font-mono text-sm text-slate-300 truncate border border-white/10'>
            {referralLink || 'Loading...'}
          </div>
          <div className='flex gap-2'>
            <Button onClick={copyLink} variant='outline'>
              {copied ? (
                <>
                  <CheckCircle2 className='h-4 w-4 mr-2 text-emerald-400' />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className='h-4 w-4 mr-2' />
                  Copy
                </>
              )}
            </Button>
            <Button onClick={shareLink}>
              <Share2 className='h-4 w-4 mr-2' />
              Share
            </Button>
          </div>
        </div>

        {stats?.code && (
          <p className='mt-3 text-xs text-slate-400'>
            Your referral code: <span className='font-mono text-violet-400'>{stats.code}</span>
          </p>
        )}
      </div>

      {/* How It Works */}
      <div className='rounded-xl border border-white/10 bg-slate-900/60 p-6'>
        <h3 className='font-semibold text-white mb-4'>How It Works</h3>
        <div className='grid md:grid-cols-3 gap-4'>
          <div className='flex items-start gap-3'>
            <div className='rounded-full bg-violet-500/20 w-8 h-8 flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0'>
              1
            </div>
            <div>
              <p className='font-medium text-white text-sm'>Share Your Link</p>
              <p className='text-xs text-slate-400'>Send your referral link to other landlords</p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <div className='rounded-full bg-violet-500/20 w-8 h-8 flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0'>
              2
            </div>
            <div>
              <p className='font-medium text-white text-sm'>They Sign Up</p>
              <p className='text-xs text-slate-400'>They create an account using your link</p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <div className='rounded-full bg-violet-500/20 w-8 h-8 flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0'>
              3
            </div>
            <div>
              <p className='font-medium text-white text-sm'>Both Get $50</p>
              <p className='text-xs text-slate-400'>After their first rent payment, you both earn credit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History */}
      {stats?.referrals && stats.referrals.length > 0 && (
        <div className='rounded-xl border border-white/10 bg-slate-900/60 p-6'>
          <h3 className='font-semibold text-white mb-4'>Referral History</h3>
          <div className='space-y-3'>
            {stats.referrals.map((referral) => (
              <div
                key={referral.id}
                className='flex items-center justify-between py-3 border-b border-white/5 last:border-0'
              >
                <div>
                  <p className='font-medium text-white text-sm'>{referral.referredName}</p>
                  <p className='text-xs text-slate-400'>
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className='text-right'>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      referral.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {referral.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                  {referral.rewardAmount && (
                    <p className='text-xs text-emerald-400 mt-1'>+${referral.rewardAmount}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
