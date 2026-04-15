import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { NotificationService } from '@/lib/services/notification-service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
    }

    const { title, description, priority, unitId: bodyUnitId } = body as {
      title?: string;
      description?: string;
      priority?: string;
      unitId?: string;
    };

    if (!title || !description) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const finalPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

    // Always resolve the tenant's active lease unit — form may not send unitId
    let resolvedUnitId: string | null = bodyUnitId || null;

    if (!resolvedUnitId) {
      const activeLease = await prisma.lease.findFirst({
        where: { tenantId: userId, status: 'active' },
        select: { unitId: true },
        orderBy: { startDate: 'desc' },
      });
      resolvedUnitId = activeLease?.unitId ?? null;
    } else {
      // Verify the tenant actually has access to the provided unitId
      const unit = await prisma.unit.findFirst({
        where: {
          id: resolvedUnitId,
          leases: { some: { tenantId: userId, status: 'active' } },
        },
      });
      if (!unit) {
        return NextResponse.json(
          { success: false, message: 'Unit not found or you do not have access to it' },
          { status: 403 }
        );
      }
    }

    const unitId = resolvedUnitId;

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        tenantId: userId,
        unitId: unitId || null,
        title: title.trim(),
        description: description.trim(),
        priority: finalPriority,
      },
      include: {
        unit: {
          include: {
            property: {
              include: {
                landlord: {
                  select: {
                    id: true,
                    ownerUserId: true,
                    notificationPhone: true,
                    notifyMaintenanceTickets: true,
                    smsAlertsEnabled: true,
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

    // Notify landlord about new maintenance ticket
    const landlord = ticket.unit?.property?.landlord;
    console.log('[maintenance] unitId:', unitId);
    console.log('[maintenance] ticket.unit:', ticket.unit ? 'found' : 'NULL — no unit linked');
    console.log('[maintenance] landlord:', landlord ? { ownerUserId: landlord.ownerUserId, smsAlertsEnabled: landlord.smsAlertsEnabled, notificationPhone: landlord.notificationPhone } : 'NULL');

    if (landlord?.ownerUserId && landlord.notifyMaintenanceTickets !== false) {
      const landlordId = ticket.unit!.property.landlordId;
      const propertyName = ticket.unit!.property.name;
      const unitName = ticket.unit!.name;
      const tenantName = ticket.tenant?.name || 'Tenant';
      const priorityLabel = finalPriority.charAt(0).toUpperCase() + finalPriority.slice(1);

      // In-app + email notification
      await NotificationService.createNotification({
        userId: landlord.ownerUserId,
        type: 'maintenance',
        title: `New ${priorityLabel} Priority Maintenance Ticket`,
        message: `${tenantName} submitted: "${title.trim()}" at ${propertyName} – ${unitName}`,
        actionUrl: `/admin/maintenance`,
        metadata: { ticketId: ticket.id, priority: finalPriority },
        landlordId: landlordId ?? undefined,
      });

      // SMS alert if landlord has it enabled
      console.log('[maintenance] SMS check — smsAlertsEnabled:', landlord.smsAlertsEnabled, '| notificationPhone:', landlord.notificationPhone);
      if (landlord.smsAlertsEnabled && landlord.notificationPhone) {
        const { sendMaintenanceSms } = await import('@/lib/services/sms-service');
        await sendMaintenanceSms(
          landlord.notificationPhone,
          'Property Manager',
          title.trim(),
          'open',
          propertyName
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    // Log error without exposing sensitive details
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error creating maintenance ticket:', error instanceof Error ? error.message : 'Unknown error');
    }
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
