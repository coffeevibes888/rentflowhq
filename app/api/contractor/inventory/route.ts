import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { canAccessFeature, checkLimit } from '@/lib/services/contractor-feature-gate';
import { incrementInventoryCount, decrementInventoryCount } from '@/lib/services/contractor-usage-tracker';
import { runBackgroundOps } from '@/lib/middleware/contractor-background-ops';
import { 
  FeatureLockedError,
  SubscriptionLimitError,
  formatSubscriptionError, 
  logSubscriptionError 
} from '@/lib/errors/subscription-errors';

// GET - List inventory items
// Feature Gate: Requires 'inventory' feature (Pro or Enterprise tier)
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

    // Run background operations
    await runBackgroundOps(contractorProfile.id);

    // Check inventory feature access
    const featureAccess = await canAccessFeature(contractorProfile.id, 'inventory');
    if (!featureAccess.allowed) {
      const error = new FeatureLockedError('inventory', 'pro', featureAccess.tier);
      const formatted = formatSubscriptionError(error);
      return NextResponse.json(formatted.body, { status: formatted.status });
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
    if (error instanceof FeatureLockedError) {
      const formatted = formatSubscriptionError(error);
      return NextResponse.json(formatted.body, { status: formatted.status });
    }
    
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST - Add inventory item
// Feature Gate: Requires 'inventory' feature (Pro or Enterprise tier)
// Limit: Pro tier limited to 200 items, Enterprise unlimited
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, subscriptionTier: true },
    });

    if (!contractorProfile) {
      return NextResponse.json(
        { error: 'Contractor profile not found' },
        { status: 404 }
      );
    }

    // Run background operations
    await runBackgroundOps(contractorProfile.id);

    // Check inventory feature access
    const featureAccess = await canAccessFeature(contractorProfile.id, 'inventory');
    if (!featureAccess.allowed) {
      const error = new FeatureLockedError('inventory', 'pro', featureAccess.tier);
      logSubscriptionError(error, {
        contractorId: contractorProfile.id,
        feature: 'inventory',
        action: 'create_inventory_item',
      });
      const formatted = formatSubscriptionError(error);
      return NextResponse.json(formatted.body, { status: formatted.status });
    }

    // Check inventory item limit
    const limitCheck = await checkLimit(contractorProfile.id, 'inventoryItems');
    if (!limitCheck.allowed) {
      const error = new SubscriptionLimitError(
        'inventory items',
        limitCheck.current,
        limitCheck.limit,
        contractorProfile.subscriptionTier || 'starter'
      );
      logSubscriptionError(error, {
        contractorId: contractorProfile.id,
        feature: 'inventoryItems',
        action: 'create_inventory_item',
      });
      const formatted = formatSubscriptionError(error);
      return NextResponse.json(formatted.body, { status: formatted.status });
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

    // Increment inventory count for usage tracking
    await incrementInventoryCount(contractorProfile.id);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof FeatureLockedError || error instanceof SubscriptionLimitError) {
      const formatted = formatSubscriptionError(error);
      return NextResponse.json(formatted.body, { status: formatted.status });
    }
    
    console.error('Error creating inventory item:', error);
    logSubscriptionError(error, {
      action: 'create_inventory_item',
      error: 'unexpected_error',
    });
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}
