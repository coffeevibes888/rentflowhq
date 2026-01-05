import { prisma } from '@/db/prisma';
import SubdomainHeader from '@/components/subdomain/subdomain-header';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
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
  
  // Check if we're on the application page to hide the header
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isApplicationPage = pathname.includes('/application');
  
  // Get landlord for header - only select fields needed by SubdomainHeader
  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
    select: {
      id: true,
      name: true,
      subdomain: true,
      logoUrl: true,
      companyName: true,
      companyEmail: true,
      companyPhone: true,
      themeColor: true,
      owner: {
        select: {
          email: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!landlord) {
    notFound();
  }

  const session = await auth();

  return (
    <SessionProviderWrapper>
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-600 text-black">
        {!isApplicationPage && <SubdomainHeader landlord={landlord} />}
        {children}
      </div>
    </SessionProviderWrapper>
  );
}
