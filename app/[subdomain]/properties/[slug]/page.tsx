import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Bed, Bath, Maximize, MapPin, Home, Layers } from 'lucide-react';
import PropertyScheduler from '@/components/subdomain/property-scheduler';
import { SubdomainApplyButton } from '@/components/subdomain/apply-button';
import PropertyMap from '@/components/maps/property-map';
import PropertyMediaSection from '@/components/subdomain/property-media-section';
import JsonLdScript from '@/components/seo/json-ld-script';
import {
  canonicalUrl,
  buildPropertySeoTitle,
  buildPropertySeoH1,
  buildPropertySeoDescription,
  propertyLd,
  breadcrumbLd,
} from '@/lib/seo';

// Group units by floor plan (bedrooms + bathrooms combination)
interface FloorPlan {
  key: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqFt: number | null;
  minRent: number;
  maxRent: number;
  availableCount: number;
  amenities: string[];
  images: string[];
}

function groupUnitsByFloorPlan(units: any[]): FloorPlan[] {
  const floorPlanMap = new Map<string, FloorPlan>();

  units.forEach((unit) => {
    const bedrooms = unit.bedrooms || 0;
    const bathrooms = Number(unit.bathrooms) || 1;
    const key = `${bedrooms}-${bathrooms}`;
    const rent = Number(unit.rentAmount) || 0;

    if (floorPlanMap.has(key)) {
      const existing = floorPlanMap.get(key)!;
      existing.availableCount++;
      existing.minRent = Math.min(existing.minRent, rent);
      existing.maxRent = Math.max(existing.maxRent, rent);
      if (!existing.sizeSqFt && unit.sizeSqFt) {
        existing.sizeSqFt = unit.sizeSqFt;
      }
      if (unit.images?.length && !existing.images.length) {
        existing.images = unit.images;
      }
      // Merge amenities
      unit.amenities?.forEach((a: string) => {
        if (!existing.amenities.includes(a)) {
          existing.amenities.push(a);
        }
      });
    } else {
      const name = bedrooms === 0 ? 'Studio' : `${bedrooms} Bedroom`;
      floorPlanMap.set(key, {
        key,
        name,
        bedrooms,
        bathrooms,
        sizeSqFt: unit.sizeSqFt || null,
        minRent: rent,
        maxRent: rent,
        availableCount: 1,
        amenities: unit.amenities || [],
        images: unit.images || [],
      });
    }
  });

  // Sort by bedrooms
  return Array.from(floorPlanMap.values()).sort((a, b) => a.bedrooms - b.bedrooms);
}

interface PropertyPageParams {
  subdomain: string;
  slug: string;
}

