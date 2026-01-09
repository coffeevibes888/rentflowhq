import { prisma } from '@/db/prisma';
import ContractorSubdomainHeader from '@/components/contractor-subdomain/contractor-header';
import { notFound } from 'next/navigation';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import { auth } from '@/auth';

export default async function ContractorSubdomainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  
  // Get contractor profile for header
  const contractor = await prisma.contractorProfile.findUnique({
    where: { subdomain },
    select: {
      id: true,
      businessName: true,
      displayName: true,
      subdomain: true,
      logoUrl: true,
      email: true,
      phone: true,
      themeColor: true,
      slug: true,
    },
  });

  if (!contractor) {
    notFound();
  }

  const session = await auth();

  return (
    <SessionProviderWrapper>
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-600 text-black">
        <ContractorSubdomainHeader contractor={contractor} />
        {children}
      </div>
    </SessionProviderWrapper>
  );
}
