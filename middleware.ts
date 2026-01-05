import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for path-based "subdomain" routing
 * 
 * Since we're on Vercel Hobby (no wildcard custom domains), we use path-based routing:
 * - propertyflowhq.com/[landlord-slug]/... for tenant-facing pages
 * - propertyflowhq.com/admin/... for landlord admin
 * - propertyflowhq.com/user/... for tenant dashboard
 * 
 * The [subdomain] dynamic route folder handles /[landlord-slug]/... paths automatically.
 * This middleware just ensures proper header passing and basic routing.
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Skip middleware for API routes and static files
  if (path.startsWith('/api/') ||
      path.startsWith('/_next/') ||
      path === '/robots.txt' ||
      path === '/sitemap.xml' ||
      path.includes('.')) {
    return NextResponse.next();
  }

  // Extract landlord slug from path if present (e.g., /love-your-god/... -> love-your-god)
  // This is for path-based "subdomain" routing
  const pathParts = path.split('/').filter(Boolean);
  const potentialSlug = pathParts[0];
  
  // Known top-level routes that are NOT landlord slugs
  const reservedRoutes = [
    'admin', 'user', 'super-admin', 'onboarding', 'sign-in', 'sign-up',
    'verify-email', 'forgot-password', 'reset-password', 'unauthorized',
    'about', 'blog', 'contact', 'cart', 'checkout', 'products', 'product',
    'search', 'order', 'shipping-address', 'place-order', 'payment-method',
    'verify-payment-method', 'application', 'chat', 'agent', 'contractor',
    'employee', 'team', 'listings'
  ];

  // If first path segment looks like a landlord slug (not a reserved route)
  if (potentialSlug && !reservedRoutes.includes(potentialSlug)) {
    // Add the slug to headers so pages can access it
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-landlord-slug', potentialSlug);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}
