/**
 * GET /api/mobile/chat/threads
 *
 * Unified message-thread list across all roles. The mobile floating chat
 * widget uses this so the user sees ONE inbox regardless of role:
 *   - PM ↔ tenant
 *   - PM ↔ contractor
 *   - PM ↔ team member
 *   - Tenant ↔ PM
 *   - Contractor ↔ PM
 *
 * Each thread row includes participant names, last-message preview, unread
 * count, and a relative timestamp.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyMobileToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const threads = await prisma.thread.findMany({
      where: {
        participants: { some: { userId: payload.userId, isDeleted: false } },
        isArchived: false,
      },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: {
        id: true,
        subject: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            senderName: true,
            senderUserId: true,
            createdAt: true,
          },
        },
        participants: {
          select: {
            userId: true,
            lastReadAt: true,
            user: { select: { name: true, email: true, image: true } },
          },
        },
      },
    });

    const unreadCount = threads.filter((t) => {
      const last = t.messages[0];
      const me = t.participants.find((p) => p.userId === payload.userId);
      if (!last || last.senderUserId === payload.userId) return false;
      return !me?.lastReadAt || new Date(last.createdAt) > new Date(me.lastReadAt);
    }).length;

    return NextResponse.json({
      threads: threads.map((t) => {
        const last = t.messages[0] ?? null;
        const others = t.participants.filter((p) => p.userId !== payload.userId);
        const me = t.participants.find((p) => p.userId === payload.userId);
        const isUnread = last
          ? last.senderUserId !== payload.userId
            && (!me?.lastReadAt || new Date(last.createdAt) > new Date(me.lastReadAt))
          : false;

        return {
          id: t.id,
          subject: t.subject,
          updatedAt: t.updatedAt.toISOString(),
          isUnread,
          participants: others.map((p) => ({
            id: p.userId,
            name: p.user?.name ?? 'Unknown',
            image: p.user?.image ?? null,
          })),
          lastMessage: last
            ? {
                content: (last.content ?? '').slice(0, 140),
                senderName: last.senderName ?? 'Unknown',
                createdAt: last.createdAt.toISOString(),
                isOwn: last.senderUserId === payload.userId,
              }
            : null,
        };
      }),
      unreadCount,
    });
  } catch (e: any) {
    console.error('chat threads', e);
    return NextResponse.json({ threads: [], unreadCount: 0 });
  }
}
