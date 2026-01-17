import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, MessageSquare, Users, Eye, MousePointerClick } from 'lucide-react';
import Link from 'next/link';

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
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

  const campaign = await prisma.contractorMarketingCampaign.findUnique({
    where: {
      id: params.id,
      contractorId: contractorProfile.id,
    },
  });

  if (!campaign) {
    return redirect('/contractor/marketing');
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/30 text-gray-200',
    scheduled: 'bg-blue-500/30 text-blue-200',
    sending: 'bg-violet-500/30 text-violet-200',
    sent: 'bg-emerald-500/30 text-emerald-200',
    paused: 'bg-amber-500/30 text-amber-200',
  };

  const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : '0';
  const clickRate = campaign.sent > 0 ? ((campaign.clicked / campaign.sent) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contractor/marketing">
          <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
            <Badge className={statusColors[campaign.status]}>
              {campaign.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {campaign.type === 'email' && <Mail className="h-4 w-4 text-white/60" />}
            {campaign.type === 'sms' && <MessageSquare className="h-4 w-4 text-white/60" />}
            <p className="text-white/70">{campaign.type.toUpperCase()} Campaign</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Users className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{campaign.sent}</p>
                <p className="text-sm text-white/70">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Eye className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{campaign.opened}</p>
                <p className="text-sm text-white/70">Opened ({openRate}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <MousePointerClick className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{campaign.clicked}</p>
                <p className="text-sm text-white/70">Clicked ({clickRate}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Mail className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{campaign.bounced}</p>
                <p className="text-sm text-white/70">Bounced</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Content */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Campaign Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.subject && (
            <div>
              <Label className="text-white/70 text-sm">Subject</Label>
              <p className="text-white mt-1">{campaign.subject}</p>
            </div>
          )}
          <div>
            <Label className="text-white/70 text-sm">Message</Label>
            <div className="mt-1 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-white whitespace-pre-wrap">{campaign.message}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-sm">Target Audience</Label>
              <p className="text-white mt-1 capitalize">{campaign.targetAudience}</p>
            </div>
            {campaign.scheduledFor && (
              <div>
                <Label className="text-white/70 text-sm">Scheduled For</Label>
                <p className="text-white mt-1">
                  {new Date(campaign.scheduledFor).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
