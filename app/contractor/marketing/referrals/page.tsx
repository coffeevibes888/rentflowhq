import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default async function ReferralsPage() {
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

  const referrals = await prisma.contractorReferral.findMany({
    where: { contractorId: contractorProfile.id },
    include: {
      referrer: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === 'pending').length,
    contacted: referrals.filter(r => r.status === 'contacted').length,
    converted: referrals.filter(r => r.status === 'converted').length,
    lost: referrals.filter(r => r.status === 'lost').length,
    totalValue: referrals
      .filter(r => r.status === 'converted' && r.convertedValue)
      .reduce((sum, r) => sum + (r.convertedValue || 0), 0),
  };

  const conversionRate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : '0';

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/30 text-amber-200',
    contacted: 'bg-blue-500/30 text-blue-200',
    converted: 'bg-emerald-500/30 text-emerald-200',
    lost: 'bg-red-500/30 text-red-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contractor/marketing">
          <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Referral Management</h1>
          <p className="text-white/70 mt-1">Track and manage customer referrals</p>
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
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-white/70">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.converted}</p>
                <p className="text-sm text-white/70">Converted ({conversionRate}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <DollarSign className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</p>
                <p className="text-sm text-white/70">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Users className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-sm text-white/70">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals List */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">All Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-white/30 mb-4" />
              <p className="text-white/70 mb-2">No referrals yet</p>
              <p className="text-sm text-white/50">
                Encourage your customers to refer friends and family
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{referral.referredName}</h4>
                        <Badge className={statusColors[referral.status]}>
                          {referral.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/60">
                        Referred by {referral.referrer.name}
                      </p>
                    </div>
                    {referral.convertedValue && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-300">
                          ${referral.convertedValue.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/60">Job Value</p>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    {referral.referredEmail && (
                      <div>
                        <span className="text-white/60">Email: </span>
                        <span className="text-white">{referral.referredEmail}</span>
                      </div>
                    )}
                    {referral.referredPhone && (
                      <div>
                        <span className="text-white/60">Phone: </span>
                        <span className="text-white">{referral.referredPhone}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-white/60">Date: </span>
                      <span className="text-white">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {referral.notes && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-sm text-white/70">{referral.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
