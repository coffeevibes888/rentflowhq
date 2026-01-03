import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { renderDocuSignReadyLeaseHtml } from '@/lib/services/lease-template';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    const doc = await prisma.legalDocument.findFirst({
      where: {
        id,
        landlordId: landlord.id,
        isActive: true,
      },
    });

    if (!doc) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    if (doc.type !== 'lease') {
      return NextResponse.json({ message: 'Preview not available for this document type' }, { status: 400 });
    }

    // Try to find a lease that uses this legal document to get actual data
    const lease = await prisma.lease.findFirst({
      where: {
        legalDocumentId: id,
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
          where: { status: 'signed' },
          orderBy: { signedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let html: string;
    let signedPdfUrl: string | null = null;
    let signatures: Array<{ name: string; role: string; signedAt: Date | null }> = [];

    if (lease) {
      // Use actual lease data
      const property = lease.unit.property;
      const address = property?.address as any;
      const propertyLabel = address
        ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip || ''}`
        : `${property?.name || 'Property'} - ${lease.unit.name}`;

      html = renderDocuSignReadyLeaseHtml({
        landlordName: property?.landlord?.name || landlord.name || 'Landlord',
        tenantName: lease.tenant?.name || 'Tenant',
        propertyLabel,
        leaseStartDate: new Date(lease.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        leaseEndDate: lease.endDate
          ? new Date(lease.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : 'Month-to-Month',
        rentAmount: Number(lease.rentAmount).toLocaleString(),
        billingDayOfMonth: String(lease.billingDayOfMonth || 1),
        todayDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      });

      // Get signature info
      const tenantSig = lease.signatureRequests?.find(sr => sr.role === 'tenant');
      const landlordSig = lease.signatureRequests?.find(sr => sr.role === 'landlord');

      if (tenantSig) {
        signatures.push({
          name: tenantSig.signerName || lease.tenant?.name || 'Tenant',
          role: 'Tenant',
          signedAt: tenantSig.signedAt,
        });

        // Replace tenant signature placeholder with signed indicator
        if (tenantSig.signedAt) {
          const tenantSignedDate = new Date(tenantSig.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          const tenantSigHtml = `<div style="display: inline-block; padding: 8px 16px; background: #dcfce7; border: 1px solid #86efac; border-radius: 8px;">
            <span style="color: #166534; font-size: 14px; font-weight: 500;">✓ Signed by ${tenantSig.signerName || lease.tenant?.name || 'Tenant'}</span>
            <span style="color: #166534; font-size: 12px; display: block;">${tenantSignedDate}</span>
          </div>`;
          html = html.replace('/sig_tenant/', tenantSigHtml);

          // Replace initials
          for (let i = 1; i <= 6; i++) {
            const initPlaceholder = `/init${i}/`;
            if (html.includes(initPlaceholder)) {
              const initialHtml = `<span style="display: inline-block; padding: 2px 8px; background: #dcfce7; border: 1px solid #86efac; border-radius: 4px; color: #166534; font-size: 12px; font-weight: 500;">✓</span>`;
              html = html.replace(initPlaceholder, initialHtml);
            }
          }
        }
      }

      if (landlordSig) {
        signatures.push({
          name: landlordSig.signerName || property?.landlord?.name || 'Landlord',
          role: 'Landlord',
          signedAt: landlordSig.signedAt,
        });

        // Replace landlord signature placeholder with signed indicator
        if (landlordSig.signedAt) {
          const landlordSignedDate = new Date(landlordSig.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          const landlordSigHtml = `<div style="display: inline-block; padding: 8px 16px; background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px;">
            <span style="color: #1e40af; font-size: 14px; font-weight: 500;">✓ Signed by ${landlordSig.signerName || property?.landlord?.name || 'Landlord'}</span>
            <span style="color: #1e40af; font-size: 12px; display: block;">${landlordSignedDate}</span>
          </div>`;
          html = html.replace('/sig_landlord/', landlordSigHtml);
        }
      }

      // Get signed PDF URL (prefer landlord's as it has both signatures)
      const signedRequest = landlordSig?.signedPdfUrl ? landlordSig : tenantSig;
      signedPdfUrl = signedRequest?.signedPdfUrl || null;
    } else {
      // No lease found, use generic template
      html = renderDocuSignReadyLeaseHtml({
        landlordName: landlord.name || 'Landlord',
        tenantName: '[Tenant Name]',
        propertyLabel: '[Property / Unit]',
        leaseStartDate: '[Start Date]',
        leaseEndDate: '[End Date]',
        rentAmount: '[Rent Amount]',
        billingDayOfMonth: '[Day]',
        todayDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      });
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to preview legal document:', error);
    return NextResponse.json({ message: 'Failed to preview document' }, { status: 500 });
  }
}
