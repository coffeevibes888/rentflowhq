'use server';

import { prisma } from '@/db/prisma';
import { requireSuperAdmin } from '@/lib/auth-guard';

export type BetaFeedbackStatus = 'new' | 'in_review' | 'replied' | 'resolved' | 'archived';
export type BetaFeedbackPriority = 'low' | 'normal' | 'high' | 'urgent';

const STATUS_VALUES = new Set<BetaFeedbackStatus>([
  'new',
  'in_review',
  'replied',
  'resolved',
  'archived',
]);

const PRIORITY_VALUES = new Set<BetaFeedbackPriority>(['low', 'normal', 'high', 'urgent']);

export interface BetaProgramStats {
  code: string;
  audience: 'pm' | 'contractor';
  redeemedCount: number;
  maxRedemptions: number;
  spotsRemaining: number;
  freeMonths: number;
  postFreeDiscountPercent: number;
  postFreeDiscountMonths: number;
  expiresAt: string | null;
  isActive: boolean;
}

export interface BetaInsights {
  programs: BetaProgramStats[];
  totals: {
    feedbackByStatus: Record<BetaFeedbackStatus, number>;
    feedbackByCategory: Record<string, number>;
    avgNps: number | null;
    npsResponses: number;
    featuredTestimonials: number;
    activeTesters: number;
  };
}

export async function getBetaInsights(): Promise<BetaInsights> {
  await requireSuperAdmin();

  const programs = await prisma.betaProgram.findMany({ orderBy: { audience: 'asc' } });
  const feedback = await prisma.betaFeedback.findMany({
    select: {
      status: true,
      category: true,
      npsScore: true,
      isFeaturedTestimonial: true,
    },
  });

  const feedbackByStatus = {
    new: 0,
    in_review: 0,
    replied: 0,
    resolved: 0,
    archived: 0,
  } as Record<BetaFeedbackStatus, number>;
  const feedbackByCategory: Record<string, number> = {};
  let npsSum = 0;
  let npsResponses = 0;
  let featuredTestimonials = 0;

  for (const f of feedback) {
    if (STATUS_VALUES.has(f.status as BetaFeedbackStatus)) {
      feedbackByStatus[f.status as BetaFeedbackStatus] += 1;
    }
    feedbackByCategory[f.category] = (feedbackByCategory[f.category] ?? 0) + 1;
    if (typeof f.npsScore === 'number') {
      npsSum += f.npsScore;
      npsResponses += 1;
    }
    if (f.isFeaturedTestimonial) featuredTestimonials += 1;
  }

  const activeTesters = await prisma.betaTester.count();

  return {
    programs: programs.map((p) => ({
      code: p.code,
      audience: p.audience as 'pm' | 'contractor',
      redeemedCount: p.redeemedCount,
      maxRedemptions: p.maxRedemptions,
      spotsRemaining: Math.max(0, p.maxRedemptions - p.redeemedCount),
      freeMonths: p.freeMonths,
      postFreeDiscountPercent: p.postFreeDiscountPercent,
      postFreeDiscountMonths: p.postFreeDiscountMonths,
      expiresAt: p.expiresAt?.toISOString() ?? null,
      isActive: p.isActive,
    })),
    totals: {
      feedbackByStatus,
      feedbackByCategory,
      avgNps: npsResponses > 0 ? Math.round((npsSum / npsResponses) * 10) / 10 : null,
      npsResponses,
      featuredTestimonials,
      activeTesters,
    },
  };
}

export interface ListFeedbackFilters {
  audience?: 'pm' | 'contractor' | 'all';
  status?: BetaFeedbackStatus | 'all';
  category?: string | 'all';
  featured?: boolean;
  query?: string;
}

