/**
 * POST /api/mobile/push-tokens
 *
 * Registers an Expo push token for the authenticated user.
 *
 * For now this just acks the request — the actual storage layer can be added
 * later (a `PushToken` table or a JSON column on User). Adding the storage
 * doesn't change the mobile-side contract.
 *
 * Body: { token: string, platform: 'ios' | 'android' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/mobile-auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const auth = authHeader?.replace('Bearer ', '');
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyMobileToken(auth);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { token, platform } = body as { token?: string; platform?: string };
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    // TODO: persist token. For now log so we can see registrations during early rollout.
    console.log('[push-tokens] registered', {
      userId: payload.userId,
      role: payload.role,
      platform,
      tokenPreview: token.slice(0, 20) + '…',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[mobile/push-tokens]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
