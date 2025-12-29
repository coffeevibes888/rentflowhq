import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { renderDocuSignReadyLeaseHtml } from '@/lib/services/lease-template';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { getSignedUrlFromStoredUrl } from '@/lib/cloudinary';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const { id: leaseId } = await params;

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return NextResponse.json({ message: landlordResult.message }, { status: 403 });
    }

    const lease = await prisma.lease.findFirst({
      where: {
        id: leaseId,
        unit: {
          property: {
            landlordId: landlordResult.landlord.id,
          },
        },
      },
      include: {
        tenant: { select: { name: true, email: true } },
        unit: {
          include: {
            property: {
              include: {
                landlord: { select: { name: true } },
              },
            },
          },
        },
        signatureRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lease) {
      return NextResponse.json({ message: 'Lease not found or access denied' }, { status: 404 });
    }

    const property = lease.unit.property;
    const address = property.address as any;

    const html = renderDocuSignReadyLeaseHtml({
      propertyLabel: address
        ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip || ''}`
        : property.name,
      landlordName: property.landlord?.name || 'Landlord',
      tenantName: lease.tenant?.name || 'Tenant',
      rentAmount: String(Number(lease.rentAmount)),
      leaseStartDate: lease.startDate.toISOString().split('T')[0],
      leaseEndDate: lease.endDate?.toISOString().split('T')[0] || 'Month-to-Month',
      billingDayOfMonth: String(lease.billingDayOfMonth || 1),
      todayDate: new Date().toISOString().split('T')[0],
    });

    // Get signed PDF URL if available
    const signedRequest = lease.signatureRequests?.find(sr => sr.status === 'signed' && sr.signedPdfUrl);
    const rawPdfUrl = signedRequest?.signedPdfUrl || null;
    const signedPdfUrl = rawPdfUrl ? getSignedUrlFromStoredUrl(rawPdfUrl) : null;

    return NextResponse.json({ 
      html,
      signedPdfUrl,
      leaseStatus: lease.status,
      tenantSigned: !!lease.tenantSignedAt,
      landlordSigned: !!lease.landlordSignedAt,
    });
  } catch (error) {
    console.error('Error generating lease preview:', error);
    return NextResponse.json({ message: 'Failed to generate lease preview' }, { status: 500 });
  }
}
