import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { notFound } from 'next/navigation';
import JobDetailClient from './job-detail-client';

export default async function HomeownerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'homeowner') {
    return redirect('/');
  }

  // Get homeowner profile
  const homeowner = await prisma.homeowner.findUnique({
    where: { userId: session.user.id },
  });

  if (!homeowner) {
    return redirect('/homeowner/dashboard');
  }

  // Get work order with bids
  const workOrder = await prisma.homeownerWorkOrder.findFirst({
    where: {
      id,
      homeownerId: homeowner.id,
    },
    include: {
      bids: {
        include: {
          // We'll need to join with ContractorProfile to get contractor details
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!workOrder) {
    return notFound();
  }

  // Get contractor details for each bid
  const bidsWithContractors = await Promise.all(
    workOrder.bids.map(async (bid) => {
      const contractor = await prisma.contractorProfile.findUnique({
        where: { id: bid.contractorId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      });

      return {
        ...bid,
        contractor,
      };
    })
  );

  // Get escrow hold if job is completed
  let escrowHold = null;
  let assignedContractor = null;
  
  if (workOrder.status === 'completed' && workOrder.contractorId) {
    escrowHold = await prisma.jobGuaranteeHold.findFirst({
      where: {
        jobId: id,
        status: 'held',
      },
    });

    assignedContractor = await prisma.contractorProfile.findUnique({
      where: { id: workOrder.contractorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });
  }

  return (
    <JobDetailClient
      workOrder={{
        ...workOrder,
        bids: bidsWithContractors,
      }}
      currentUser={{
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image,
      }}
      escrowHold={escrowHold}
      assignedContractor={assignedContractor}
    />
  );
}
