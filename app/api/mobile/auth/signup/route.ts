/**
 * POST /api/mobile/auth/signup
 *
 * Mobile native sign-up. Mirrors the web `signUpUser` server action but
 * returns a JWT for mobile session storage instead of using NextAuth cookies.
 *
 * Body:
 *   { name, email, phoneNumber, password, betaCode? }
 *
 * Returns 201 on success with `{ token, user, portals, beta? }` so the
 * mobile app can store the token in SecureStore and route the user straight
 * into their dashboard. If a beta code is included it's redeemed in the same
 * transaction so the user lands with Enterprise access already active.
 */

import { SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

import { hash } from '@/lib/encrypt';
import { prisma } from '@/db/prisma';
import { redeemBetaCodeForNewUser } from '@/lib/actions/beta-tester.actions';
import { logAuthEvent } from '@/lib/security/audit-logger';
import { notifyNewSignup } from '@/lib/services/admin-notifications';
import { sendVerificationEmailToken } from '@/lib/actions/auth.actions';

const PHONE_REGEX = /^(\+1|1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phoneNumber = String(body.phoneNumber ?? '').trim();
    const password = String(body.password ?? '');
    const rawBetaCode = String(body.betaCode ?? '').trim().toUpperCase();

    if (name.length < 3) return bad('Name must be at least 3 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Invalid email');
    if (!PHONE_REGEX.test(phoneNumber)) return bad('Invalid phone number');
    if (password.length < 6) return bad('Password must be at least 6 characters');

    // Email collision check
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return bad('An account with that email already exists', 409);

    // Beta code pre-validation (we want to fail fast before persisting)
    let program: Awaited<ReturnType<typeof prisma.betaProgram.findUnique>> | null = null;
    if (rawBetaCode) {
      program = await prisma.betaProgram.findUnique({ where: { code: rawBetaCode } });
      if (!program || !program.isActive) return bad(`Invalid beta code: ${rawBetaCode}`);
      if (program.expiresAt && program.expiresAt < new Date()) return bad('That beta code has expired');
      if (program.redeemedCount >= program.maxRedemptions) {
        return bad(`That beta code is fully redeemed (${program.maxRedemptions}/${program.maxRedemptions} spots used)`);
      }
    }

    // Match user role to program audience when one is provided
    let role = 'user';
    if (program?.audience === 'pm') role = 'landlord';
    else if (program?.audience === 'contractor') role = 'contractor';

    const hashedPassword = await hash(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        role,
        onboardingCompleted: !!program,
      },
      select: {
        id: true, email: true, name: true, role: true, image: true,
      },
    });

    // Side effects (non-blocking)
    notifyNewSignup({
      name,
      email,
      role,
      signupMethod: program ? `Beta (${program.code}) · Mobile` : 'Mobile',
    }).catch(console.error);
    sendVerificationEmailToken(email).catch(console.error);
    logAuthEvent('AUTH_SIGNUP', {
      userId: user.id,
      email,
      role,
      success: true,
    }).catch(console.error);

    let betaResult: any = null;
    if (program) {
      betaResult = await redeemBetaCodeForNewUser({
        userId: user.id,
        program: {
          id: program.id,
          code: program.code,
          audience: program.audience,
          maxRedemptions: program.maxRedemptions,
          freeMonths: program.freeMonths,
          postFreeDiscountMonths: program.postFreeDiscountMonths,
          postFreeDiscountPercent: program.postFreeDiscountPercent,
        },
        name,
      });
    }

    // Mint a mobile JWT (same shape as the login route)
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'fallback-dev-secret',
    );
    const token = await new SignJWT({
      userId: user.id,
      role: user.role,
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    // Build portals — for fresh signups it's just the one matching their role
    const portals: { role: string; label: string; reason: string }[] = [];
    if (role === 'landlord' || role === 'admin') {
      portals.push({ role: 'admin', label: 'Property Manager', reason: 'Manage properties' });
    } else if (role === 'contractor') {
      portals.push({ role: 'contractor', label: 'Contractor', reason: 'Manage jobs and crew' });
    } else {
      portals.push({ role: role || 'user', label: 'Account', reason: 'Your dashboard' });
    }

    return NextResponse.json(
      {
        token,
        user,
        portals,
        beta: betaResult ?? null,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error('[mobile signup]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
