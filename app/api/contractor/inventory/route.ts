import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// GET - List inventory items
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!contractorProfile) {
      return NextResponse.json(
        { error: 'Contractor profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock');

    const where: any = {
      contractorId: contractorProfile.id,
    };

    if (category) {
      where.category = category;
    }

    if (lowStock === 'true') {
      where.AND = [
        { reorderPoint: { not: null } },
        { quantity: { lte: prisma.contractorInventoryItem.fields.reorderPoint } },
      ];
    }

    const items = await prisma.contractorInventoryItem.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            contactName: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST - Add inventory item
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!contractorProfile) {
      return NextResponse.json(
        { error: 'Contractor profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      sku,
      category,
      quantity,
      unit,
      unitCost,
      reorderPoint,
      location,
      vendorId,
      notes,
    } = body;

    if (!name || quantity === undefined || !unit || unitCost === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify vendor if provided
    if (vendorId) {
      const vendor = await prisma.contractorVendor.findUnique({
        where: {
          id: vendorId,
          contractorId: contractorProfile.id,
        },
      });

      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }
    }

    const item = await prisma.contractorInventoryItem.create({
      data: {
        contractorId: contractorProfile.id,
        name,
        sku: sku || null,
        category: category || null,
        quantity: parseInt(quantity),
        unit,
        unitCost: parseFloat(unitCost),
        reorderPoint: reorderPoint ? parseInt(reorderPoint) : null,
        location: location || null,
        vendorId: vendorId || null,
        notes: notes || null,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            contactName: true,
          },
        },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}
