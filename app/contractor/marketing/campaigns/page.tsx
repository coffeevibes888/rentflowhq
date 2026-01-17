import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Mail, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default async function CampaignsListPage() {
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

  const campaigns = await prisma.contractorMarketingCampaign.findMany({
    where: { contractorId: contractorProfile.id },
    orderBy: { createdAt: 'desc' },
  });

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/30 text-gray-200',
    scheduled: 'bg-blue-500/30 text-blue-200',
    sending: 'bg-violet-500/30 text-violet-200',
    sent: 'bg-emerald-500/30 text-emerald-200',
    paused: 'bg-amber-500/30 text-amber-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contractor/marketing">
          <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">All Campaigns</h1>
          <p className="text-white/70 mt-1">Manage your marketing campaigns</p>
        </div>
        <Link href="/contractor/marketing/campaigns/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 mx-auto text-white/30 mb-4" />
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
                        {campaign.scheduledFor && (
                          <>
                            <span className="text-white/40">•</span>
                            <span className="text-sm text-white/60">
                              Scheduled: {new Date(campaign.scheduledFor).toLocaleDateString()}
                            </span>
                          </>
                        )}
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
    </div>
  );
}
