import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { cookies } from 'next/headers';

// POST - Track affiliate click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, landingPage, referrerUrl, sessionId } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Find affiliate by code
    const affiliate = await prisma.affiliate.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!affiliate || affiliate.status !== 'active') {
      return NextResponse.json({ error: 'Invalid or inactive affiliate code' }, { status: 404 });
    }

    // Get geo info from headers (if using Vercel or similar)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const country = request.headers.get('x-vercel-ip-country') || undefined;
    const region = request.headers.get('x-vercel-ip-country-region') || undefined;
    const city = request.headers.get('x-vercel-ip-city') || undefined;

    // Create click record
    await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress: ip,
        userAgent,
        referrerUrl,
        landingPage,
        country,
        region,
        city,
        sessionId,
      },
    });

    // Update affiliate click count
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { totalClicks: { increment: 1 } },
    });

    // Set cookie for 30 days
    const cookieStore = await cookies();
    cookieStore.set('affiliate_code', affiliate.code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    if (sessionId) {
      cookieStore.set('affiliate_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
    }

    return NextResponse.json({ 
      success: true, 
      affiliateName: affiliate.name,
    });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}

// GET - Check if user has affiliate cookie
export async function GET() {
  try {
    const cookieStore = await cookies();
    const affiliateCode = cookieStore.get('affiliate_code')?.value;

    if (!affiliateCode) {
      return NextResponse.json({ hasAffiliate: false });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { code: affiliateCode },
      select: { id: true, name: true, code: true, status: true },
    });

    if (!affiliate || affiliate.status !== 'active') {
      return NextResponse.json({ hasAffiliate: false });
    }

    return NextResponse.json({
      hasAffiliate: true,
      affiliateCode: affiliate.code,
      affiliateName: affiliate.name,
    });
  } catch (error) {
    console.error('Error checking affiliate:', error);
    return NextResponse.json({ hasAffiliate: false });
  }
}
