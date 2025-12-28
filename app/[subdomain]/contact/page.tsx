import { prisma } from '@/db/prisma';
import { notFound } from 'next/navigation';
import SubdomainContactClient from './contact-client';

export default async function SubdomainContactPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
    include: {
      owner: {
        select: {
          email: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!landlord) {
    return notFound();
  }

  const brandName = landlord.companyName || landlord.name;
  const brandEmail = landlord.companyEmail || landlord.owner?.email || null;
  const brandPhone = landlord.companyPhone || landlord.owner?.phoneNumber || null;
  const brandAddress = landlord.companyAddress || null;
  const logoUrl = landlord.logoUrl || null;

  return (
    <SubdomainContactClient
      brandName={brandName}
      brandEmail={brandEmail}
      brandPhone={brandPhone}
      brandAddress={brandAddress}
      logoUrl={logoUrl}
      subdomain={subdomain}
    />
  );
}
