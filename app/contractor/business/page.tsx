import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { MyBusinessTabs } from '@/components/contractor/my-business-tabs';

export default async function MyBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { 
      id: true, 
      businessName: true,
      stripeConnectAccountId: true,
    },
  });

  if (!contractorProfile) {
    redirect('/onboarding/contractor');
  }

  const params = await searchParams;
  const activeTab = params.tab || 'portfolio';

  // Fetch data for each tab
  const [portfolioItems, disputes] = await Promise.all([
    // Portfolio items
    prisma.contractorPortfolioItem.findMany({
      where: { contractorId: contractorProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    
    // Disputes
    prisma.dispute.findMany({
      where: {
        OR: [
          { filedById: session.user.id },
          { 
            contractorId: contractorProfile.id,
          },
        ],
      },
      include: {
        filedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        landlord: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Get landlords from work orders
  const workOrders = await prisma.workOrder.findMany({
    where: { contractorId: contractorProfile.id },
    select: {
      landlord: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    distinct: ['landlordId'],
  });

  // Count jobs per landlord
  const landlords = await Promise.all(
    workOrders.map(async (wo) => {
      const count = await prisma.workOrder.count({
        where: {
          contractorId: contractorProfile.id,
          landlordId: wo.landlord.id,
        },
      });
      return {
        ...wo.landlord,
        email: '', // Landlord model doesn't have email
        _count: { workOrders: count },
      };
    })
  );

  // Get payouts - simplified without a dedicated model
  const payouts: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-600">My Business</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your portfolio, relationships, and business operations
        </p>
      </div>

      <MyBusinessTabs
        activeTab={activeTab}
        portfolioItems={portfolioItems}
        landlords={landlords}
        disputes={disputes}
        payouts={payouts}
        contractorId={contractorProfile.id}
        hasStripeAccount={!!contractorProfile.stripeConnectAccountId}
      />
    </div>
  );
}
