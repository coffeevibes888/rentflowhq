import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contractorUserId, message, subject } = body;

    if (!contractorUserId || !message) {
      return NextResponse.json(
        { error: 'Contractor user ID and message are required' },
        { status: 400 }
      );
    }

    // Check if a thread already exists between these users
    let thread = await prisma.thread.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [session.user.id, contractorUserId]
            }
          }
        }
      },
      include: {
        participants: true
      }
    });

    // If no thread exists, create one
    if (!thread) {
      thread = await prisma.thread.create({
        data: {
          subject: subject || 'New Conversation',
          participants: {
            create: [
              { userId: session.user.id },
              { userId: contractorUserId }
            ]
          }
        },
        include: {
          participants: true
        }
      });
    }

    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderUserId: session.user.id,
        senderName: session.user.name || undefined,
        senderEmail: session.user.email || undefined,
        content: message,
        role: 'user',
      },
    });

    // Update thread's updatedAt
    await prisma.thread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: newMessage,
      threadId: thread.id,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
