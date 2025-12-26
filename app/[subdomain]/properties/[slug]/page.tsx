import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Bed, Bath, Maximize, MapPin } from 'lucide-react';
import PropertyScheduler from '@/components/subdomain/property-scheduler';
import { SubdomainApplyButton } from '@/components/subdomain/apply-button';
import PropertyMap from '@/components/maps/property-map';

export default async function SubdomainPropertyPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
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

  return (
    <main className="flex-1 w-full">
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
              <h1 className="text-4xl font-bold text-white mb-2">{property.name}</h1>
              {property.address && typeof property.address === 'object' && (
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {(property.address as any).street}, {(property.address as any).city}, {(property.address as any).state}
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
            </div>

            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Available Units</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.units.map((unit) => (
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
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <PropertyScheduler propertyId={property.id} propertyName={property.name} />

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
