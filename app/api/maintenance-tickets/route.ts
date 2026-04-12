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

    const { title, description, priority, unitId } = body as {
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

    // If unitId is provided, verify the tenant has access to that unit
    if (unitId) {
      const unit = await prisma.unit.findFirst({
        where: {
          id: unitId,
          leases: {
            some: {
              tenantId: userId,
              status: 'active',
            },
          },
        },
      });

      if (!unit) {
        return NextResponse.json(
          { success: false, message: 'Unit not found or you do not have access to it' },
          { status: 403 }
        );
      }
    }

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

    // Notify landlord about new maintenance ticket
    if (ticket.unit?.property?.landlord?.owner?.id) {
      const landlordId = ticket.unit.property.landlordId;
      const propertyName = ticket.unit.property.name;
      const unitName = ticket.unit.name;
      const tenantName = ticket.tenant?.name || 'Tenant';
      const priorityLabel = finalPriority.charAt(0).toUpperCase() + finalPriority.slice(1);

      await NotificationService.createNotification({
        userId: ticket.unit.property.landlord.owner.id,
        type: 'maintenance',
        title: `New ${priorityLabel} Priority Maintenance Ticket`,
        message: `${tenantName} submitted a maintenance request: "${title.trim()}" for ${propertyName} - ${unitName}`,
        actionUrl: `/admin/maintenance`,
        metadata: { ticketId: ticket.id, priority: finalPriority },
        landlordId: landlordId ?? undefined,
      });
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
