import { prisma } from '@/db/prisma';
import SubdomainHeader from '@/components/subdomain/subdomain-header';
import { notFound } from 'next/navigation';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import { auth } from '@/auth';

export default async function SubdomainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  
  // Get landlord for header
  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
    include: {
      owner: true,
    },
  });

  if (!landlord) {
    notFound();
  }

  const session = await auth();

  return (
    <SessionProviderWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <SubdomainHeader landlord={landlord} />
        {children}
      </div>
    </SessionProviderWrapper>
  );
}
