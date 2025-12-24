import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { renderDocuSignReadyLeaseHtml } from '@/lib/services/lease-template';
import { generateLeasePdf, stampSignatureOnPdf } from '@/lib/services/signing';
import crypto from 'crypto';
import { sendBrandedEmail } from '@/lib/services/email-service';

function getClientIp(req: NextRequest) {
  const xfwd = req.headers.get('x-forwarded-for');
  if (xfwd) return xfwd.split(',')[0].trim();
  // @ts-ignore - ip is available in NextRequest
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
      lease: {
        include: {
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

  const leaseHtml = renderDocuSignReadyLeaseHtml({
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

  return NextResponse.json({
    leaseId: lease.id,
    role: sig.role,
    recipientName: sig.recipientName,
    recipientEmail: sig.recipientEmail,
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
  const signerName = (body.signerName as string | undefined)?.trim();
  const signerEmail = (body.signerEmail as string | undefined)?.trim();
  const consent = !!body.consent;
  const initialsData = body.initialsData as Array<{ id: string; value: string }> | undefined;

  if (!signatureDataUrl || !signerName || !signerEmail || !consent) {
    return NextResponse.json({ message: 'Missing signature, name, email, or consent' }, { status: 400 });
  }

  const sig = await prisma.documentSignatureRequest.findUnique({
    where: { token },
    include: {
      lease: {
        include: {
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

  // Embed initials into the HTML before generating PDF
  if (initialsData && Array.isArray(initialsData)) {
    initialsData.forEach(({ id, value }) => {
      if (value) {
        const placeholder = `/${id}/`;
        const imgTag = `<img src="${value}" alt="Initial" style="height: 24px; display: inline-block; vertical-align: middle;" />`;
        leaseHtml = leaseHtml.replace(placeholder, imgTag);
      }
    });
  }

  // Embed signature into HTML as well (for tenant signature placeholder)
  if (sig.role === 'tenant') {
    const sigImgTag = `<img src="${signatureDataUrl}" alt="Tenant Signature" style="height: 38px; display: inline-block; vertical-align: middle;" />`;
    leaseHtml = leaseHtml.replace('/sig_tenant/', sigImgTag);
  } else {
    const sigImgTag = `<img src="${signatureDataUrl}" alt="Landlord Signature" style="height: 38px; display: inline-block; vertical-align: middle;" />`;
    leaseHtml = leaseHtml.replace('/sig_landlord/', sigImgTag);
  }

  const basePdf = await generateLeasePdf(leaseHtml);

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

  let stamped;
  try {
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
  } catch (stampError: any) {
    console.error('Failed to stamp signature on PDF:', stampError);
    return NextResponse.json(
      { message: stampError?.message || 'Failed to process signature. Please try again.' },
      { status: 500 }
    );
  }

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
      data:
        sig.role === 'tenant'
          ? { tenantSignedAt: signedAt }
          : { landlordSignedAt: signedAt },
    }),
  ]);

  // If tenant just signed, create landlord signature request + email if not already signed
  if (sig.role === 'tenant' && !lease.landlordSignedAt) {
    const existingLandlordRequest = await prisma.documentSignatureRequest.findFirst({
      where: { leaseId: lease.id, role: 'landlord', status: { not: 'signed' } },
    });

    if (!existingLandlordRequest) {
      const landlordEmail = lease.unit.property?.landlord?.owner?.email;
      const landlordName = lease.unit.property?.landlord?.name || 'Landlord';
      const landlordId = lease.unit.property?.landlord?.id;
      if (landlordEmail && landlordId) {
        const landlordToken = crypto.randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.documentSignatureRequest.create({
          data: {
            documentId: lease.id,
            leaseId: lease.id,
            recipientEmail: landlordEmail,
            recipientName: landlordName,
            status: 'sent',
            expiresAt,
            token: landlordToken,
            role: 'landlord',
            documentHash: null,
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
              recipientName: landlordName,
              notificationType: 'lease_signing',
              title: 'Lease ready for your signature',
              message: `${tenantName} has signed. Please sign to complete.`,
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
