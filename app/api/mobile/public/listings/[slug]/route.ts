/**
 * GET /api/mobile/public/listings/:slug
 *
 * Public detail for a single rental listing — used by the mobile listing
 * detail screen. Returns the full property with its available units, address
 * (as a structured object including lat/lng if geocoded), and landlord
 * branding so the apply-now CTA can route to the right subdomain.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

interface AddressJson {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const property = await prisma.property.findUnique({
      where: { slug },
      include: {
        landlord: {
          select: { id: true, companyName: true, subdomain: true },
        },
        units: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            rentAmount: true,
            isAvailable: true,
            bedrooms: true,
            bathrooms: true,
            sizeSqFt: true,
            images: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const sample = property.units[0];
    const addr = (property.address ?? {}) as AddressJson;
    const rents = property.units.map((u) => Number(u.rentAmount ?? 0)).filter((r) => r > 0);
    const minRent = rents.length ? Math.min(...rents) : 0;

    // Aggregate up to 5 hero images from any available unit.
    const images = property.units.flatMap((u) => u.images ?? []).slice(0, 5);

    return NextResponse.json({
      id: property.id,
      slug: property.slug,
      name: property.name,
      type: property.type,
      description: property.description,
      coverImage: images[0] ?? null,
      images,
      beds: sample?.bedrooms ?? null,
      baths: sample?.bathrooms ? Number(sample.bathrooms) : null,
      sizeSqFt: sample?.sizeSqFt ?? null,
      rent: minRent,
      address: {
        street: addr.street ?? null,
        city: addr.city ?? null,
        state: addr.state ?? null,
        zip: addr.zip ?? null,
      },
      lat: addr.lat ?? null,
      lng: addr.lng ?? null,
      landlordName: property.landlord?.companyName ?? 'Property Manager',
      landlordSubdomain: property.landlord?.subdomain ?? null,
      units: property.units.map((u) => ({
        id: u.id,
        name: u.name,
        rentAmount: Number(u.rentAmount ?? 0),
        isAvailable: u.isAvailable,
        bedrooms: u.bedrooms ?? null,
        bathrooms: u.bathrooms ? Number(u.bathrooms) : null,
      })),
    });
  } catch (e) {
    console.error('public listing detail', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
