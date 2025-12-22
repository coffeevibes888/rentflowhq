import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { NotificationService } from '@/lib/services/notification-service';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find leases where tenant has signed but landlord hasn't (pending landlord signature)
    const leasesAwaitingLandlordSignature = await prisma.lease.findMany({
      where: {
        tenantSignedAt: { not: null },
        landlordSignedAt: null,
        status: 'active',
        createdAt: {
          // Only check leases created in the last 7 days to avoid spamming old leases
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        unit: {
          include: {
            property: {
              include: {
                landlord: {
                  include: {
                    owner: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        },
        tenant: {
          select: { name: true },
        },
      },
    });

    const results = [];

    for (const lease of leasesAwaitingLandlordSignature) {
      const landlordId = lease.unit.property.landlordId;
      const landlord = lease.unit.property.landlord;
      const tenantName = lease.tenant?.name || 'Tenant';
      const propertyName = lease.unit.property.name;
      const unitName = lease.unit.name;

      if (landlord?.owner?.id && landlordId) {
        try {
          // Check if we've already sent a reminder for this lease today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: landlord.owner.id,
              type: 'reminder',
              actionUrl: { contains: `/admin/products/${lease.unit.propertyId}/details` },
              createdAt: { gte: today },
            },
          });

          // Only send one reminder per day
          if (existingNotification) {
            continue;
          }

          await NotificationService.createNotification({
            userId: landlord.owner.id,
            type: 'reminder',
            title: 'Lease Awaiting Your Signature',
            message: `${tenantName} has signed the lease for ${propertyName} - ${unitName}. Please review and sign to complete the agreement.`,
            actionUrl: `/admin/products/${lease.unit.propertyId}/details`,
            metadata: { leaseId: lease.id, propertyId: lease.unit.propertyId },
            landlordId,
          });

          results.push({
            leaseId: lease.id,
            landlordId,
            success: true,
          });
        } catch (error) {
          console.error(`Failed to send lease signing reminder for lease ${lease.id}:`, error);
          results.push({
            leaseId: lease.id,
            landlordId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Lease signing reminders cron job error:', error);
    return NextResponse.json({ error: 'Failed to process lease signing reminders' }, { status: 500 });
  }
}