/**
 * Build SSR metadata: keyword-rich title, location-keyed description,
 * canonical URL, OG image, and price/bed-aware copy.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<PropertyPageParams>;
}): Promise<Metadata> {
  const { subdomain, slug } = await params;

  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
    select: { id: true, name: true, companyName: true },
  });
  if (!landlord) return { title: 'Property Not Found' };

  const property = await prisma.property.findFirst({
    where: { slug, landlordId: landlord.id },
    include: { units: { where: { isAvailable: true } } },
  });
  if (!property) return { title: 'Property Not Found' };

  const address = property.address as any;
  const city = address?.city || null;
  const state = address?.state || null;
  const unitInputs = property.units.map((u) => ({
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms != null ? Number(u.bathrooms) : null,
    sizeSqFt: u.sizeSqFt,
    rentAmount: u.rentAmount != null ? Number(u.rentAmount) : null,
  }));

  const title = buildPropertySeoTitle({
    propertyName: property.name,
    propertyType: property.type,
    city,
    state,
    units: unitInputs,
  });
  const description = buildPropertySeoDescription({
    propertyName: property.name,
    propertyType: property.type,
    city,
    state,
    description: property.description,
    units: unitInputs,
  });
  const ogImage = property.units.find((u) => u.images?.length)?.images?.[0] || undefined;
  const canonical = canonicalUrl(`/${subdomain}/properties/${property.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    keywords: [
      `apartments for rent in ${city || ''}`.trim(),
      `homes for rent in ${city || ''}`.trim(),
      `${property.type} for rent ${city || ''}`.trim(),
      property.name,
    ].filter((k) => k && !k.endsWith('in')),
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: 'Property Flow HQ',
      images: ogImage ? [{ url: ogImage, alt: property.name }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: ogImage ? [ogImage] : undefined },
  };
}

export default async function SubdomainPropertyPage({
  params,
}: {
  params: Promise<PropertyPageParams>;
}) {
  const { subdomain, slug } = await params;

  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
  });

  if (!landlord) {
    redirect('/');
  }

  const property = await prisma.property.findFirst({
    where: {
      slug,
      landlordId: landlord.id,
    },
    include: {
      units: {
        where: { isAvailable: true },
      },
    },
  });

  if (!property) {
    notFound();
  }

  // Get video/tour URLs from Property model
  const mediaUrls = property.videoUrl || property.virtualTourUrl
    ? { videoUrl: property.videoUrl, virtualTourUrl: property.virtualTourUrl }
    : null;

  const session = await auth();

  if (session?.user?.id && session.user.role === 'tenant') {
    const tenantLease = await prisma.lease.findFirst({
      where: {
        tenantId: session.user.id,
        status: 'active',
        unit: {
          property: {
            landlordId: landlord.id,
          },
        },
      },
    }).catch(() => null);

    if (tenantLease) {
      redirect('/user/dashboard');
    }
  }

  const firstImage = property.units[0]?.images?.[0];

  // ── SEO: build H1 + JSON-LD from real, indexable data ────────────────────
  const address = property.address as any;
  const city = address?.city || null;
  const state = address?.state || null;
  const street = address?.street || null;
  const zip = address?.zip || null;
  const lat = address?.lat ?? null;
  const lng = address?.lng ?? null;

  const unitInputs = property.units.map((u) => ({
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms != null ? Number(u.bathrooms) : null,
    sizeSqFt: u.sizeSqFt,
    rentAmount: u.rentAmount != null ? Number(u.rentAmount) : null,
    isAvailable: u.isAvailable,
  }));

  const seoH1 = buildPropertySeoH1({
    propertyName: property.name,
    propertyType: property.type,
    city,
    state,
    units: unitInputs,
  });

  const propertyImages = property.units
    .flatMap((u) => u.images || [])
    .filter(Boolean)
    .slice(0, 8);

  const propertyCanonical = canonicalUrl(`/${subdomain}/properties/${property.slug}`);
  const subdomainCanonical = canonicalUrl(`/${subdomain}`);

  const propertyLdData: object[] = [
    propertyLd({
      url: propertyCanonical,
      name: property.name,
      description: property.description,
      propertyType: property.type,
      street,
      city,
      state,
      zip,
      lat: typeof lat === 'number' ? lat : null,
      lng: typeof lng === 'number' ? lng : null,
      images: propertyImages,
      units: unitInputs,
      landlordName: landlord.companyName || landlord.name,
      landlordUrl: subdomainCanonical,
    }),
    breadcrumbLd([
      { name: 'Home', path: '/' },
      { name: landlord.companyName || landlord.name, path: `/${subdomain}` },
      { name: property.name, path: `/${subdomain}/properties/${property.slug}` },
    ]),
  ];

  return (
    <main className="flex-1 w-full">
      <JsonLdScript data={propertyLdData} id="property-ld" />
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {firstImage ? (
              <div className="relative h-96 w-full rounded-2xl overflow-hidden border border-white/10">
                <Image
                  src={firstImage}
                  alt={property.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-96 w-full rounded-2xl border border-white/10 bg-slate-900/60 flex items-center justify-center">
                <Building2 className="h-24 w-24 text-slate-400" />
              </div>
            )}
            {property.units[0]?.images && property.units[0].images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {property.units[0].images.slice(1, 5).map((img, idx) => (
                  <div key={idx} className="relative h-20 rounded-lg overflow-hidden border border-white/10">
                    <Image src={img} alt={`${property.name} ${idx + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{seoH1}</h1>
              {property.address && typeof property.address === 'object' && (
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {[street, city, state, zip].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {property.description && (
              <p className="text-slate-200/90">{property.description}</p>
            )}

            <div className="flex flex-wrap gap-4">
              <Badge variant="outline" className="border-white/20 text-white">
                <Building2 className="h-4 w-4 mr-2" />
                {property.type}
              </Badge>
              {property.units.length > 0 && (
                <Badge variant="outline" className="border-white/20 text-white">
                  {property.units.length} unit{property.units.length !== 1 ? 's' : ''} available
                </Badge>
              )}
              {/* Apply Now button near units available */}
              <SubdomainApplyButton propertySlug={property.slug} size="sm" />
            </div>

            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-violet-400" />
                  {property.type === 'apartment' && property.units.length > 3 
                    ? 'Floor Plans' 
                    : 'Available Units'}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {property.units.length} unit{property.units.length !== 1 ? 's' : ''} available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.type === 'apartment' && property.units.length > 3 ? (
                  // Show grouped floor plans for apartment complexes
                  groupUnitsByFloorPlan(property.units).map((floorPlan) => (
                    <div
                      key={floorPlan.key}
                      className="rounded-xl border border-white/10 bg-slate-800/60 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <Home className="h-5 w-5 text-violet-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{floorPlan.name}</h3>
                            <p className="text-sm text-slate-400">
                              {floorPlan.availableCount} unit{floorPlan.availableCount !== 1 ? 's' : ''} available
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-violet-300">
                            {floorPlan.minRent === floorPlan.maxRent 
                              ? formatCurrency(floorPlan.minRent)
                              : `${formatCurrency(floorPlan.minRent)} - ${formatCurrency(floorPlan.maxRent)}`}
                          </div>
                          <span className="text-sm text-slate-300">/month</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          {floorPlan.bedrooms === 0 ? 'Studio' : `${floorPlan.bedrooms} bed${floorPlan.bedrooms !== 1 ? 's' : ''}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          {floorPlan.bathrooms} bath{floorPlan.bathrooms !== 1 ? 's' : ''}
                        </div>
                        {floorPlan.sizeSqFt && (
                          <div className="flex items-center gap-1">
                            <Maximize className="h-4 w-4" />
                            {floorPlan.sizeSqFt.toLocaleString()} sqft
                          </div>
                        )}
                      </div>
                      {floorPlan.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {floorPlan.amenities.slice(0, 5).map((amenity, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {floorPlan.amenities.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{floorPlan.amenities.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  // Show individual units for smaller properties
                  property.units.map((unit) => (
                    <div
                      key={unit.id}
                      className="rounded-xl border border-white/10 bg-slate-800/60 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">{unit.name}</h3>
                        <div className="text-2xl font-bold text-violet-300">
                          {formatCurrency(Number(unit.rentAmount))}
                          <span className="text-sm font-normal text-slate-300">/mo</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                        {unit.bedrooms && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            {unit.bedrooms} bed{unit.bedrooms !== 1 ? 's' : ''}
                          </div>
                        )}
                        {unit.bathrooms && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            {Number(unit.bathrooms)} bath{Number(unit.bathrooms) !== 1 ? 's' : ''}
                          </div>
                        )}
                        {unit.sizeSqFt && (
                          <div className="flex items-center gap-1">
                            <Maximize className="h-4 w-4" />
                            {unit.sizeSqFt} sqft
                          </div>
                        )}
                      </div>
                      {unit.amenities && unit.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {unit.amenities.map((amenity, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <PropertyScheduler propertyId={property.id} propertyName={property.name} />

        {/* Video & Virtual Tour Section */}
        {(mediaUrls?.videoUrl || mediaUrls?.virtualTourUrl) && (
          <PropertyMediaSection
            videoUrl={mediaUrls.videoUrl}
            virtualTourUrl={mediaUrls.virtualTourUrl}
            propertyName={property.name}
          />
        )}

        {/* Property Location Map */}
        {property.address && typeof property.address === 'object' && (property.address as any).street && (
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-violet-400" />
                Property Location
              </CardTitle>
              <CardDescription className="text-slate-300">
                {(property.address as any).street}, {(property.address as any).city}, {(property.address as any).state} {(property.address as any).zip}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyMap
                address={{
                  street: (property.address as any).street,
                  city: (property.address as any).city,
                  state: (property.address as any).state,
                  zip: (property.address as any).zip,
                }}
                propertyName={property.name}
                className="h-[350px]"
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <SubdomainApplyButton propertySlug={property.slug} />
        </div>
      </div>
    </main>
  );
}