export async function listBetaFeedback(filters: ListFeedbackFilters = {}) {
  await requireSuperAdmin();

  const where: Record<string, unknown> = {};
  if (filters.audience && filters.audience !== 'all') where.audience = filters.audience;
  if (filters.status && filters.status !== 'all') where.status = filters.status;
  if (filters.category && filters.category !== 'all') where.category = filters.category;
  if (filters.featured) where.isFeaturedTestimonial = true;
  if (filters.query) {
    const q = filters.query.trim();
    if (q.length > 0) {
      (where as any).OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
      ];
    }
  }

  const items = await prisma.betaFeedback.findMany({
    where: where as any,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
    include: {
      tester: {
        select: {
          id: true,
          userId: true,
          audience: true,
          freePeriodEnd: true,
          program: { select: { code: true } },
        },
      },
      messages: { select: { id: true } },
    },
  });

  // Pull user names/emails in a batch — avoids N+1 for the list.
  const userIds = Array.from(new Set(items.map((i) => i.tester.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return items.map((f) => {
    const u = userById.get(f.tester.userId);
    return {
      id: f.id,
      audience: f.audience as 'pm' | 'contractor',
      category: f.category,
      subject: f.subject,
      bodyPreview: f.body.length > 240 ? `${f.body.slice(0, 240)}…` : f.body,
      npsScore: f.npsScore,
      consentToUseInMarketing: f.consentToUseInMarketing,
      status: f.status as BetaFeedbackStatus,
      priority: f.priority as BetaFeedbackPriority,
      isFeaturedTestimonial: f.isFeaturedTestimonial,
      messageCount: f.messages.length,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      tester: {
        id: f.tester.id,
        userId: f.tester.userId,
        userName: u?.name ?? null,
        userEmail: u?.email ?? null,
        programCode: f.tester.program.code,
        freePeriodEnd: f.tester.freePeriodEnd.toISOString(),
      },
    };
  });
}

export async function getBetaFeedbackThread(feedbackId: string) {
  const session = await requireSuperAdmin();

  const feedback = await prisma.betaFeedback.findUnique({
    where: { id: feedbackId },
    include: {
      tester: {
        select: {
          id: true,
          userId: true,
          audience: true,
          freePeriodEnd: true,
          discountPeriodEnd: true,
          npsScore: true,
          program: {
            select: {
              code: true,
              postFreeDiscountPercent: true,
              postFreeDiscountMonths: true,
            },
          },
        },
      },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!feedback) return null;

  const user = await prisma.user.findUnique({
    where: { id: feedback.tester.userId },
    select: { id: true, name: true, email: true, role: true },
  });

  return {
    id: feedback.id,
    audience: feedback.audience as 'pm' | 'contractor',
    category: feedback.category,
    subject: feedback.subject,
    body: feedback.body,
    npsScore: feedback.npsScore,
    consentToUseInMarketing: feedback.consentToUseInMarketing,
    attachments: feedback.attachments,
    status: feedback.status as BetaFeedbackStatus,
    priority: feedback.priority as BetaFeedbackPriority,
    isFeaturedTestimonial: feedback.isFeaturedTestimonial,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString(),
    resolvedAt: feedback.resolvedAt?.toISOString() ?? null,
    resolvedBy: feedback.resolvedBy,
    tester: {
      id: feedback.tester.id,
      userId: feedback.tester.userId,
      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
      programCode: feedback.tester.program.code,
      freePeriodEnd: feedback.tester.freePeriodEnd.toISOString(),
      discountPeriodEnd: feedback.tester.discountPeriodEnd.toISOString(),
      discountPercent: feedback.tester.program.postFreeDiscountPercent,
      discountMonths: feedback.tester.program.postFreeDiscountMonths,
      lastNps: feedback.tester.npsScore,
    },
    messages: feedback.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderRole: m.senderRole,
      body: m.body,
      isInternal: m.isInternal,
      createdAt: m.createdAt.toISOString(),
    })),
    actor: { id: session.user!.id, name: session.user!.name, email: session.user!.email },
  };
}

export async function postBetaFeedbackReply(
  feedbackId: string,
  body: string,
  options: { isInternal?: boolean } = {}
) {
  const session = await requireSuperAdmin();
  const trimmed = (body || '').trim();
  if (trimmed.length < 1 || trimmed.length > 5000) {
    return { success: false, message: 'Reply must be 1–5000 characters.' };
  }

  const feedback = await prisma.betaFeedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, status: true },
  });
  if (!feedback) return { success: false, message: 'Feedback not found.' };

  await prisma.$transaction(async (tx) => {
    await tx.betaFeedbackMessage.create({
      data: {
        feedbackId: feedback.id,
        senderId: session.user!.id,
        senderRole: 'superAdmin',
        body: trimmed,
        isInternal: Boolean(options.isInternal),
      },
    });
    if (!options.isInternal) {
      await tx.betaFeedback.update({
        where: { id: feedback.id },
        data: { status: 'replied' },
      });
    } else if (feedback.status === 'new') {
      await tx.betaFeedback.update({
        where: { id: feedback.id },
        data: { status: 'in_review' },
      });
    }
  });

  return { success: true };
}

export async function updateBetaFeedbackStatus(
  feedbackId: string,
  patch: {
    status?: BetaFeedbackStatus;
    priority?: BetaFeedbackPriority;
    isFeaturedTestimonial?: boolean;
  }
) {
  const session = await requireSuperAdmin();

  if (patch.status && !STATUS_VALUES.has(patch.status)) {
    return { success: false, message: 'Invalid status.' };
  }
  if (patch.priority && !PRIORITY_VALUES.has(patch.priority)) {
    return { success: false, message: 'Invalid priority.' };
  }

  const data: Record<string, unknown> = {};
  if (patch.status) {
    data.status = patch.status;
    if (patch.status === 'resolved') {
      data.resolvedAt = new Date();
      data.resolvedBy = session.user!.id;
    } else if (patch.status !== 'archived') {
      data.resolvedAt = null;
      data.resolvedBy = null;
    }
  }
  if (typeof patch.priority === 'string') data.priority = patch.priority;
  if (typeof patch.isFeaturedTestimonial === 'boolean') {
    data.isFeaturedTestimonial = patch.isFeaturedTestimonial;
  }
  if (Object.keys(data).length === 0) {
    return { success: false, message: 'Nothing to update.' };
  }

  await prisma.betaFeedback.update({ where: { id: feedbackId }, data: data as any });
  return { success: true };
}
