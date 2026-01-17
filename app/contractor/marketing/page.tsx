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
    draft: 'bg-gray-500/30 text-gray-200',
    scheduled: 'bg-blue-500/30 text-blue-200',
    sending: 'bg-violet-500/30 text-violet-200',
    sent: 'bg-emerald-500/30 text-emerald-200',
    paused: 'bg-amber-500/30 text-amber-200',
  };

  const referralStatusColors: Record<string, string> = {
    pending: 'bg-amber-500/30 text-amber-200',
    contacted: 'bg-blue-500/30 text-blue-200',
    converted: 'bg-emerald-500/30 text-emerald-200',
    lost: 'bg-red-500/30 text-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketing Hub</h1>
          <p className="text-white/70 mt-1">Grow your business with campaigns and referrals</p>
        </div>
        <div className="flex gap-3">
          <Link href="/contractor/marketing/campaigns/new">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Send className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalCampaigns}</p>
                <p className="text-sm text-white/70">Total Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Mail className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{openRate}%</p>
                <p className="text-sm text-white/70">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Users className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
                <p className="text-sm text-white/70">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <TrendingUp className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.convertedReferrals}</p>
                <p className="text-sm text-white/70">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Campaigns */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recent Campaigns</CardTitle>
            <Link href="/contractor/marketing/campaigns">
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto text-white/30 mb-4" />
                <p className="text-white/70 mb-4">No campaigns yet</p>
                <Link href="/contractor/marketing/campaigns/new">
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white">
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
                    className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{campaign.name}</h4>
                          <Badge className={statusColors[campaign.status]}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {campaign.type === 'email' && <Mail className="h-3 w-3 text-white/60" />}
                          {campaign.type === 'sms' && <MessageSquare className="h-3 w-3 text-white/60" />}
                          <span className="text-sm text-white/60">{campaign.type.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    {campaign.status === 'sent' && (
                      <div className="flex gap-4 text-sm text-white/60 mt-2">
                        <span>Sent: {campaign.sent}</span>
                        <span>Opened: {campaign.opened}</span>
                        <span>Clicked: {campaign.clicked}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referrals */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recent Referrals</CardTitle>
            <Link href="/contractor/marketing/referrals">
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-white/30 mb-4" />
                <p className="text-white/70 mb-2">No referrals yet</p>
                <p className="text-sm text-white/50">
                  Encourage customers to refer friends and family
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{referral.referredName}</h4>
                        <p className="text-sm text-white/60">
                          Referred by {referral.referrer.name}
                        </p>
                      </div>
                      <Badge className={referralStatusColors[referral.status]}>
                        {referral.status}
                      </Badge>
                    </div>
                    {referral.referredEmail && (
                      <p className="text-sm text-white/60">{referral.referredEmail}</p>
                    )}
                    {referral.referredPhone && (
                      <p className="text-sm text-white/60">{referral.referredPhone}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Marketing Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/contractor/marketing/campaigns/new">
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 text-center">
                  <Mail className="h-10 w-10 mx-auto text-violet-300 mb-3" />
                  <h3 className="font-semibold text-white mb-2">Email Campaign</h3>
                  <p className="text-sm text-white/60">Send emails to your customers</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/contractor/marketing/campaigns/new?type=sms">
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-emerald-300 mb-3" />
                  <h3 className="font-semibold text-white mb-2">SMS Campaign</h3>
                  <p className="text-sm text-white/60">Send text messages to customers</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/contractor/marketing/referrals">
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 text-center">
                  <Users className="h-10 w-10 mx-auto text-cyan-300 mb-3" />
                  <h3 className="font-semibold text-white mb-2">Referral Program</h3>
                  <p className="text-sm text-white/60">Track customer referrals</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
