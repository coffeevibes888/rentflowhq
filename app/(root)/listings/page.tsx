import { Metadata } from 'next';
import { prisma } from '@/db/prisma';
import ListingsClient from './listings-client';

export const metadata: Metadata = {
  title: 'Find Your Perfect Home | Property Flow HQ',
  description: 'Browse available apartments, rooms, and homes for rent or sale in Las Vegas. Search by price, bedrooms, bathrooms, and location. Find your next home today.',
  keywords: ['apartments for rent', 'homes for rent', 'homes for sale', 'Las Vegas rentals', 'rental properties', 'real estate'],
  openGraph: {
    title: 'Find Your Perfect Home | Property Flow HQ',
    description: 'Browse available apartments, rooms, and homes for rent or sale in Las Vegas.',
    type: 'website',
  },
};

async function getListings(searchParams: {
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  type?: string;
  city?: string;
  q?: string;
  listingType?: string; // 'all', 'rent', 'sale'
}) {
  const { minPrice, maxPrice, bedrooms, bathrooms, type, city, q, listingType } = searchParams;

  // Build where clause for units (rental properties from landlords)
  const unitWhere: any = {
    isAvailable: true,
  };

  if (minPrice) {
    unitWhere.rentAmount = { ...unitWhere.rentAmount, gte: parseFloat(minPrice) };
  }
  if (maxPrice) {
    unitWhere.rentAmount = { ...unitWhere.rentAmount, lte: parseFloat(maxPrice) };
  }
  if (bedrooms && bedrooms !== 'any') {
    if (bedrooms === '4+') {
      unitWhere.bedrooms = { gte: 4 };
    } else {
      unitWhere.bedrooms = parseInt(bedrooms);
    }
  }
  if (bathrooms && bathrooms !== 'any') {
    if (bathrooms === '3+') {
      unitWhere.bathrooms = { gte: 3 };
    } else {
      unitWhere.bathrooms = parseFloat(bathrooms);
    }
  }
  if (type && type !== 'all') {
    unitWhere.type = type;
  }

  // Build where clause for agent listings
  const agentListingWhere: any = {
    status: 'active',
  };

  if (listingType && listingType !== 'all') {
    agentListingWhere.listingType = listingType === 'sale' ? 'sale' : 'rent';
  }

  if (minPrice) {
    agentListingWhere.price = { ...agentListingWhere.price, gte: parseFloat(minPrice) };
  }
  if (maxPrice) {
    agentListingWhere.price = { ...agentListingWhere.price, lte: parseFloat(maxPrice) };
  }
  if (bedrooms && bedrooms !== 'any') {
    if (bedrooms === '4+') {
      agentListingWhere.bedrooms = { gte: 4 };
    } else {
      agentListingWhere.bedrooms = parseInt(bedrooms);
    }
  }
  if (bathrooms && bathrooms !== 'any') {
    if (bathrooms === '3+') {
      agentListingWhere.bathrooms = { gte: 3 };
    } else {
      agentListingWhere.bathrooms = parseFloat(bathrooms);
    }
  }

  // Get available units with property info (only if showing rentals or all)
  let rentalListings: any[] = [];
  if (!listingType || listingType === 'all' || listingType === 'rent') {
    const units = await prisma.unit.findMany({
      where: unitWhere,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            address: true,
            type: true,
            videoUrl: true,
            virtualTourUrl: true,
            landlord: {
              select: {
                id: true,
                name: true,
                companyName: true,
                subdomain: true,
              },
            },
          },
        },
      },
      orderBy: { rentAmount: 'asc' },
    });

    let filteredUnits = units;
    
    if (city && city !== 'all') {
      filteredUnits = filteredUnits.filter(unit => {
        const address = unit.property.address as any;
        return address?.city?.toLowerCase().includes(city.toLowerCase());
      });
    }

    if (q) {
      const query = q.toLowerCase();
      filteredUnits = filteredUnits.filter(unit => {
        const address = unit.property.address as any;
        return (
          unit.property.name.toLowerCase().includes(query) ||
          unit.name.toLowerCase().includes(query) ||
          address?.city?.toLowerCase().includes(query) ||
          address?.street?.toLowerCase().includes(query) ||
          unit.property.description?.toLowerCase().includes(query)
        );
      });
    }

    // Transform rental units to listing format
    rentalListings = filteredUnits.map(unit => {
      const address = unit.property.address as any;
      return {
        id: unit.id,
        propertyId: unit.property.id,
        propertyName: unit.property.name,
        propertySlug: unit.property.slug,
        unitName: unit.name,
        type: unit.type,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms ? Number(unit.bathrooms) : null,
        sizeSqFt: unit.sizeSqFt,
        price: Number(unit.rentAmount),
        rentAmount: Number(unit.rentAmount),
        images: unit.images,
        amenities: unit.amenities,
        availableFrom: unit.availableFrom?.toISOString() || null,
        address: {
          street: address?.street || '',
          city: address?.city || '',
          state: address?.state || '',
          zip: address?.zip || '',
          lat: address?.lat || null,
          lng: address?.lng || null,
        },
        landlord: unit.property.landlord ? {
          name: unit.property.landlord.companyName || unit.property.landlord.name,
          subdomain: unit.property.landlord.subdomain,
        } : null,
        agent: null,
        hasVideo: !!unit.property.videoUrl,
        hasVirtualTour: !!unit.property.virtualTourUrl,
        listingType: 'rent' as const,
        source: 'property' as const,
      };
    });
  }

  // Get agent listings (for sale or rent)
  let agentListings: any[] = [];
  if (!listingType || listingType === 'all' || listingType === 'sale') {
    const agentListingsRaw = await prisma.agentListing.findMany({
      where: agentListingWhere,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            brokerage: true,
            user: {
              select: { image: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let filteredAgentListings = agentListingsRaw;

    if (city && city !== 'all') {
      filteredAgentListings = filteredAgentListings.filter(listing => {
        const address = listing.address as any;
        return address?.city?.toLowerCase().includes(city.toLowerCase());
      });
    }

    if (q) {
      const query = q.toLowerCase();
      filteredAgentListings = filteredAgentListings.filter(listing => {
        const address = listing.address as any;
        return (
          listing.title.toLowerCase().includes(query) ||
          address?.city?.toLowerCase().includes(query) ||
          address?.street?.toLowerCase().includes(query) ||
          listing.description?.toLowerCase().includes(query)
        );
      });
    }

    // Transform agent listings to common format
    agentListings = filteredAgentListings.map(listing => {
      const address = listing.address as any;
      return {
        id: listing.id,
        propertyId: null,
        propertyName: listing.title,
        propertySlug: listing.slug,
        unitName: null,
        type: listing.propertyType,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms ? Number(listing.bathrooms) : null,
        sizeSqFt: listing.sizeSqFt,
        price: Number(listing.price),
        rentAmount: listing.listingType === 'rent' ? Number(listing.price) : null,
        images: listing.images,
        amenities: listing.features || [],
        availableFrom: null,
        address: {
          street: address?.street || '',
          city: address?.city || '',
          state: address?.state || '',
          zip: address?.zip || '',
          lat: address?.lat || null,
          lng: address?.lng || null,
        },
        landlord: null,
        agent: listing.agent ? {
          id: listing.agent.id,
          name: listing.agent.name,
          subdomain: listing.agent.subdomain,
          brokerage: listing.agent.brokerage,
          image: listing.agent.user?.image,
        } : null,
        hasVideo: !!listing.videoUrl,
        hasVirtualTour: !!listing.virtualTourUrl,
        listingType: listing.listingType as 'sale' | 'rent',
        source: 'agent' as const,
      };
    });
  }

  // Combine and sort all listings
  const allListings = [...rentalListings, ...agentListings].sort((a, b) => a.price - b.price);

  // Get unique cities for filter (from both sources)
  const allUnits = await prisma.unit.findMany({
    where: { isAvailable: true },
    include: { property: { select: { address: true } } },
  });
  
  const allAgentListings = await prisma.agentListing.findMany({
    where: { status: 'active' },
    select: { address: true },
  });

  const citiesFromUnits = allUnits.map(u => (u.property.address as any)?.city).filter(Boolean);
  const citiesFromAgents = allAgentListings.map(l => (l.address as any)?.city).filter(Boolean);
  const cities = [...new Set([...citiesFromUnits, ...citiesFromAgents])].sort();

  // Get price range from both sources
  const unitPrices = allUnits.map(u => Number(u.rentAmount)).filter(p => p > 0);
  const agentPrices = allAgentListings.map(l => Number((l as any).price)).filter(p => p > 0);
  const allPrices = [...unitPrices, ...agentPrices];
  const minPriceVal = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPriceVal = allPrices.length > 0 ? Math.max(...allPrices) : 5000000;

  return {
    listings: allListings,
    filters: {
      cities,
      minPrice: minPriceVal,
      maxPrice: maxPriceVal,
    },
    total: allListings.length,
  };
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    type?: string;
    city?: string;
    q?: string;
    view?: string;
    listingType?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getListings(params);

  return <ListingsClient initialData={data} searchParams={params} />;
}
