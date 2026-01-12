import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/auth';
import { prisma } from '@/db/prisma';
import { getSubdomainRedirectUrl } from '@/lib/utils/subdomain-redirect';
import { notifySuspiciousActivity } from '@/lib/services/admin-notifications';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { logAuthEvent } from '@/lib/security/audit-logger';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const callbackUrl = formData.get('callbackUrl') as string;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    }

    // Get IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;

    // Check rate limit for this IP
    const rateLimitKey = `auth:${ip}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.auth);
    
    if (!rateLimit.allowed) {
      // Notify admin of potential brute force
      notifySuspiciousActivity({
        type: 'Brute Force Attempt',
        description: `Too many failed login attempts from IP: ${ip}`,
        userEmail: email,
        ipAddress: ip,
        userAgent,
        severity: 'high',
      }).catch(console.error);

      // Log rate limit hit to audit log
      logAuthEvent('AUTH_FAILED_LOGIN', {
        email,
        ipAddress: ip,
        userAgent,
        success: false,
        failureReason: 'Rate limit exceeded',
      }).catch(console.error);

      return NextResponse.json({ 
        success: false, 
        message: 'Too many login attempts. Please try again later.' 
      }, { status: 429 });
    }

    // Attempt sign in
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      // Log failed attempt to audit log
      logAuthEvent('AUTH_FAILED_LOGIN', {
        email,
        ipAddress: ip,
        userAgent,
        success: false,
        failureReason: 'Invalid credentials',
      }).catch(console.error);

      // Notify if multiple failures
      if (rateLimit.remaining <= 2) {
        notifySuspiciousActivity({
          type: 'Multiple Failed Logins',
          description: `Multiple failed login attempts for email: ${email}`,
          userEmail: email,
          ipAddress: ip,
          userAgent,
          severity: 'medium',
        }).catch(console.error);
      }
      
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Get the authenticated user to determine redirect
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Log successful login to audit log
    logAuthEvent('AUTH_LOGIN', {
      userId: user.id,
      email,
      ipAddress: ip,
      userAgent,
      success: true,
    }).catch(console.error);

    // Special handling for affiliate dashboard callback
    const isAffiliateCallback = callbackUrl?.includes('/affiliate-program/dashboard');
    
    if (isAffiliateCallback) {
      // Check if user is an affiliate
      const affiliate = await prisma.affiliate.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!affiliate) {
        // Not an affiliate - redirect to affiliate signup page
        return NextResponse.json({ 
          success: true, 
          redirectUrl: '/affiliate-program?signup=required',
        });
      }

      // User is an affiliate - check if they have another role
      const hasOtherRole = user.role && !['user'].includes(user.role.toLowerCase());
      
      if (hasOtherRole) {
        // Has another role (landlord, tenant, etc.) - redirect to their main dashboard
        // The affiliate link will be shown in their navigation (cached via localStorage)
        const redirectUrl = await getSubdomainRedirectUrl(user.role, user.id);
        return NextResponse.json({ 
          success: true, 
          redirectUrl,
        });
      }

      // Pure affiliate (no other role) - go directly to affiliate dashboard
      return NextResponse.json({ 
        success: true, 
        redirectUrl: '/affiliate-program/dashboard',
      });
    }

    // Determine redirect URL - ignore default callback URLs, use role-based routing
    const isDefaultCallback = !callbackUrl || 
      callbackUrl.trim() === '/' || 
      callbackUrl.trim() === '/user/dashboard' ||
      callbackUrl.trim() === '/sign-in';
    
    const redirectUrl = isDefaultCallback
      ? await getSubdomainRedirectUrl(user.role, user.id)
      : callbackUrl.trim();

    return NextResponse.json({ 
      success: true, 
      redirectUrl,
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
  }
}
