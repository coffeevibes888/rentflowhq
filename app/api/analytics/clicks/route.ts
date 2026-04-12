import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const { clicks } = await request.json();

    // Batch insert click events
    await prisma.clickEvent.createMany({
      data: clicks.map((click: any) => ({
        sessionId: click.sessionId,
        userId: session?.user?.id || null,
        path: click.path,
        elementId: click.elementId || null,
        elementClass: click.elementClass || null,
        elementTag: click.elementTag,
        elementText: click.elementText || null,
        xPosition: click.xPosition,
        yPosition: click.yPosition,
      })),
    });

    // Update session click count
    await prisma.userSession.updateMany({
      where: { sessionId: clicks[0]?.sessionId },
      data: {
        clickCount: { increment: clicks.length },
      },
    });

    return NextResponse.json({ success: true, count: clicks.length });
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json({ error: 'Failed to track clicks' }, { status: 500 });
  }
}
