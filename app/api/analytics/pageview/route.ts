import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const data = await request.json();

    // Create page view record
    const pageView = await prisma.pageView.create({
      data: {
        sessionId: data.sessionId,
        userId: session?.user?.id || null,
        path: data.path,
        referrer: data.referrer || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        utmTerm: data.utmTerm || null,
        utmContent: data.utmContent || null,
        device: data.device,
        browser: data.browser,
        os: data.os,
        screenWidth: data.screenWidth,
        screenHeight: data.screenHeight,
      },
    });

    // Update or create user session
    await prisma.userSession.upsert({
      where: { sessionId: data.sessionId },
      create: {
        sessionId: data.sessionId,
        userId: session?.user?.id || null,
        startTime: new Date(),
        pageCount: 1,
        landingPage: data.path,
        referrer: data.referrer || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        device: data.device,
        browser: data.browser,
        os: data.os,
      },
      update: {
        pageCount: { increment: 1 },
        endTime: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: pageView.id });
  } catch (error) {
    console.error('PageView tracking error:', error);
    return NextResponse.json({ error: 'Failed to track page view' }, { status: 500 });
  }
}
