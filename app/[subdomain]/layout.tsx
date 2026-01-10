import { prisma } from '@/db/prisma';
import SubdomainHeader from '@/components/subdomain/subdomain-header';
import ContractorSubdomainHeader from '@/components/contractor-subdomain/contractor-header';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import SessionProviderWrapper from '@/components/session-provider-wrapper';
import { auth } from '@/auth';
import { detectSubdomainEntity } from '@/lib/utils/subdomain-detection';

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
  
  // Detect whether this subdomain belongs to a landlord or contractor
  const entity = await detectSubdomainEntity(subdomain);
  
  if (entity.type === 'not_found') {
    notFound();
  }

  const session = await auth();

  // Render appropriate header based on entity type
  const renderHeader = () => {
    if (isApplicationPage) return null;
    
    if (entity.type === 'landlord') {
      return <SubdomainHeader landlord={entity.data} />;
    }
    
    if (entity.type === 'contractor') {
      // Map contractor data to header props
      return (
        <ContractorSubdomainHeader
          contractor={{
            id: entity.data.id,
            businessName: entity.data.businessName,
            displayName: entity.data.displayName,
            subdomain: entity.data.subdomain,
            logoUrl: entity.data.logoUrl,
            email: entity.data.email,
            phone: entity.data.phone,
            themeColor: entity.data.themeColor,
            slug: entity.data.slug,
          }}
          useRootPath={true}
        />
      );
    }
    
    return null;
  };

  return (
    <SessionProviderWrapper>
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-600 text-black">
        {renderHeader()}
        {children}
      </div>
    </SessionProviderWrapper>
  );
}
