/**
 * GET /api/mobile/pm/properties/:id
 *
 * Returns a single property with full detail used by the mobile property card:
 *   - identity (name, type, address, cover image)
 *   - units (with availability + rent)
 *   - tenants on those units (current + past)
 *   - financial summary (rent collected, scheduled, expenses MTD)
 *   - recent documents
 *   - upcoming maintenance
 *
 * Mirrors the layout of the website's tenants admin tabs but consolidated into
 * a single round-trip so the mobile detail page renders instantly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyMobileToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    if (payload.role !== 'admin' && payload.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: payload.userId },
      select: { id: true },
    });
    if (!landlord) return NextResponse.json({ error: 'No landlord' }, { status: 404 });

    const property = await prisma.property.findFirst({
      where: { id, landlordId: landlord.id },
      include: {
        units: {
          include: {
            leases: {
              include: {
                tenant: { select: { id: true, name: true, email: true, image: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // ── Aggregate tenants across all units (current & past) ────────────────
    const currentTenants: any[] = [];
    const pastTenants: any[] = [];
    for (const unit of property.units) {
      for (const lease of unit.leases) {
        if (!lease.tenant) continue;
        const entry = {
          tenantId: lease.tenant.id,
          tenantName: lease.tenant.name,
          tenantEmail: lease.tenant.email,
          tenantImage: lease.tenant.image,
          leaseId: lease.id,
          leaseStatus: lease.status,
          unitId: unit.id,
          unitName: unit.name,
          rentAmount: Number(lease.rentAmount ?? unit.rentAmount ?? 0),
          startDate: lease.startDate,
          endDate: lease.endDate,
          tenantSigned: !!lease.tenantSignedAt,
          landlordSigned: !!lease.landlordSignedAt,
        };
        if (lease.status === 'active' || lease.status === 'pending_signature') {
          currentTenants.push(entry);
        } else {
          pastTenants.push(entry);
        }
      }
    }

    // ── Financial snapshot ─────────────────────────────────────────────────
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [collectedThisMonth, scheduledThisMonth, expenses, openTickets, recentDocs] = await Promise.all([
      prisma.rentPayment.aggregate({
        where: {
          lease: { unit: { propertyId: property.id } },
          status: 'paid',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.rentPayment.aggregate({
        where: {
          lease: { unit: { propertyId: property.id } },
          dueDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { propertyId: property.id, incurredAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.maintenanceTicket.count({
        where: { unit: { propertyId: property.id }, status: { in: ['open', 'in_progress'] } },
      }),
      prisma.document.findMany({
        where: {
          landlordId: landlord.id,
          relatedToType: 'property',
          relatedToId: property.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          name: true,
          category: true,
          fileUrl: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      }),
    ]);

    const totalUnits = property.units.length;
    const occupiedUnits = property.units.filter(
      (u) => u.leases.some((l) => l.status === 'active'),
    ).length;
    const totalRent = property.units.reduce(
      (sum, u) => sum + Number(u.rentAmount ?? 0),
      0,
    );

    return NextResponse.json({
      property: {
        id: property.id,
        name: property.name,
        slug: property.slug,
        type: property.type,
        // address is a JSON object: { street, city, state, zip, lat?, lng? }
        address: (property.address as any) ?? {},
        coverImage: property.units[0]?.images?.[0] ?? null,
        createdAt: property.createdAt,
      },
      stats: {
        totalUnits,
        occupiedUnits,
        availableUnits: totalUnits - occupiedUnits,
        occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
        totalRentScheduled: totalRent,
        collectedThisMonth: Number(collectedThisMonth._sum.amount ?? 0),
        scheduledThisMonth: Number(scheduledThisMonth._sum.amount ?? 0),
        expensesThisMonth: Number(expenses._sum.amount ?? 0),
        openTickets,
      },
      units: property.units.map((u) => ({
        id: u.id,
        name: u.name,
        rentAmount: Number(u.rentAmount ?? 0),
        isAvailable: u.isAvailable,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms ? Number(u.bathrooms) : null,
        sizeSqFt: u.sizeSqFt,
        currentTenant: u.leases.find((l) => l.status === 'active')?.tenant ?? null,
      })),
      currentTenants,
      pastTenants,
      recentDocuments: recentDocs,
    });
  } catch (e: any) {
    console.error('property detail', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
