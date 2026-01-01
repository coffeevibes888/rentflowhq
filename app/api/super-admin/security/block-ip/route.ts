import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { logAuditEvent } from '@/lib/security/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ipAddress, reason, expiresAt } = body;

    if (!ipAddress) {
      return NextResponse.json(
        { message: 'IP address is required' },
        { status: 400 }
      );
    }

    // Check if already blocked
    const existing = await prisma.blockedIP.findUnique({
      where: { ipAddress },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'IP is already blocked' },
        { status: 400 }
      );
    }

    // Block the IP
    await prisma.blockedIP.create({
      data: {
        ipAddress,
        reason: reason || 'Blocked by super admin',
        blockedBy: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Log the action
    await logAuditEvent({
      action: 'ADMIN_ACTION',
      userId: session.user.id,
      resourceType: 'blocked_ip',
      metadata: { ipAddress, reason },
      severity: 'WARNING',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error blocking IP:', error);
    return NextResponse.json(
      { message: 'Failed to block IP' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ipAddress = searchParams.get('ip');

    if (!ipAddress) {
      return NextResponse.json(
        { message: 'IP address is required' },
        { status: 400 }
      );
    }

    await prisma.blockedIP.delete({
      where: { ipAddress },
    });

    // Log the action
    await logAuditEvent({
      action: 'ADMIN_ACTION',
      userId: session.user.id,
      resourceType: 'blocked_ip',
      metadata: { ipAddress, action: 'unblocked' },
      severity: 'INFO',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    return NextResponse.json(
      { message: 'Failed to unblock IP' },
      { status: 500 }
    );
  }
}
