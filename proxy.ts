import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy for path-based "subdomain" routing (Next 16+; replaces middleware.ts).
 *
 * Since we're on Vercel Hobby (no wildcard custom domains), we use path-based routing:
 * - propertyflowhq.com/[landlord-slug]/... for tenant-facing pages
 * - propertyflowhq.com/admin/... for landlord admin
 * - propertyflowhq.com/user/... for tenant dashboard
 *
 * The [subdomain] dynamic route folder handles /[landlord-slug]/... paths automatically.
 * This proxy just ensures proper header passing and basic routing.
 */
export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Skip for API routes and static files
  if (path.startsWith('/api/') ||
      path.startsWith('/_next/') ||
      path === '/robots.txt' ||
      path === '/sitemap.xml' ||
      path.includes('.')) {
    return NextResponse.next();
  }

  // Extract landlord slug from path if present (e.g., /love-your-god/... -> love-your-god)
  const pathParts = path.split('/').filter(Boolean);
  const potentialSlug = pathParts[0];

  // Known top-level routes that are NOT landlord slugs
  const reservedRoutes = [
    'admin', 'user', 'super-admin', 'onboarding', 'sign-in', 'sign-up',
    'verify-email', 'forgot-password', 'reset-password', 'unauthorized',
    'about', 'blog', 'contact', 'cart', 'checkout', 'products', 'product',
    'search', 'order', 'shipping-address', 'place-order', 'payment-method',
    'verify-payment-method', 'application', 'chat', 'agent', 'contractor',
    'employee', 'team', 'listings', 'marketplace', 'contractors', 'homeowner',
    'dispute-center', 'faq', 'docs'
  ];

  if (potentialSlug && !reservedRoutes.includes(potentialSlug)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-landlord-slug', potentialSlug);
    requestHeaders.set('x-pathname', path);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}
