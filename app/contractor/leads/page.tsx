import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import LeadsClient from './leads-client';

export default async function ContractorLeadsPage() {
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

  // Get lead matches for this contractor
  const leadMatches = await prisma.contractorLeadMatch.findMany({
    where: {
      contractorId: contractorProfile.id,
    },
    include: {
      lead: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get lead credit balance
  const leadCredit = await prisma.contractorLeadCredit.findUnique({
    where: { contractorId: contractorProfile.id },
  });

  return (
    <LeadsClient
      leadMatches={leadMatches}
      leadCredit={leadCredit}
      contractor={contractorProfile}
    />
  );
}
