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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        image: true,
        notificationPreferences: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: payload.userId },
      select: {
        id: true,
        name: true,
        companyName: true,
        subdomain: true,
        useSubdomain: true,
        logoUrl: true,
        lateFeeAmount: true,
        lateFeeGraceDays: true,
        lateFeeType: true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        role: user.role,
        image: user.image,
        twoFactorEnabled: user.twoFactorEnabled,
        memberSince: user.createdAt.toISOString(),
        notificationPreferences: user.notificationPreferences ?? { email: true, sms: false, both: false },
      },
      landlord: landlord
        ? {
            id: landlord.id,
            name: landlord.name,
            companyName: landlord.companyName,
            subdomain: landlord.subdomain,
            useSubdomain: landlord.useSubdomain,
            logoUrl: landlord.logoUrl,
            lateFeeAmount: landlord.lateFeeAmount ? Number(landlord.lateFeeAmount) : null,
            lateFeeGraceDays: landlord.lateFeeGraceDays,
            lateFeeType: landlord.lateFeeType,
          }
        : null,
    });
  } catch (error) {
    console.error('[mobile/pm/settings]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user settings
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyMobileToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { name, phone, notificationPreferences } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phoneNumber = phone;
    if (notificationPreferences !== undefined) updateData.notificationPreferences = notificationPreferences;

    await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[mobile/pm/settings PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
