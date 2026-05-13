import { Metadata } from 'next';
import { prisma } from '@/db/prisma';
import { unstable_cache } from 'next/cache';
import ListingsClient from './listings-client';
import JsonLdScript from '@/components/seo/json-ld-script';
import { canonicalUrl, listingsDirectoryLd, breadcrumbLd } from '@/lib/seo';

type ListingsPageSearchParams = {
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  type?: string;
  city?: string;
  q?: string;
  view?: string;
  listingType?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ListingsPageSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const city = params.city && params.city !== 'all' ? params.city : null;
  const listingType = params.listingType;

  const locationLabel = city ? ` in ${city}` : ' Near You';
  const typeLabel =
    listingType === 'sale' ? 'Homes for Sale'
    : listingType === 'rent' ? 'Apartments & Rentals'
    : 'Apartments, Rooms & Homes for Rent';

  const title = `${typeLabel}${locationLabel} | Property Flow HQ`;
  const description = city
    ? `Browse available ${typeLabel.toLowerCase()} in ${city}. Filter by price, bedrooms, bathrooms, and more. Find your next home today.`
    : `Browse apartments, rooms, and homes for rent or sale. Search by city, price, and bedrooms. Find your next home on Property Flow HQ.`;

  const canonical = canonicalUrl('/listings');

  return {
    title,
    description,
    alternates: { canonical },
    keywords: [
      'apartments for rent',
      'rooms for rent',
      'homes for rent',
      'homes for sale',
      city ? `apartments for rent in ${city}` : 'rental properties near me',
      city ? `homes for rent in ${city}` : 'find a rental',
      'property listings',
      'real estate',
    ].filter(Boolean) as string[],
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: 'Property Flow HQ',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// Cache filter options for 5 minutes (cities, price ranges)
const getCachedFilterOptions = unstable_cache(
  async () => {
    const [allUnits, allAgentListings] = await Promise.all([
      prisma.unit.findMany({
        where: { 
          isAvailable: true,
          property: {
            status: { not: 'deleted' }, // Exclude deleted properties
            landlord: {
              ownerUserId: { not: null },
            },
          },
        },
        include: { property: { select: { address: true } } },
      }),
      prisma.agentListing.findMany({
        where: { status: 'active' },
        select: { address: true, price: true },
      }),
    ]);

    const citiesFromUnits = allUnits.map(u => (u.property.address as any)?.city).filter(Boolean);
    const citiesFromAgents = allAgentListings.map(l => (l.address as any)?.city).filter(Boolean);
    const cities = [...new Set([...citiesFromUnits, ...citiesFromAgents])].sort();

    const unitPrices = allUnits.map(u => Number(u.rentAmount)).filter(p => p > 0);
    const agentPrices = allAgentListings.map(l => Number((l as any).price)).filter(p => p > 0);
    const allPrices = [...unitPrices, ...agentPrices];
    const minPriceVal = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPriceVal = allPrices.length > 0 ? Math.max(...allPrices) : 5000000;

    return { cities, minPrice: minPriceVal, maxPrice: maxPriceVal };
  },
  ['listings-filter-options'],
  { revalidate: 300 }
);

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
      where: {
        ...unitWhere,
        property: {
          status: { not: 'deleted' }, // Exclude deleted properties
          landlord: {
            ownerUserId: { not: null }, // Only include properties from landlords with valid user accounts
          },
        },
      },
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
    // Group units by property for apartment complexes (type === 'apartment' with multiple units)
    const unitsByProperty = new Map<string, typeof filteredUnits>();
    
    filteredUnits.forEach(unit => {
      const propertyId = unit.property.id;
      if (!unitsByProperty.has(propertyId)) {
        unitsByProperty.set(propertyId, []);
      }
      unitsByProperty.get(propertyId)!.push(unit);
    });

    rentalListings = [];
    
    unitsByProperty.forEach((propertyUnits, propertyId) => {
      const firstUnit = propertyUnits[0];
      const property = firstUnit.property;
      const address = property.address as any;
      const isApartmentComplex = property.type === 'apartment' && propertyUnits.length > 3;
      
      if (isApartmentComplex) {
        // For apartment complexes, create a single listing with aggregated data
        const prices = propertyUnits.map(u => Number(u.rentAmount)).filter(p => p > 0);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const bedrooms = propertyUnits.map(u => u.bedrooms || 0);
        const minBeds = Math.min(...bedrooms);
        const maxBeds = Math.max(...bedrooms);
        
        rentalListings.push({
          id: propertyId, // Use property ID for complex
          propertyId: property.id,
          propertyName: property.name,
          propertySlug: property.slug,
          unitName: null,
          type: 'apartment',
          bedrooms: minBeds === maxBeds ? minBeds : null, // null indicates range
          bedroomRange: minBeds !== maxBeds ? { min: minBeds, max: maxBeds } : null,
          bathrooms: null,
          sizeSqFt: null,
          price: minPrice,
          priceRange: minPrice !== maxPrice ? { min: minPrice, max: maxPrice } : null,
          rentAmount: minPrice,
          images: firstUnit.images?.length ? firstUnit.images : propertyUnits.find(u => u.images?.length)?.images || [],
          amenities: [...new Set(propertyUnits.flatMap(u => u.amenities || []))],
          availableFrom: null,
          address: {
            street: address?.street || '',
            city: address?.city || '',
            state: address?.state || '',
            zip: address?.zip || '',
            lat: address?.lat || null,
            lng: address?.lng || null,
          },
          landlord: property.landlord ? {
            name: property.landlord.companyName || property.landlord.name,
            subdomain: property.landlord.subdomain,
          } : null,
          agent: null,
          hasVideo: !!property.videoUrl,
          hasVirtualTour: !!property.virtualTourUrl,
          listingType: 'rent' as const,
          source: 'property' as const,
          isApartmentComplex: true,
          unitCount: propertyUnits.length,
        });
      } else {
        // For regular properties, list each unit separately
        propertyUnits.forEach(unit => {
          rentalListings.push({
            id: unit.id,
            propertyId: property.id,
            propertyName: property.name,
            propertySlug: property.slug,
            unitName: unit.name,
            type: unit.type,
            bedrooms: unit.bedrooms,
            bedroomRange: null,
            bathrooms: unit.bathrooms ? Number(unit.bathrooms) : null,
            sizeSqFt: unit.sizeSqFt,
            price: Number(unit.rentAmount),
            priceRange: null,
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
            landlord: property.landlord ? {
              name: property.landlord.companyName || property.landlord.name,
              subdomain: property.landlord.subdomain,
            } : null,
            agent: null,
            hasVideo: !!property.videoUrl,
            hasVirtualTour: !!property.virtualTourUrl,
            listingType: 'rent' as const,
            source: 'property' as const,
            isApartmentComplex: false,
            unitCount: 1,
          });
        });
      }
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

  // Use cached filter options
  const filters = await getCachedFilterOptions();

  return {
    listings: allListings,
    filters,
    total: allListings.length,
  };
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<ListingsPageSearchParams>;
}) {
  const params = await searchParams;
  const data = await getListings(params);

  // Build ItemList JSON-LD so Google understands this is a property directory
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.propertyflowhq.com';
  const listingItems = data.listings.map((l: any) => {
    const isAgent = l.source === 'agent';
    const url = isAgent
      ? `${baseUrl}/${l.agent?.subdomain}/listings/${l.propertySlug}`
      : `${baseUrl}/${l.landlord?.subdomain}/properties/${l.propertySlug}`;
    return {
      url,
      name: l.propertyName,
      description: null as string | null,
      image: l.images?.[0] || null,
      price: l.price,
      city: l.address?.city || null,
      state: l.address?.state || null,
    };
  });

  const city = params.city && params.city !== 'all' ? params.city : null;
  const directoryTitle = city
    ? `Apartments & Homes for Rent in ${city}`
    : 'Apartments, Rooms & Homes for Rent';
  const directoryDescription = city
    ? `Browse ${data.total} available rentals in ${city} on Property Flow HQ.`
    : `Browse ${data.total} available apartments, rooms, and homes for rent on Property Flow HQ.`;

  const ldData = [
    listingsDirectoryLd({
      url: canonicalUrl('/listings'),
      name: directoryTitle,
      description: directoryDescription,
      items: listingItems,
    }),
    breadcrumbLd([
      { name: 'Home', path: '/' },
      { name: 'Listings', path: '/listings' },
      ...(city ? [{ name: city, path: `/listings?city=${encodeURIComponent(city)}` }] : []),
    ]),
  ];

  return (
    <>
      <JsonLdScript data={ldData} id="listings-directory-ld" />
      <ListingsClient initialData={data} searchParams={params} />
    </>
  );
}
