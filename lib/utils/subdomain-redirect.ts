import { headers } from 'next/headers';
import { prisma } from '@/db/prisma';

export async function getSubdomainRedirectUrl(userRole: string, userId: string): Promise<string> {
  try {
    // Get the current host to detect subdomain
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const rawApex = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

    const bareHost = host.split(':')[0].toLowerCase();
    let subdomain: string | null = null;

    if (rawApex) {
      const apexLower = rawApex.toLowerCase();
      if (bareHost !== apexLower && bareHost.endsWith(`.${apexLower}`)) {
        subdomain = bareHost.slice(0, bareHost.length - apexLower.length - 1);
      }
    }

    // If we're on a subdomain, verify the user belongs to this landlord
    if (subdomain) {
      const landlord = await prisma.landlord.findUnique({
        where: { subdomain },
      });

      if (landlord) {
        // Check if user is associated with this landlord
        const userAssociation = await prisma.user.findFirst({
          where: {
            id: userId || '',
            OR: [
              // User is the landlord owner
              { id: landlord.ownerUserId || '' },
              // User is a tenant of this landlord
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
          // User belongs to this landlord's subdomain, redirect to appropriate dashboard
          switch (userRole) {
            case 'landlord':
              return `/${subdomain}/admin`;
            case 'property_manager':
              return `/${subdomain}/admin`;
            case 'tenant':
              return `/${subdomain}/user`;
            default:
              return `/${subdomain}`;
          }
        } else {
          // User doesn't belong to this subdomain, redirect to main domain
          return '/';
        }
      }
    }

    // Not on a subdomain, redirect based on role
    switch (userRole) {
      case 'landlord':
        // Check if landlord has a subdomain
        const landlordRecord = await prisma.landlord.findFirst({
          where: { ownerUserId: userId },
        });

        if (landlordRecord?.subdomain && landlordRecord.useSubdomain && rawApex) {
          return `https://${landlordRecord.subdomain}.${rawApex}/admin`;
        }
        return '/admin/overview';
      case 'property_manager':
        // For now, redirect property managers to main admin dashboard
        // TODO: Implement property manager to landlord association when schema supports it
        return '/admin';
      case 'tenant':
        // Find which landlord this tenant rents from
        const tenantLease = await prisma.lease.findFirst({
          where: {
            tenantId: userId || '',
            status: 'active',
          },
          include: {
            unit: {
              include: {
                property: {
                  include: { landlord: true },
                },
              },
            },
          },
        });

        if (tenantLease?.unit?.property?.landlord?.subdomain && tenantLease.unit.property.landlord.useSubdomain && rawApex) {
          return `https://${tenantLease.unit.property.landlord.subdomain}.${rawApex}/user`;
        }
        return '/user/dashboard';
      default:
        return '/';
    }
  } catch (error) {
    console.error('Error determining subdomain redirect:', error);
    return '/'; // Fallback to home
  }
}
