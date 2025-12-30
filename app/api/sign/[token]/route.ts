import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { renderDocuSignReadyLeaseHtml } from '@/lib/services/lease-template';
import { generateLeasePdf, stampSignatureOnPdf } from '@/lib/services/signing';
import { fetchPdfBuffer, applySignaturesToPdf, SignatureFieldPosition } from '@/lib/services/custom-pdf-signing';
import crypto from 'crypto';
import { sendBrandedEmail } from '@/lib/services/email-service';

function getClientIp(req: NextRequest) {
  const xfwd = req.headers.get('x-forwarded-for');
  if (xfwd) return xfwd.split(',')[0].trim();
  return (req as any).ip || 'unknown';
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const sig = await prisma.documentSignatureRequest.findUnique({
    where: { token },
    include: {
      document: {
        select: {
          id: true,
          name: true,
          fileUrl: true,
          signatureFields: true,
          isFieldsConfigured: true,
        },
      },
      lease: {
        include: {
          legalDocument: {
            select: {
              id: true,
              name: true,
              fileUrl: true,
              signatureFields: true,
              isFieldsConfigured: true,
            },
          },
          tenant: { select: { name: true, email: true } },
          unit: {
            include: {
              property: {
                include: {
                  landlord: {
                    select: { name: true, owner: { select: { email: true, name: true } }, id: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!sig) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if (sig.expiresAt && sig.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ message: 'Link expired' }, { status: 410 });
  }

  const lease = sig.lease;
  if (!lease) {
    return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
  }

  const landlordName = lease.unit.property?.landlord?.name || lease.unit.property?.name || 'Landlord';
  const tenantName = lease.tenant?.name || 'Tenant';
  const propertyLabel = `${lease.unit.property?.name || 'Property'} - ${lease.unit.name} (${lease.unit.type})`;

  // Check if we have a custom lease document with configured fields
  const legalDoc = lease.legalDocument || sig.document;
  const hasCustomDocument = legalDoc?.isFieldsConfigured && legalDoc?.fileUrl && legalDoc?.signatureFields;

  if (hasCustomDocument) {
    // Return info for custom PDF signing
    const fields = (legalDoc.signatureFields as unknown as SignatureFieldPosition[]) || [];
    const roleFields = fields.filter(f => f.role === sig.role);

    return NextResponse.json({
      leaseId: lease.id,
      role: sig.role,
      recipientName: sig.recipientName,
      recipientEmail: sig.recipientEmail,
      documentType: 'custom_pdf',
      documentName: legalDoc.name,
      documentUrl: legalDoc.fileUrl,
      signatureFields: roleFields,
      leaseDetails: {
        landlordName,
        tenantName,
        propertyLabel,
        startDate: lease.startDate,
        endDate: lease.endDate,
        rentAmount: Number(lease.rentAmount),
      },
    });
  }

  // Fall back to HTML template
  let leaseHtml = renderDocuSignReadyLeaseHtml({
    landlordName,
    tenantName,
    propertyLabel,
    leaseStartDate: new Date(lease.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    leaseEndDate: lease.endDate
      ? new Date(lease.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Month-to-Month',
    rentAmount: Number(lease.rentAmount).toLocaleString(),
    billingDayOfMonth: String(lease.billingDayOfMonth),
    todayDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  });

  // If landlord is signing and tenant has already signed, fetch tenant's signature data
  // and embed it into the HTML so landlord can see what tenant signed
  if (sig.role === 'landlord') {
    const tenantSignatureRequest = await prisma.documentSignatureRequest.findFirst({
      where: { 
        leaseId: lease.id, 
        role: 'tenant', 
        status: 'signed'
      },
      select: { 
        signedPdfUrl: true,
        signerName: true,
        signedAt: true
      }
    });
    
    if (tenantSignatureRequest) {
      // Add a visual indicator that tenant has signed (since we can't embed their actual signature in HTML)
      const tenantSignedInfo = `<div style="padding: 8px 16px; background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; margin: 8px 0; display: inline-block;">
        <span style="color: #166534; font-size: 14px;">✓ Signed by ${tenantSignatureRequest.signerName || tenantName} on ${tenantSignatureRequest.signedAt ? new Date(tenantSignatureRequest.signedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
      </div>`;
      
      // Replace tenant signature placeholder with signed indicator
      leaseHtml = leaseHtml.replace('/sig_tenant/', tenantSignedInfo);
      
      // Replace tenant initials with signed indicators
      for (let i = 1; i <= 6; i++) {
        const initPlaceholder = `/init${i}/`;
        if (leaseHtml.includes(initPlaceholder)) {
          const initialIndicator = `<span style="padding: 2px 8px; background: #dcfce7; border: 1px solid #86efac; border-radius: 4px; color: #166534; font-size: 12px;">✓</span>`;
          leaseHtml = leaseHtml.replace(initPlaceholder, initialIndicator);
        }
      }
    }
  }

  return NextResponse.json({
    leaseId: lease.id,
    role: sig.role,
    recipientName: sig.recipientName,
    recipientEmail: sig.recipientEmail,
    documentType: 'html_template',
    leaseHtml,
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const body = await req.json().catch(() => ({}));
  const signatureDataUrl = body.signatureDataUrl as string | undefined;
  const initialsDataUrl = body.initialsDataUrl as string | undefined;
  const signerName = (body.signerName as string | undefined)?.trim();
  const signerEmail = (body.signerEmail as string | undefined)?.trim();
  const consent = !!body.consent;
  const initialsData = body.initialsData as Array<{ id: string; value: string }> | undefined;

  if (!signatureDataUrl || !signerName || !signerEmail || !consent) {
    return NextResponse.json({ message: 'Missing signature, name, email, or consent' }, { status: 400 });
  }

  if (!signatureDataUrl.startsWith('data:image/png;base64,')) {
    return NextResponse.json({ message: 'Invalid signature format. Please try signing again.' }, { status: 400 });
  }

  const signatureSize = signatureDataUrl.length;
  if (signatureSize > 5 * 1024 * 1024) {
    return NextResponse.json({ message: 'Signature image too large. Please try a simpler signature.' }, { status: 400 });
  }

  const sig = await prisma.documentSignatureRequest.findUnique({
    where: { token },
    include: {
      document: {
        select: {
          id: true,
          fileUrl: true,
          signatureFields: true,
          isFieldsConfigured: true,
        },
      },
      lease: {
        include: {
          legalDocument: {
            select: {
              id: true,
              fileUrl: true,
              signatureFields: true,
              isFieldsConfigured: true,
            },
          },
          tenant: { select: { id: true, name: true, email: true } },
          unit: {
            include: {
              property: {
                include: {
                  landlord: { select: { id: true, name: true, ownerUserId: true, owner: { select: { email: true, name: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!sig) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  if (sig.expiresAt && sig.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ message: 'Link expired' }, { status: 410 });
  }
  if (sig.status === 'signed') {
    return NextResponse.json({ message: 'Already signed' }, { status: 400 });
  }

  const lease = sig.lease;
  if (!lease) {
    return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
  }

  const landlordName = lease.unit.property?.landlord?.name || lease.unit.property?.name || 'Landlord';
  const tenantName = lease.tenant?.name || 'Tenant';
  const propertyLabel = `${lease.unit.property?.name || 'Property'} - ${lease.unit.name} (${lease.unit.type})`;

  const signedAt = new Date();
  const ip = getClientIp(req);
  const ua = req.headers.get('user-agent') || 'unknown';

  const audit = {
    token,
    role: sig.role,
    signerName,
    signerEmail,
    signedAt: signedAt.toISOString(),
    ip,
    userAgent: ua,
    leaseId: lease.id,
  };

  // Check if we have a custom lease document
  const legalDoc = lease.legalDocument || sig.document;
  const hasCustomDocument = legalDoc?.isFieldsConfigured && legalDoc?.fileUrl && legalDoc?.signatureFields;

  let stamped;

  if (hasCustomDocument) {
    // Use custom PDF signing
    console.log('Using custom PDF document for signing');
    try {
      const pdfBuffer = await fetchPdfBuffer(legalDoc.fileUrl!);
      const fields = (legalDoc.signatureFields as unknown as SignatureFieldPosition[]) || [];

      stamped = await applySignaturesToPdf({
        pdfBuffer,
        fields,
        signingData: {
          signerName,
          signerEmail,
          signatureDataUrl,
          initialsDataUrl: initialsDataUrl || (initialsData?.[0]?.value),
          signedAt,
        },
        role: sig.role as 'tenant' | 'landlord',
        audit,
        landlordId: lease.unit.property?.landlord?.id,
        leaseId: lease.id,
      });
    } catch (error: any) {
      console.error('Custom PDF signing failed:', error);
      return NextResponse.json(
        { message: error?.message || 'Failed to process signature. Please try again.' },
        { status: 500 }
      );
    }
  } else {
    // Fall back to HTML template signing
    console.log('Using HTML template for signing');
    
    // For landlord signing, check if tenant has already signed and use their PDF as base
    if (sig.role === 'landlord') {
      const tenantSignatureRequest = await prisma.documentSignatureRequest.findFirst({
        where: { 
          leaseId: lease.id, 
          role: 'tenant', 
          status: 'signed',
          signedPdfUrl: { not: null }
        },
        select: { signedPdfUrl: true }
      });
      
      if (tenantSignatureRequest?.signedPdfUrl) {
        console.log('Landlord signing - Using tenant signed PDF as base');
        try {
          const pdfBuffer = await fetchPdfBuffer(tenantSignatureRequest.signedPdfUrl);
          
          stamped = await stampSignatureOnPdf({
            basePdf: pdfBuffer,
            signerName,
            signerEmail,
            role: 'landlord',
            signatureDataUrl,
            signedAt,
            audit,
            landlordId: lease.unit.property?.landlord?.id,
            leaseId: lease.id,
          });
        } catch (error: any) {
          console.error('Failed to use tenant signed PDF, falling back to HTML:', error);
          // Fall through to HTML generation below
        }
      }
    }
    
    // If we don't have a stamped result yet (tenant signing or fallback), generate from HTML
    if (!stamped) {
      let leaseHtml = renderDocuSignReadyLeaseHtml({
        landlordName,
        tenantName,
        propertyLabel,
        leaseStartDate: new Date(lease.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        leaseEndDate: lease.endDate
          ? new Date(lease.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : 'Month-to-Month',
        rentAmount: Number(lease.rentAmount).toLocaleString(),
        billingDayOfMonth: String(lease.billingDayOfMonth),
        todayDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      });

      // Embed initials into the HTML
      if (initialsData && Array.isArray(initialsData)) {
        console.log('Signing - Processing initials data:', initialsData.length, 'items');
        initialsData.forEach(({ id, value }) => {
          if (value) {
            const placeholder = `/${id}/`;
            const imgTag = `<img src="${value}" alt="Initial" style="height: 24px; display: inline-block; vertical-align: middle;" />`;
            const beforeReplace = leaseHtml.includes(placeholder);
            leaseHtml = leaseHtml.replace(placeholder, imgTag);
            const afterReplace = leaseHtml.includes(placeholder);
            console.log(`Signing - Initial ${id}: placeholder found=${beforeReplace}, replaced=${beforeReplace && !afterReplace}`);
          }
        });
      } else {
        console.log('Signing - No initials data provided');
      }

      // Embed signature
      if (sig.role === 'tenant') {
        const sigImgTag = `<img src="${signatureDataUrl}" alt="Tenant Signature" style="height: 38px; display: inline-block; vertical-align: middle;" />`;
        leaseHtml = leaseHtml.replace('/sig_tenant/', sigImgTag);
      } else {
        const sigImgTag = `<img src="${signatureDataUrl}" alt="Landlord Signature" style="height: 38px; display: inline-block; vertical-align: middle;" />`;
        leaseHtml = leaseHtml.replace('/sig_landlord/', sigImgTag);
      }

      try {
        const basePdf = await generateLeasePdf(leaseHtml);
        stamped = await stampSignatureOnPdf({
          basePdf,
          signerName,
          signerEmail,
          role: sig.role as 'tenant' | 'landlord',
          signatureDataUrl,
          signedAt,
          audit,
          landlordId: lease.unit.property?.landlord?.id,
          leaseId: lease.id,
        });
      } catch (error: any) {
        console.error('HTML template signing failed:', error);
        return NextResponse.json(
          { message: error?.message || 'Failed to process signature. Please try again.' },
          { status: 500 }
        );
      }
    }
  }

  // Update database
  await prisma.$transaction([
    prisma.documentSignatureRequest.update({
      where: { token },
      data: {
        status: 'signed',
        signedAt,
        signerName,
        signerEmail,
        signerIp: ip,
        signerUserAgent: ua,
        signedPdfUrl: stamped.signedPdfUrl,
        auditLogUrl: stamped.auditLogUrl,
        documentHash: stamped.documentHash,
      },
    }),
    prisma.lease.update({
      where: { id: lease.id },
      data: sig.role === 'tenant'
        ? { tenantSignedAt: signedAt }
        : { landlordSignedAt: signedAt, status: 'active' }, // Activate lease when landlord signs
    }),
  ]);

  // If tenant just signed, create landlord signature request
  if (sig.role === 'tenant' && !lease.landlordSignedAt) {
    const existingLandlordRequest = await prisma.documentSignatureRequest.findFirst({
      where: { leaseId: lease.id, role: 'landlord', status: { not: 'signed' } },
    });

    if (!existingLandlordRequest) {
      const landlordEmail = lease.unit.property?.landlord?.owner?.email;
      const landlordNameForEmail = lease.unit.property?.landlord?.name || 'Landlord';
      const landlordId = lease.unit.property?.landlord?.id;
      
      if (landlordEmail && landlordId) {
        const landlordToken = crypto.randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await prisma.documentSignatureRequest.create({
          data: {
            documentId: legalDoc?.id || lease.id,
            leaseId: lease.id,
            recipientEmail: landlordEmail,
            recipientName: landlordNameForEmail,
            status: 'sent',
            expiresAt,
            token: landlordToken,
            role: 'landlord',
          },
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const actionUrl = `${baseUrl}/sign/${landlordToken}`;

        try {
          await sendBrandedEmail({
            to: landlordEmail,
            subject: 'Lease ready for your signature',
            template: 'notification',
            data: {
              landlord: lease.unit.property?.landlord,
              recipientName: landlordNameForEmail,
              notificationType: 'lease_signing',
              title: 'Lease ready for your signature',
              message: `${tenantName} has signed the lease for ${propertyLabel}. Please sign to complete.`,
              actionUrl,
              loginUrl: actionUrl,
            },
            landlordId,
          } as any);
        } catch (err) {
          console.error('Failed to email landlord signing link', err);
        }
      }
    }
  }

  return NextResponse.json({
    signedPdfUrl: stamped.signedPdfUrl,
    auditLogUrl: stamped.auditLogUrl,
    documentHash: stamped.documentHash,
  });
}
