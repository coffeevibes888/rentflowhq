/**
 * External API - Properties Endpoint
 * 
 * GET /api/v1/properties - List all properties
 * POST /api/v1/properties - Create a new property
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/db/prisma';
import {
  withApiAuth,
  apiSuccess,
  apiPaginated,
  apiError,
  parsePagination,
  parseSort,
  ApiContext,
} from '@/lib/api/middleware';
import { hasScope } from '@/lib/services/api-key.service';

// GET /api/v1/properties
export const GET = withApiAuth(
  async (req: NextRequest, ctx: ApiContext) => {
    if (!hasScope(ctx.scopes, 'properties:read')) {
      return apiError('Missing required scope: properties:read', 403, 'insufficient_scope');
    }

    const { page, limit, offset } = parsePagination(req);
    const { field, order } = parseSort(req, ['name', 'createdAt', 'status'], 'createdAt');

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    const where: any = {
      landlordId: ctx.landlordId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (type) where.type = type;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          type: true,
          status: true,
          amenities: true,
          videoUrl: true,
          virtualTourUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { units: true },
          },
        },
        orderBy: { [field]: order },
        take: limit,
        skip: offset,
      }),
      prisma.property.count({ where }),
    ]);

    const formattedProperties = properties.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      address: p.address,
      type: p.type,
      status: p.status,
      amenities: p.amenities,
      videoUrl: p.videoUrl,
      virtualTourUrl: p.virtualTourUrl,
      unitCount: p._count.units,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return apiPaginated(formattedProperties, total, page, limit);
  },
  ['properties:read']
);

// POST /api/v1/properties
export const POST = withApiAuth(
  async (req: NextRequest, ctx: ApiContext) => {
    if (!hasScope(ctx.scopes, 'properties:write')) {
      return apiError('Missing required scope: properties:write', 403, 'insufficient_scope');
    }

    const body = await req.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return apiError('Property name is required', 400, 'validation_error');
    }

    if (!body.address || typeof body.address !== 'object') {
      return apiError('Property address is required', 400, 'validation_error');
    }

    if (!body.type || typeof body.type !== 'string') {
      return apiError('Property type is required', 400, 'validation_error');
    }

    // Generate slug from name
    const baseSlug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check for existing slug and make unique if needed
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.property.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const property = await prisma.property.create({
      data: {
        landlordId: ctx.landlordId,
        name: body.name,
        slug,
        description: body.description,
        address: body.address,
        type: body.type,
        status: body.status || 'active',
        amenities: body.amenities || [],
        videoUrl: body.videoUrl,
        virtualTourUrl: body.virtualTourUrl,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        type: true,
        status: true,
        amenities: true,
        createdAt: true,
      },
    });

    return apiSuccess(
      {
        id: property.id,
        name: property.name,
        slug: property.slug,
        description: property.description,
        address: property.address,
        type: property.type,
        status: property.status,
        amenities: property.amenities,
        createdAt: property.createdAt.toISOString(),
      },
      201
    );
  },
  ['properties:write']
);
