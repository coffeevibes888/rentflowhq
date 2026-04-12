import { NextRequest, NextResponse } from 'next/server';
import { trackPageView } from '@/lib/actions/analytics.actions';
import { auth } from '@/auth';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { path, referrer } = await request.json();

    // Check if user is super admin - exclude from analytics
    const session = await auth();
    if (session?.user?.role === 'superAdmin') {
      return NextResponse.json({ ok: true, skipped: 'superAdmin' });
    }

    let sessionCartId = request.cookies.get('sessionCartId')?.value;
    const country = request.headers.get('x-vercel-ip-country');
    const region = request.headers.get('x-vercel-ip-country-region');
    const city = request.headers.get('x-vercel-ip-city');
    const userAgent = request.headers.get('user-agent');

    if (!path) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });

    if (!sessionCartId) {
      sessionCartId = randomUUID();
      res.cookies.set('sessionCartId', sessionCartId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    // User ID (if logged in) is already associated with the sessionCartId via auth
    await trackPageView({
      sessionCartId,
      userId: undefined,
      path,
      referrer: referrer || null,
      country: country || null,
      region: region || null,
      city: city || null,
      userAgent: userAgent || null,
    });

    return res;
  } catch (error) {
    console.error('Error in analytics track route', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
