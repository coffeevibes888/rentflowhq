import { Metadata } from 'next';
import { requireContractor } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, CheckCircle, AlertTriangle, ClipboardCheck, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Safety & Compliance | Contractor Portal',
};

export default async function SafetyPage() {
  const session = await requireContractor();
  const { id: userId } = session.user;

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!contractorProfile) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Safety & Compliance</h1>
        <p className="text-muted-foreground">Contractor profile not found.</p>
      </div>
    );
  }

  // Fetch safety checklists and completions
  const checklists = await prisma.$queryRaw`
    SELECT * FROM "ContractorSafetyChecklist"
    WHERE "contractorId" = ${contractorProfile.id} AND "isActive" = true
    ORDER BY "category" ASC
  `;

  const completions = await prisma.$queryRaw`
    SELECT * FROM "ContractorSafetyChecklistCompletion"
    WHERE "contractorId" = ${contractorProfile.id}
    ORDER BY "completedAt" DESC
    LIMIT 10
  `;

  const checklistList = Array.isArray(checklists) ? checklists : [];
  const completionList = Array.isArray(completions) ? completions : [];

  const oshaCount = checklistList.filter((c: any) => c.category === 'osha_daily').length;
  const jobSpecificCount = checklistList.filter((c: any) => c.category === 'job_specific').length;
  const completedToday = completionList.filter((c: any) => {
    const completed = new Date(c.completedAt);
    const today = new Date();
    return completed.toDateString() === today.toDateString();
  }).length;
  const issuesFound = completionList.reduce((acc: number, c: any) => acc + (c.issuesFound || 0), 0);

  return (
    <div className="relative rounded-2xl border border-rose-200 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-100 via-orange-50 to-rose-100" />
      <div className="relative p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Safety & Compliance</h1>
          <p className="text-slate-600">OSHA checklists, incident reports, and safety training</p>
        </div>
        <div className="flex gap-2">
          <Link href="/contractor/safety/checklists">
            <Button variant="outline" className="border-rose-200 hover:bg-rose-50">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Manage Checklists
            </Button>
          </Link>
          <Link href="/contractor/safety/new-checklist">
            <Button className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              New Checklist
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-rose-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-rose-600" />
              <span className="text-sm font-medium">OSHA Checklists</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{oshaCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-orange-50 border-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-rose-600" />
              <span className="text-sm font-medium">Job Specific</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{jobSpecificCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Completed Today</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{completedToday}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium">Issues Found</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{issuesFound}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/contractor/safety/osha-daily">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">OSHA Daily Checklist</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete daily safety inspection before starting work
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/contractor/safety/incidents">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Incident Reports</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Log safety incidents, injuries, and property damage
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/contractor/safety/training">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-violet-100 text-violet-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Training Records</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track employee certifications and safety training
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Completions */}
      <Card className="border-rose-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-900">Recent Safety Checklist Completions</CardTitle>
        </CardHeader>
        <CardContent>
          {completionList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No safety checklists completed yet</p>
            </div>
          ) : (
            <div className="divide-y divide-rose-100">
              {completionList.map((c: any) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {c.allItemsChecked ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {c.allItemsChecked ? 'All items passed' : `${c.issuesFound} issues found`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Completed {new Date(c.completedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={c.allItemsChecked ? 'default' : 'destructive'}>
                    {c.allItemsChecked ? 'Passed' : 'Issues'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
