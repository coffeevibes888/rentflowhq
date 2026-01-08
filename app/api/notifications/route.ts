import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// GET /api/notifications - Get notifications for user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeRead = searchParams.get('includeRead') === 'true';

    // Verify user can only access their own notifications
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const whereClause = {
      userId,
      ...(includeRead ? {} : { isRead: false }),
    };

    // Always get unread count
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    // Get notifications (with or without read ones based on includeRead)
    const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    // Log full error in development
    console.error('Failed to fetch notifications:', error);
    
    // Check if it's a Prisma error (table doesn't exist)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('does not exist') || errorMessage.includes('P2021')) {
      // Table doesn't exist - return empty notifications
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
      });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, message, actionUrl, metadata, landlordId } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user has permission to create notifications for this user/landlord
    if (userId !== session.user.id) {
      // If creating for another user, verify landlord relationship
      if (landlordId) {
        const landlord = await prisma.landlord.findFirst({
          where: {
            id: landlordId,
            OR: [
              { ownerUserId: session.user.id },
              {
                properties: {
                  some: {
                    units: {
                      some: {
                        leases: {
                          some: {
                            tenantId: userId,
                            status: 'active',
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        });

        if (!landlord) {
          return NextResponse.json({ error: 'Forbidden - not associated with this landlord' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Forbidden - cannot create notifications for other users' }, { status: 403 });
      }
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl,
        metadata,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    // Log error without exposing sensitive details
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Failed to create notification:', error instanceof Error ? error.message : 'Unknown error');
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
