import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET() {
  try {
    // Get a sample property with images
    const property = await prisma.property.findFirst({
      include: {
        units: {
          select: { images: true },
          take: 1,
        },
      },
    });

    // Get a landlord with branding images
    const landlord = await prisma.landlord.findFirst({
      select: {
        logoUrl: true,
        heroImages: true,
        aboutPhoto: true,
        aboutGallery: true,
      },
    });

    return NextResponse.json({
      success: true,
      cloudinaryConfig: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
        apiKeySet: !!process.env.CLOUDINARY_API_KEY,
        apiSecretSet: !!process.env.CLOUDINARY_API_SECRET,
      },
      sampleImages: {
        propertyUnitImage: property?.units[0]?.images?.[0] || null,
        landlordLogo: landlord?.logoUrl || null,
        landlordHeroImages: landlord?.heroImages || [],
        landlordAboutPhoto: landlord?.aboutPhoto || null,
      },
      imageTests: {
        propertyImageAccessible: property?.units[0]?.images?.[0] 
          ? await testImageUrl(property.units[0].images[0])
          : null,
        logoAccessible: landlord?.logoUrl
          ? await testImageUrl(landlord.logoUrl)
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function testImageUrl(url: string): Promise<{ accessible: boolean; status?: number; error?: string }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      accessible: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
