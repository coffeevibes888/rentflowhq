import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { VerificationClient } from './verification-client';

export const metadata = {
  title: 'Verification | Contractor Dashboard',
  description: 'Complete your contractor verification',
};

export default async function ContractorVerificationPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'contractor') {
    redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  const verification = await prisma.contractorVerification.findUnique({
    where: { contractorId: contractorProfile.id },
    include: {
      reviewer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const documents = await prisma.contractorVerificationDocument.findMany({
    where: { contractorId: contractorProfile.id },
    orderBy: { uploadedAt: 'desc' },
    include: {
      reviewer: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <div className="container max-w-6xl py-8">
      <VerificationClient
        verification={verification ? JSON.parse(JSON.stringify(verification)) : null}
        documents={JSON.parse(JSON.stringify(documents))}
      />
    </div>
  );
}
