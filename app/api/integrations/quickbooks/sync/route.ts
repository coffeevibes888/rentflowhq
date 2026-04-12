import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { fetchQuickBooksCompanyInfo } from '@/lib/services/quickbooks-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { landlordId } = await request.json();

    if (!landlordId) {
      return NextResponse.json({ success: false, message: 'Landlord ID required' }, { status: 400 });
    }

    // Verify user owns this landlord
    const landlord = await prisma.landlord.findFirst({
      where: {
        id: landlordId,
        ownerUserId: session.user.id,
      },
    });

    if (!landlord) {
      return NextResponse.json({ success: false, message: 'Landlord not found' }, { status: 404 });
    }

    const qbConn = await (prisma as any).quickBooksConnection.findUnique({
      where: { landlordId },
      select: { connectedAt: true, realmId: true, accessTokenEncrypted: true, refreshTokenEncrypted: true },
    });

    const isConnected = Boolean(
      qbConn?.connectedAt && qbConn?.realmId && qbConn?.accessTokenEncrypted && qbConn?.refreshTokenEncrypted
    );

    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          message: 'QuickBooks is not connected. Please connect QuickBooks first.',
          code: 'QUICKBOOKS_NOT_CONNECTED',
        },
        { status: 400 }
      );
    }

    // Get financial data for QuickBooks sync
    const properties = await prisma.property.findMany({
      where: { landlordId },
      include: {
        units: {
          include: {
            leases: {
              include: {
                tenant: true,
                rentPayments: {
                  where: { status: 'paid' },
                },
              },
            },
          },
        },
      },
    });

    // Lightweight API call to validate tokens/realm; this also refreshes tokens if needed.
    const companyInfo = await fetchQuickBooksCompanyInfo({ landlordId });

    // Store sync timestamp
    await prisma.landlord.update({
      where: { id: landlordId },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'QuickBooks connection verified. Ready for syncing.',
      syncedAt: new Date().toISOString(),
      propertiesCount: properties.length,
      unitsCount: properties.reduce((sum, prop) => sum + prop.units.length, 0),
      quickBooksCompany: companyInfo?.CompanyInfo?.CompanyName || null,
    });
  } catch (error) {
    console.error('QuickBooks sync error:', error);
    return NextResponse.json({ success: false, message: 'Sync failed' }, { status: 500 });
  }
}
