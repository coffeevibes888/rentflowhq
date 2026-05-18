/**
 * GET /api/beta/validate?code=ABCD1234
 *
 * Public endpoint used by the sign-up form to live-validate a beta code from
 * the `?code=` URL parameter. Returns just enough info to render the green
 * "unlocked" banner — never reveals admin-only fields.
 *
 * Rate-limited per IP to prevent code enumeration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get('code') || '').trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ valid: false, message: 'Code required' }, { status: 400 });
  }

  // Rate limit by IP — 30 attempts per 10 min. Plenty for legitimate users
  // (refresh, retry on typo) but blocks code-fishing attacks.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  const limit = checkRateLimit(`beta-validate:${ip}`, {
    windowMs: 10 * 60 * 1000,
    maxRequests: 30,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { valid: false, message: 'Too many attempts. Please wait a moment.' },
      { status: 429 },
    );
  }

  const program = await prisma.betaProgram.findUnique({ where: { code } });

  if (!program || !program.isActive) {
    return NextResponse.json({ valid: false, message: 'Invalid code' });
  }
  if (program.expiresAt && program.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, message: 'This code has expired' });
  }
  if (program.redeemedCount >= program.maxRedemptions) {
    return NextResponse.json({
      valid: false,
      message: `Code is fully redeemed (${program.maxRedemptions}/${program.maxRedemptions} spots used)`,
    });
  }

  return NextResponse.json({
    valid: true,
    program: {
      code: program.code,
      audience: program.audience,
      freeMonths: program.freeMonths,
      postFreeDiscountPercent: program.postFreeDiscountPercent,
      postFreeDiscountMonths: program.postFreeDiscountMonths,
      spotsRemaining: program.maxRedemptions - program.redeemedCount,
    },
  });
}
