/**
 * GET /api/mobile/marketplace/jobs
 *
 * Public open jobs / work orders that contractors can bid on.
 *
 * Query params:
 *   priority   filter by 'urgent' | 'high' | 'medium' | 'low'
 *   page       1-indexed
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const priority = searchParams.get('priority')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    const where: any = {
      isOpenBid: true,
      status: 'open',
    };
    if (priority) where.priority = priority;

    const [jobs, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          budgetMin: true,
          budgetMax: true,
          bidDeadline: true,
          scheduledDate: true,
          createdAt: true,
          unit: {
            select: {
              name: true,
              property: {
                select: {
                  name: true,
                  city: true,
                  state: true,
                  landlord: { select: { id: true, companyName: true, logoUrl: true } },
                },
              },
            },
          },
        },
      }),
      prisma.workOrder.count({ where }),
    ]);

    return NextResponse.json({
      jobs: jobs.map((j: any) => ({
        id: j.id,
        title: j.title,
        description: j.description ?? '',
        priority: j.priority,
        budgetMin: j.budgetMin ? Number(j.budgetMin) : null,
        budgetMax: j.budgetMax ? Number(j.budgetMax) : null,
        bidDeadline: j.bidDeadline?.toISOString() ?? null,
        scheduledDate: j.scheduledDate?.toISOString() ?? null,
        createdAt: j.createdAt.toISOString(),
        propertyName: j.unit?.property?.name ?? 'Property',
        unitName: j.unit?.name ?? null,
        city: j.unit?.property?.city ?? null,
        state: j.unit?.property?.state ?? null,
        landlordName: j.unit?.property?.landlord?.companyName ?? 'Landlord',
        landlordLogo: j.unit?.property?.landlord?.logoUrl ?? null,
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    console.error('[mobile/marketplace/jobs]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
