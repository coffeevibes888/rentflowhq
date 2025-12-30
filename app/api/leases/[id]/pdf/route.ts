import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { getSignedCloudinaryUrl, extractPublicIdFromUrl } from '@/lib/cloudinary';

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

    // Check if user is landlord or tenant
    const landlordResult = await getOrCreateCurrentLandlord();
    
    let lease;
    
    if (landlordResult.success) {
      // Landlord access
      lease = await prisma.lease.findFirst({
        where: {
          id: leaseId,
          unit: {
            property: {
              landlordId: landlordResult.landlord.id,
            },
          },
        },
        include: {
          signatureRequests: {
            where: { status: 'signed', signedPdfUrl: { not: null } },
            orderBy: { signedAt: 'desc' },
            take: 1,
          },
        },
      });
    } else {
      // Tenant access
      lease = await prisma.lease.findFirst({
        where: {
          id: leaseId,
          tenantId: session.user.id,
        },
        include: {
          signatureRequests: {
            where: { status: 'signed', signedPdfUrl: { not: null } },
            orderBy: { signedAt: 'desc' },
            take: 1,
          },
        },
      });
    }

    if (!lease) {
      return NextResponse.json({ message: 'Lease not found or access denied' }, { status: 404 });
    }

    const signedRequest = lease.signatureRequests?.[0];
    if (!signedRequest?.signedPdfUrl) {
      return NextResponse.json({ message: 'No signed PDF available' }, { status: 404 });
    }

    const storedUrl = signedRequest.signedPdfUrl;
    let fetchUrl = storedUrl;
    
    // Check if URL is authenticated (needs signed URL)
    if (storedUrl.includes('/authenticated/')) {
      // Generate a fresh signed URL for authenticated resources
      const publicId = extractPublicIdFromUrl(storedUrl);
      if (!publicId) {
        console.error('Failed to extract public ID from URL:', storedUrl);
        return NextResponse.json({ message: 'Invalid PDF URL format' }, { status: 500 });
      }
      
      console.log('Extracted public ID:', publicId);
      
      fetchUrl = getSignedCloudinaryUrl({
        publicId,
        resourceType: 'raw',
        expiresInSeconds: 3600, // 1 hour
      });
      
      console.log('Generated signed URL:', fetchUrl);
    }

    // Fetch the PDF and stream it to the client
    const pdfResponse = await fetch(fetchUrl);
    
    if (!pdfResponse.ok) {
      console.error('Failed to fetch PDF:', pdfResponse.status, pdfResponse.statusText);
      console.error('Fetch URL was:', fetchUrl);
      return NextResponse.json({ 
        message: `Failed to fetch PDF: ${pdfResponse.status}` 
      }, { status: 502 });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="lease-${leaseId}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving lease PDF:', error);
    return NextResponse.json({ message: 'Failed to serve PDF' }, { status: 500 });
  }
}
