import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';

export default async function ContractorLeadsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect('/sign-in');

  const contractor = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!contractor) return redirect('/contractor/profile/branding'); // Redirect to onboarding if no profile

  const matches = await prisma.contractorLeadMatch.findMany({
    where: { contractorId: contractor.id },
    include: { lead: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Leads</h1>
        <p className="text-white/70 mt-1">Manage your potential jobs</p>
      </div>

      <div className="grid gap-4">
        {matches.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-8 text-center text-white/70">
                    No leads found. Update your service areas and specialties to get more matches.
                </CardContent>
            </Card>
        ) : (
            matches.map(match => (
                <Link key={match.id} href={`/contractor/leads/${match.lead.id}`}>
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold text-white">{match.lead.projectType}</h3>
                                        <Badge className={
                                            match.status === 'new' || match.status === 'pending' ? 'bg-emerald-500/20 text-emerald-300' : 
                                            'bg-slate-500/20 text-slate-300'
                                        }>
                                            {match.status.replace('_', ' ')}
                                        </Badge>
                                        <span className="text-sm text-white/50">
                                            Match Score: {match.matchScore}%
                                        </span>
                                    </div>
                                    <p className="text-white/70 mb-4 line-clamp-2">{match.lead.projectDescription}</p>
                                    <div className="flex gap-4 text-sm text-white/50">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {match.lead.propertyCity}, {match.lead.propertyState}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(match.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))
        )}
      </div>
    </div>
  );
}
