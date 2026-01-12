import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// GET property-specific fee settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    // If propertyId is provided, get settings for that property
    if (propertyId) {
      const settings = await (prisma as any).propertyFeeSettings?.findUnique?.({
        where: { propertyId },
      });

      return NextResponse.json({ settings: settings || null });
    }

    // Otherwise, get all property settings for this landlord
    const allSettings = await (prisma as any).propertyFeeSettings?.findMany?.({
      where: { landlordId: landlord.id },
    }) || [];

    return NextResponse.json({ settings: allSettings });
  } catch (error) {
    console.error('Error fetching property fee settings:', error);
    return NextResponse.json({ message: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT/POST property-specific fee settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, ...settings } = body;

    if (!propertyId) {
      return NextResponse.json({ message: 'Property ID is required' }, { status: 400 });
    }

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    // Verify property belongs to landlord
    const property = await prisma.property.findFirst({
      where: { id: propertyId, landlordId: landlord.id },
    });

    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    // Upsert property fee settings
    const result = await (prisma as any).propertyFeeSettings?.upsert?.({
      where: { propertyId },
      create: {
        propertyId,
        landlordId: landlord.id,
        ...settings,
      },
      update: settings,
    });

    return NextResponse.json({ success: true, settings: result });
  } catch (error) {
    console.error('Error updating property fee settings:', error);
    return NextResponse.json({ message: 'Failed to update settings' }, { status: 500 });
  }
}

// DELETE property-specific fee settings (revert to defaults)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ message: 'Property ID is required' }, { status: 400 });
    }

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    await (prisma as any).propertyFeeSettings?.delete?.({
      where: { propertyId },
    }).catch(() => {
      // Ignore if doesn't exist
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting property fee settings:', error);
    return NextResponse.json({ message: 'Failed to delete settings' }, { status: 500 });
  }
}
