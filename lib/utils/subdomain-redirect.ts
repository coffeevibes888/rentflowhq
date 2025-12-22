import { headers } from 'next/headers';
import { prisma } from '@/db/prisma';

/**
 * PATH-BASED ROUTING (Vercel Hobby compatible)
 * 
 * Instead of subdomain.rooms4rentlv.com, we use rooms4rentlv.com/[landlord-slug]/...
 * This works on Vercel Hobby without wildcard domain support.
 * 
 * URL patterns:
 * - Tenant portal: /[landlord-slug]/ (public listings)
 * - Tenant sign-in on portal: /[landlord-slug]/sign-in
 * - Tenant dashboard: /user/dashboard (main domain, after login)
 * - Landlord admin: /admin/overview (main domain)
 */

/**
 * Extract landlord slug from the current request path
 * Returns null if on main domain routes (not a landlord portal path)
 */
async function getLandlordSlugFromPath(): Promise<string | null> {
  const headersList = await headers();
  // Check if middleware set the slug header
  const slugFromHeader = headersList.get('x-landlord-slug');
  if (slugFromHeader) {
    return slugFromHeader;
  }
  return null;
}

/**
 * Get redirect URL after login based on user role
 * Uses path-based routing instead of subdomain routing
 */
export async function getSubdomainRedirectUrl(userRole: string, userId: string): Promise<string> {
  try {
    const currentSlug = await getLandlordSlugFromPath();

    // If user is on a landlord portal path (e.g., /love-your-god/sign-in)
    if (currentSlug) {
      const landlord = await prisma.landlord.findUnique({
        where: { subdomain: currentSlug },
      });

      if (landlord) {
        // Check if user is associated with this landlord
        const userAssociation = await prisma.user.findFirst({
          where: {
            id: userId || '',
            OR: [
              { id: landlord.ownerUserId || '' },
              {
                leasesAsTenant: {
                  some: {
                    unit: {
                      property: {
                        landlordId: landlord.id,
                      },
                    },
                  },
                },
              },
            ],
          },
        });

        if (userAssociation) {
          switch (userRole) {
            case 'landlord':
            case 'property_manager':
            case 'admin':
              return '/admin/overview';
            case 'tenant':
              // Tenant stays on main domain dashboard (simpler than path-based tenant routes)
              return '/user/dashboard';
            default:
              return '/';
          }
        } else {
          // User doesn't belong to this landlord's portal
          // But if they're a landlord/admin, still send them to admin
          if (userRole === 'landlord' || userRole === 'property_manager' || userRole === 'admin') {
            return '/admin/overview';
          }
          return '/';
        }
      } else {
        // Landlord slug doesn't exist, redirect based on role
        if (userRole === 'landlord' || userRole === 'property_manager' || userRole === 'admin') {
          return '/admin/overview';
        }
        return '/';
      }
    }

    // Not on a landlord portal path, redirect based on role
    switch (userRole) {
      case 'admin':
      case 'landlord':
      case 'property_manager':
        return '/admin/overview';
      case 'tenant': {
        // For tenants signing in from main domain, just go to dashboard
        // The dashboard will show their lease info regardless of which landlord
        return '/user/dashboard';
      }
      default:
        return '/';
    }
  } catch (error) {
    console.error('Error determining redirect:', error);
    // Fallback based on role even if there's an error
    if (userRole === 'landlord' || userRole === 'property_manager' || userRole === 'admin') {
      return '/admin/overview';
    } else if (userRole === 'tenant') {
      return '/user/dashboard';
    }
    return '/';
  }
}

/**
 * Build a landlord portal URL (path-based)
 * Example: buildLandlordPortalUrl('love-your-god', '/') => '/love-your-god/'
 */
export function buildLandlordPortalUrl(landlordSlug: string, path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${landlordSlug}${cleanPath}`;
}
