import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { NotificationService } from '@/lib/services/notification-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const xmlData = body;

    const envelopeIdMatch = xmlData.match(/<EnvelopeID>([^<]+)<\/EnvelopeID>/);
    const statusMatch = xmlData.match(/<Status>([^<]+)<\/Status>/);
    const recipientStatusMatch = xmlData.match(/<RecipientStatus>([^<]+)<\/RecipientStatus>/);
    const recipientIdMatch = xmlData.match(/<RecipientId>([^<]+)<\/RecipientId>/);

    if (!envelopeIdMatch || !statusMatch) {
      return NextResponse.json({ message: 'Invalid webhook payload' }, { status: 400 });
    }

    const envelopeId = envelopeIdMatch[1];
    const envelopeStatus = statusMatch[1];
    const recipientStatus = recipientStatusMatch?.[1];
    const recipientId = recipientIdMatch?.[1];

    const lease = await prisma.lease.findFirst({
      where: { docusignEnvelopeId: envelopeId },
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        unit: {
          select: {
            property: {
              select: {
                landlordId: true,
                landlord: {
                  select: {
                    id: true,
                    ownerUserId: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lease) {
      console.log(`No lease found for envelope ${envelopeId}`);
      return NextResponse.json({ message: 'Lease not found' }, { status: 404 });
    }

    if (recipientStatus === 'Completed' && recipientId === '1') {
      await prisma.lease.update({
        where: { id: lease.id },
        data: { tenantSignedAt: new Date() },
      });

      const landlordUserId = lease.unit.property?.landlord?.ownerUserId;
      const landlordId = lease.unit.property?.landlord?.id;
      if (landlordUserId && landlordId) {
        await NotificationService.createNotification({
          userId: landlordUserId,
          type: 'reminder',
          title: 'Lease Signed by Tenant',
          message: `${lease.tenant?.name || 'A tenant'} has signed their lease. Please review and sign to complete the agreement.`,
          actionUrl: `/admin/products/${lease.unit.propertyId}/details`,
          metadata: { leaseId: lease.id, propertyId: lease.unit.propertyId },
          landlordId,
        });
      }

      console.log(`Tenant signed lease ${lease.id}`);
    }

    if (recipientStatus === 'Completed' && recipientId === '2') {
      await prisma.lease.update({
        where: { id: lease.id },
        data: { landlordSignedAt: new Date() },
      });

      const landlordId = lease.unit.property?.landlord?.id;
      await NotificationService.createNotification({
        userId: lease.tenantId,
        type: 'application',
        title: 'Lease Fully Executed',
        message: `Your lease has been fully signed by both parties. You can now proceed with your move-in payments.`,
        actionUrl: `/user/profile/rent-receipts`,
        metadata: { leaseId: lease.id },
        landlordId,
      });

      console.log(`Landlord signed lease ${lease.id}`);
    }

    if (envelopeStatus === 'Completed') {
      console.log(`Envelope ${envelopeId} completed for lease ${lease.id}`);
    }

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
  } catch (error) {
    console.error('DocuSign webhook error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
