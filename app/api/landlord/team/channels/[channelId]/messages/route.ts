import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getWebSocketServer } from '@/lib/websocket-server-types';

// GET - Fetch messages for a channel
export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = params;

    // Verify user has access to this channel
    const channel = await prisma.teamChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      console.error('Channel not found:', channelId);
      return NextResponse.json({ success: false, message: 'Channel not found' }, { status: 404 });
    }

    // Get the landlord
    const landlord = await prisma.landlord.findUnique({
      where: { id: channel.landlordId },
    });

    if (!landlord) {
      console.error('Landlord not found:', channel.landlordId);
      return NextResponse.json({ success: false, message: 'Landlord not found' }, { status: 404 });
    }

    // Check if user is landlord owner or team member
    const isOwner = landlord.ownerUserId === session.user.id;
    
    let isTeamMember = false;
    try {
      const teamMember = await (prisma as any).teamMember?.findFirst?.({
        where: {
          userId: session.user.id,
          landlordId: channel.landlordId,
          status: 'active',
        },
      });
      isTeamMember = !!teamMember;
    } catch (error) {
      console.log('TeamMember check skipped:', error);
    }

    if (!isOwner && !isTeamMember) {
      console.error('Access denied for user:', session.user.id, 'to channel:', channelId);
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Fetch messages
    const messages = await prisma.teamMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      take: 100, // Limit to last 100 messages
    });

    // Fetch senders for all messages
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    const senders = await prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    const senderMap = new Map(senders.map(s => [s.id, s]));

    return NextResponse.json({
      success: true,
      messages: messages.map(m => ({
        id: m.id,
        channelId: m.channelId,
        content: m.content,
        senderId: m.senderId,
        senderName: senderMap.get(m.senderId)?.name || 'Unknown',
        senderImage: senderMap.get(m.senderId)?.image,
        sender: senderMap.get(m.senderId) || { id: m.senderId, name: 'Unknown', email: '', image: null },
        createdAt: m.createdAt.toISOString(),
        reactions: [],
        attachments: m.attachments || [],
      })),
    });
  } catch (error) {
    console.error('Failed to fetch messages - Full error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch messages', error: String(error) },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = params;
    const body = await request.json();
    const { content, attachments } = body;

    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'Message content or attachments required' },
        { status: 400 }
      );
    }

    // Verify user has access to this channel
    const channel = await prisma.teamChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return NextResponse.json({ success: false, message: 'Channel not found' }, { status: 404 });
    }

    // Get the landlord
    const landlord = await prisma.landlord.findUnique({
      where: { id: channel.landlordId },
    });

    if (!landlord) {
      return NextResponse.json({ success: false, message: 'Landlord not found' }, { status: 404 });
    }

    // Check if user is landlord owner or team member
    const isOwner = landlord.ownerUserId === session.user.id;
    let isTeamMember = false;
    try {
      const teamMember = await (prisma as any).teamMember?.findFirst?.({
        where: {
          userId: session.user.id,
          landlordId: channel.landlordId,
          status: 'active',
        },
      });
      isTeamMember = !!teamMember;
    } catch (error) {
      console.log('TeamMember check skipped:', error);
    }

    if (!isOwner && !isTeamMember) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Create message
    const message = await prisma.teamMessage.create({
      data: {
        channelId,
        senderId: session.user.id,
        content: content?.trim() || '',
        attachments: attachments || [],
      },
    });

    // Fetch sender info
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    const messageResponse = {
      id: message.id,
      channelId: message.channelId,
      content: message.content,
      senderId: message.senderId,
      senderName: sender?.name || 'Unknown',
      senderImage: sender?.image,
      sender: sender || { id: session.user.id, name: 'Unknown', email: '', image: null },
      createdAt: message.createdAt.toISOString(),
      reactions: [],
      attachments: message.attachments || [],
    };

    // Broadcast to WebSocket clients
    const wsServer = getWebSocketServer();
    if (wsServer) {
      wsServer.broadcastNewMessage(channelId, messageResponse);
    }

    return NextResponse.json({
      success: true,
      message: messageResponse,
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message', error: String(error) },
      { status: 500 }
    );
  }
}
