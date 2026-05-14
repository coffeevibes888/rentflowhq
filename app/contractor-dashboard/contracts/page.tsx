import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { resolveContractorAuth } from '@/lib/contractor-auth';
import { ContractsDashboard } from '@/components/contractor/contracts/contracts-dashboard';

export const metadata: Metadata = { title: 'Contracts' };

export default async function ContractsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const contractorAuth = await resolveContractorAuth(session.user.id);
  if (!contractorAuth) redirect('/onboarding/contractor');

  const db = prisma as any;
  const contracts = await db.contractorContract.findMany({
    where: { contractorId: contractorAuth.contractorId },
    select: {
      id: true,
      contractNumber: true,
      title: true,
      type: true,
      status: true,
      customerName: true,
      customerEmail: true,
      contractAmount: true,
      sentAt: true,
      signedAt: true,
      expiresAt: true,
      createdAt: true,
      job: { select: { title: true, jobNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Fetch jobs for the "link to job" dropdown in create modal
  const jobs = await db.contractorJob.findMany({
    where: { contractorId: contractorAuth.contractorId, status: { notIn: ['cancelled', 'paid'] } },
    select: { id: true, title: true, jobNumber: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className='w-full space-y-5'>
      <div>
        <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-black'>Contracts</h1>
        <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>Manage service agreements and contracts</p>
      </div>
      <ContractsDashboard
        initialContracts={JSON.parse(JSON.stringify(contracts))}
        jobs={JSON.parse(JSON.stringify(jobs))}
        appUrl={process.env.NEXT_PUBLIC_APP_URL || ''}
      />
    </div>
  );
}
