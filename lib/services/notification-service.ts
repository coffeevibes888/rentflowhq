import { prisma } from '@/db/prisma';
import { decryptField } from '@/lib/encrypt';
import { sendBrandedEmail } from './email-service';

interface NotificationOptions {
  userId: string;
  type: 'application' | 'message' | 'maintenance' | 'payment' | 'reminder';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: any;
  landlordId?: string;
}

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  both: boolean;
}

export class NotificationService {
  // Get user's notification preferences (default to email)
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    // For now, default to email notifications
    // In the future, this would check user settings
    return {
      email: true, // Default to email
      sms: false,
      both: false,
    };
  }

  // Create notification and send based on preferences
  static async createNotification(options: NotificationOptions) {
    const { userId, type, title, message, actionUrl, metadata, landlordId } = options;

    // Create the notification in database
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

    // Get user preferences and send notifications
    const preferences = await this.getNotificationPreferences(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phoneNumber: true, name: true },
    });

    if (!user) return notification;

    // Send email notification (default or if email/both is enabled)
    if (preferences.email || preferences.both) {
      await this.sendEmailNotification({
        userId,
        type,
        title,
        message,
        actionUrl,
        user,
        landlordId,
      });
    }

    // Send SMS notification (if sms/both is enabled and phone number exists)
    if ((preferences.sms || preferences.both) && user.phoneNumber) {
      await this.sendSMSNotification({
        userId,
        type,
        title,
        message,
        phoneNumber: user.phoneNumber,
      });
    }

    return notification;
  }

  // Send email notification
  private static async sendEmailNotification({
    userId,
    type,
    title,
    message,
    actionUrl,
    user,
    landlordId,
  }: {
    userId: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    user: { email: string; name: string };
    landlordId?: string;
  }) {
    if (!landlordId) return;

    // Get landlord information
    const landlord = await prisma.landlord.findUnique({
      where: { id: landlordId },
      select: { name: true, subdomain: true, logoUrl: true, useSubdomain: true },
    });

    if (!landlord) return;

    // Get the root domain for login link
    const rawApex = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
    
    // Build login URL based on environment
    const isLocalhost = rawApex.includes('localhost');
    const protocol = isLocalhost ? 'http' : 'https';
    
    // If landlord has a subdomain, use it for the login URL
    let loginUrl: string;
    if (landlord.subdomain && landlord.useSubdomain) {
      loginUrl = `${protocol}://${landlord.subdomain}.${rawApex}/sign-in`;
    } else {
      // Fallback to main domain
      loginUrl = `${protocol}://${rawApex}/sign-in`;
    }

    try {
      await sendBrandedEmail({
        to: user.email,
        subject: title,
        template: 'notification',
        data: {
          landlord,
          recipientName: user.name,
          notificationType: type,
          title,
          message,
          actionUrl,
          loginUrl,
        },
        landlordId,
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  // Send SMS notification (placeholder for future implementation)
  private static async sendSMSNotification({
    userId,
    type,
    title,
    message,
    phoneNumber,
  }: {
    userId: string;
    type: string;
    title: string;
    message: string;
    phoneNumber: string;
  }) {
    // TODO: Implement SMS service when budget allows
    console.log('SMS notification would be sent:', {
      to: phoneNumber,
      title,
      message,
    });
  }

  // Get unread notifications for user
  static async getUnreadNotifications(userId: string, limit = 10) {
    return await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  // Send bulk notifications to all tenants of a landlord
  static async sendBulkNotificationToTenants(
    landlordId: string,
    options: Omit<NotificationOptions, 'userId'>
  ) {
    // Get all tenants for this landlord
    const tenants = await prisma.lease.findMany({
      where: {
        unit: {
          property: {
            landlordId,
          },
        },
        status: 'active',
      },
      include: {
        tenant: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Send notification to each tenant
    const notifications = await Promise.all(
      tenants.map((lease) =>
        this.createNotification({
          ...options,
          userId: lease.tenant.id,
        })
      )
    );

    return notifications;
  }

  // Create message using existing Thread system (simplified)
  static async createMessage(
    senderId: string,
    recipientId: string,
    subject: string,
    content: string,
    landlordId?: string
  ) {
    // Create a thread for the message
    const thread = await prisma.thread.create({
      data: {
        subject: subject,
      },
    });

    // Add participants
    await Promise.all([
      prisma.threadParticipant.create({
        data: {
          threadId: thread.id,
          userId: senderId,
        },
      }),
      prisma.threadParticipant.create({
        data: {
          threadId: thread.id,
          userId: recipientId,
        },
      }),
    ]);

    // Create the message
    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderUserId: senderId,
        content,
        role: 'user',
      },
    });

    // Create notification for recipient
    await this.createNotification({
      userId: recipientId,
      type: 'message',
      title: `New Message: ${subject}`,
      message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      actionUrl: `/messages/${thread.id}`,
      landlordId,
    });

    return { message, thread };
  }

  // Get messages for user using existing Thread system
  static async getMessages(userId: string, limit = 20) {
    const threads = await prisma.threadParticipant.findMany({
      where: {
        userId,
      },
      include: {
        thread: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        thread: {
          messages: {
            _count: 'desc',
          },
        },
      },
      take: limit,
    });

    for (const tp of threads as any[]) {
      const msgs = tp?.thread?.messages;
      if (Array.isArray(msgs)) {
        for (const m of msgs) {
          if (m && typeof m.content === 'string') {
            m.content = await decryptField(m.content);
          }
        }
      }
    }

    return threads;
  }
}
