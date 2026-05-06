/**
 * GET /api/cron/work-order-auto-release
 *
 * Scheduled task — should run daily (e.g., Vercel Cron or external scheduler).
 *
 * Finds all work orders that are `awaiting_approval` past their
 * `pmApprovalDeadline` and have no open dispute, then auto-releases funds
 * to the contractor. Mirrors how Upwork/Fiverr auto-release after the
 * approval window expires.
 *
 * Protected by CRON_SECRET via the Authorization header.
 *
 * Set up in vercel.json:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/work-order-auto-release",
 *       "schedule": "0 * * * *"
 *     }]
 *   }
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { releaseFundsForWorkOrder } from '@/app/api/work-orders/[id]/lifecycle/route';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Candidates: awaiting_approval, deadline passed, no open dispute
  const candidates = await prisma.workOrder.findMany({
    where: {
      lifecycleStatus: 'awaiting_approval',
      pmApprovalDeadline: { lte: now },
      disputes: {
        none: { status: { in: ['open', 'in_review'] } },
      },
    },
    select: { id: true },
    take: 200, // safety cap per run
  });

  const results: Array<{
    workOrderId: string;
    ok: boolean;
    error?: string;
    transferred?: boolean;
  }> = [];

  for (const wo of candidates) {
    try {
      const r = await releaseFundsForWorkOrder({
        workOrderId: wo.id,
        actorUserId: null,
        actorRole: 'system',
        note: 'Auto-released after PM approval window expired',
      });
      results.push({ workOrderId: wo.id, ok: true, transferred: r.transferred });
    } catch (e) {
      results.push({
        workOrderId: wo.id,
        ok: false,
        error: e instanceof Error ? e.message : 'Unknown',
      });
    }
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    results,
  });
}
