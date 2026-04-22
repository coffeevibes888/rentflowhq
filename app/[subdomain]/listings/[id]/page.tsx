import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { detectSubdomainEntity } from '@/lib/utils/subdomain-detection';
import PublicListingDetail from './public-listing-detail';

interface PublicListingPageProps {
  params: Promise<{ subdomain: string; id: string }>;
}

export async function generateMetadata({ params }: PublicListingPageProps): Promise<Metadata> {
  const { subdomain, id } = await params;
  
  const entity = await detectSubdomainEntity(subdomain);
  if (entity.type !== 'agent') {
    return { title: 'Not Found' };
  }

  const listing = await prisma.agentListing.findFirst({
    where: {
      id,
      agentId: entity.data.id,
      status: { in: ['active', 'pending'] },
    },
    select: { title: true, description: true, address: true, images: true },
  });

  if (!listing) {
    return { title: 'Listing Not Found' };
  }

  const address = listing.address as any;
  
  return {
    title: `${listing.title} | ${entity.data.name}`,
    description: listing.description?.slice(0, 160) || `View this property in ${address?.city || ''}`,
    openGraph: {
      title: listing.title,
      description: listing.description?.slice(0, 160) || '',
      images: listing.images?.[0] ? [{ url: listing.images[0] }] : [],
    },
  };
}

export default async function PublicListingPage({ params }: PublicListingPageProps) {
  const { subdomain, id } = await params;

  // Verify this is an agent subdomain
  const entity = await detectSubdomainEntity(subdomain);
  if (entity.type !== 'agent') {
    notFound();
  }

  const agent = entity.data;

  // Fetch the listing
  const listing = await prisma.agentListing.findFirst({
    where: {
      id,
      agentId: agent.id,
      status: { in: ['active', 'pending'] },
    },
    include: {
      openHouses: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  // Get similar listings from same agent
  const similarListings = await prisma.agentListing.findMany({
    where: {
      agentId: agent.id,
      id: { not: id },
      status: 'active',
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <PublicListingDetail
      listing={listing}
      agent={agent}
      openHouses={listing.openHouses}
      similarListings={similarListings}
      subdomain={subdomain}
    />
  );
}
