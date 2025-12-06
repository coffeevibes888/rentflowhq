import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    const body = await req.json();
    const { title, description, priority } = body as {
      title?: string;
      description?: string;
      priority?: string;
    };

    if (!title || !description) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    await prisma.maintenanceTicket.create({
      data: {
        tenantId: userId,
        title,
        description,
        priority: priority && ['low', 'medium', 'high', 'urgent'].includes(priority)
          ? priority
          : 'medium',
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance ticket', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
