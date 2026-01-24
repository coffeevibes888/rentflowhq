import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, MessageSquare, Users, TrendingUp, Send } from 'lucide-react';

export default async function MarketingPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'contractor') {
    return redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!contractorProfile) {
    return redirect('/contractor/profile');
  }

  // Get campaigns
  const campaigns = await prisma.contractorMarketingCampaign.findMany({
    where: { contractorId: contractorProfile.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Get referrals
  const referrals = await prisma.contractorReferral.findMany({
    where: { contractorId: contractorProfile.id },
    include: {
      referrer: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Calculate stats
  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'sent' || c.status === 'sending').length,
    totalReferrals: referrals.length,
    convertedReferrals: referrals.filter(r => r.status === 'converted').length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent, 0),
    totalOpened: campaigns.reduce((sum, c) => sum + c.opened, 0),
  };

  const openRate = stats.totalSent > 0 ? ((stats.totalOpened / stats.totalSent) * 100).toFixed(1) : '0';

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-300',
    scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
    sending: 'bg-violet-100 text-violet-700 border-violet-300',
    sent: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    paused: 'bg-amber-100 text-amber-700 border-amber-300',
  };

  const referralStatusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-300',
    contacted: 'bg-blue-100 text-blue-700 border-blue-300',
    converted: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    lost: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Marketing Hub</h1>
          <p className="text-sm text-gray-600 mt-1">Grow your business with campaigns and referrals</p>
        </div>
        <div className="flex gap-3">
          <Link href="/contractor/marketing/campaigns/new">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-gray-900 border-2 border-black shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <Send className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              <p className="text-sm text-gray-600">Total Campaigns</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Mail className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{openRate}%</p>
              <p className="text-sm text-gray-600">Open Rate</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-100">
              <Users className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
              <p className="text-sm text-gray-600">Total Referrals</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.convertedReferrals}</p>
              <p className="text-sm text-gray-600">Converted</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Campaigns */}
        <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
            <Link href="/contractor/marketing/campaigns">
              <Button variant="outline" size="sm" className="border-2 border-gray-300 hover:bg-gray-50">
                View All
              </Button>
            </Link>
          </div>
          <div className="p-5">
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-600 mb-4">No campaigns yet</p>
                <Link href="/contractor/marketing/campaigns/new">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-gray-900">
                    Create First Campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/contractor/marketing/campaigns/${campaign.id}`}
                    className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                          <Badge className={statusColors[campaign.status]}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {campaign.type === 'email' && <Mail className="h-3 w-3 text-gray-500" />}
                          {campaign.type === 'sms' && <MessageSquare className="h-3 w-3 text-gray-500" />}
                          <span className="text-sm text-gray-500">{campaign.type.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    {campaign.status === 'sent' && (
                      <div className="flex gap-4 text-sm text-gray-600 mt-2">
                        <span>Sent: {campaign.sent}</span>
                        <span>Opened: {campaign.opened}</span>
                        <span>Clicked: {campaign.clicked}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Referrals */}
        <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Referrals</h3>
            <Link href="/contractor/marketing/referrals">
              <Button variant="outline" size="sm" className="border-2 border-gray-300 hover:bg-gray-50">
                View All
              </Button>
            </Link>
          </div>
          <div className="p-5">
            {referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-600 mb-2">No referrals yet</p>
                <p className="text-sm text-gray-500">
                  Encourage customers to refer friends and family
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{referral.referredName}</h4>
                        <p className="text-sm text-gray-600">
                          Referred by {referral.referrer.name}
                        </p>
                      </div>
                      <Badge className={referralStatusColors[referral.status]}>
                        {referral.status}
                      </Badge>
                    </div>
                    {referral.referredEmail && (
                      <p className="text-sm text-gray-600">{referral.referredEmail}</p>
                    )}
                    {referral.referredPhone && (
                      <p className="text-sm text-gray-600">{referral.referredPhone}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Marketing Tools</h3>
        </div>
        <div className="p-5">
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/contractor/marketing/campaigns/new">
              <div className="rounded-lg bg-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-100 transition-all cursor-pointer h-full p-6 text-center">
                <Mail className="h-10 w-10 mx-auto text-violet-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Email Campaign</h3>
                <p className="text-sm text-gray-600">Send emails to your customers</p>
              </div>
            </Link>

            <Link href="/contractor/marketing/campaigns/new?type=sms">
              <div className="rounded-lg bg-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-100 transition-all cursor-pointer h-full p-6 text-center">
                <MessageSquare className="h-10 w-10 mx-auto text-emerald-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">SMS Campaign</h3>
                <p className="text-sm text-gray-600">Send text messages to customers</p>
              </div>
            </Link>

            <Link href="/contractor/marketing/referrals">
              <div className="rounded-lg bg-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-100 transition-all cursor-pointer h-full p-6 text-center">
                <Users className="h-10 w-10 mx-auto text-cyan-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Referral Program</h3>
                <p className="text-sm text-gray-600">Track customer referrals</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
