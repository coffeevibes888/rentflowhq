import { Metadata } from 'next';
import { prisma } from '@/db/prisma';
import ListingsClient from './listings-client';

export const metadata: Metadata = {
  title: 'Find Your Perfect Home | Rooms For Rent LV',
  description: 'Browse available apartments, rooms, and homes for rent in Las Vegas. Search by price, bedrooms, bathrooms, and location. Find your next home today.',
  keywords: ['apartments for rent', 'rooms for rent', 'Las Vegas rentals', 'homes for rent', 'rental properties'],
  openGraph: {
    title: 'Find Your Perfect Home | Rooms For Rent LV',
    description: 'Browse available apartments, rooms, and homes for rent in Las Vegas.',
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
}) {
  const { minPrice, maxPrice, bedrooms, bathrooms, type, city, q } = searchParams;

  // Build where clause for units - filter active properties in JS since status may not exist yet
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

  // Get available units with property info
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

  // All units from available properties (status field will be used after migration)
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

  // Transform to listing format
  const listings = filteredUnits.map(unit => {
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
      hasVideo: !!unit.property.videoUrl,
      hasVirtualTour: !!unit.property.virtualTourUrl,
    };
  });

  // Get unique cities for filter
  const allUnits = await prisma.unit.findMany({
    where: { isAvailable: true },
    include: { property: { select: { address: true } } },
  });
  
  const cities = [...new Set(
    allUnits
      .map(u => (u.property.address as any)?.city)
      .filter(Boolean)
  )].sort();

  // Get price range
  const prices = allUnits.map(u => Number(u.rentAmount)).filter(p => p > 0);
  const minPriceVal = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPriceVal = prices.length > 0 ? Math.max(...prices) : 5000;

  return {
    listings,
    filters: {
      cities,
      minPrice: minPriceVal,
      maxPrice: maxPriceVal,
    },
    total: listings.length,
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
  }>;
}) {
  const params = await searchParams;
  const data = await getListings(params);

  return <ListingsClient initialData={data} searchParams={params} />;
}
