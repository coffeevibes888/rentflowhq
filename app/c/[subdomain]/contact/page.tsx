import { prisma } from '@/db/prisma';
import { notFound } from 'next/navigation';
import ContractorContactClient from './contact-client';

export default async function ContractorContactPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const contractor = await prisma.contractorProfile.findUnique({
    where: { subdomain },
  });

  if (!contractor) {
    return notFound();
  }

  const brandName = contractor.businessName;
  const location = [contractor.baseCity, contractor.baseState].filter(Boolean).join(', ');

  return (
    <ContractorContactClient
      brandName={brandName}
      brandEmail={contractor.email}
      brandPhone={contractor.phone}
      location={location}
      logoUrl={contractor.logoUrl}
      subdomain={subdomain}
      slug={contractor.slug}
    />
  );
}
