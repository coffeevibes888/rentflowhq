'use server';

import { headers } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { checkRateLimit } from '@/lib/security/rate-limiter';

const ENTERPRISE_TIER = 'enterprise';

export type BetaAudience = 'pm' | 'contractor';

export interface RedeemResult {
  success: boolean;
  message: string;
  audience?: BetaAudience;
  freePeriodEnd?: string;
  discountPeriodEnd?: string;
  discountPercent?: number;
  redirectTo?: string;
}

interface RedeemContext {
  ip?: string;
  userAgent?: string;
}

/**
 * Compute the period boundaries given a free-month count and a post-free
 * discount window. Free starts now; discount starts the moment free ends.
 */
function computePeriods(freeMonths: number, postFreeMonths: number) {
  const now = new Date();
  const freePeriodEnd = new Date(now);
  freePeriodEnd.setMonth(freePeriodEnd.getMonth() + freeMonths);
  const discountPeriodEnd = new Date(freePeriodEnd);
  discountPeriodEnd.setMonth(discountPeriodEnd.getMonth() + postFreeMonths);
  return { now, freePeriodEnd, discountPeriodEnd };
}

/**
 * Redeem a beta code for the currently signed-in user.
 *
 * Rules enforced (in this order):
 *   1. Rate-limited per user to prevent code-guessing.
 *   2. Code must exist, be active, and not be expired.
 *   3. The redeemedCount is bumped atomically with `update where redeemedCount < maxRedemptions`.
 *      If 0 rows update, all 25 spots are taken — no race condition possible.
 *   4. Audience must match the user's profile (pm → Landlord, contractor → ContractorProfile).
 *   5. One redemption per user per audience (DB unique constraint enforces it too).
 *   6. Email must be verified before access activates.
 *   7. The user's profile is bumped to enterprise with currentPeriodEnd = freePeriodEnd
 *      and trialStatus = 'active' so SubscriptionGate lets them in immediately.
 *
 * Stripe coupon attachment is a TODO — we track the discount window in
 * the BetaTester row and apply it manually when the user adds a card.
 */
export async function redeemBetaCode(rawCode: string): Promise<RedeemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'You must be signed in to redeem a beta code.' };
  }

  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    return { success: false, message: 'Please enter a code.' };
  }

  // Rate limit: 5 attempts per 10 min per user. Keeps anyone from brute-forcing
  // the 25-spot cap by guessing variants.
  const limit = checkRateLimit(`beta-redeem:${session.user.id}`, {
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
  });
  if (!limit.allowed) {
    return {
      success: false,
      message: 'Too many attempts. Please wait a few minutes and try again.',
    };
  }

  if (!session.user.emailVerified) {
    return {
      success: false,
      message: 'Please verify your email address before redeeming a beta code.',
    };
  }

  const program = await prisma.betaProgram.findUnique({ where: { code } });
  if (!program || !program.isActive) {
    return { success: false, message: 'That code is not valid.' };
  }
  if (program.expiresAt && program.expiresAt < new Date()) {
    return { success: false, message: 'That code has expired.' };
  }
  if (program.redeemedCount >= program.maxRedemptions) {
    return {
      success: false,
      message: `All ${program.maxRedemptions} beta spots for this program are taken.`,
    };
  }

  // Capture audit metadata
  let ctx: RedeemContext = {};
  try {
    const h = await headers();
    ctx = {
      ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || undefined,
      userAgent: h.get('user-agent') || undefined,
    };
  } catch {
    // Server actions can be invoked outside a request — ignore.
  }

  const audience = program.audience as BetaAudience;
  const { now, freePeriodEnd, discountPeriodEnd } = computePeriods(
    program.freeMonths,
    program.postFreeDiscountMonths
  );

  // Find the right profile for the audience.
  let landlordId: string | null = null;
  let contractorProfileId: string | null = null;

  if (audience === 'pm') {
    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
      select: { id: true },
    });
    if (!landlord) {
      return {
        success: false,
        message:
          'This code is for property managers. Finish setting up your PM account first, then come back to redeem.',
      };
    }
    landlordId = landlord.id;
  } else {
    const profile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) {
      return {
        success: false,
        message:
          'This code is for contractors. Finish setting up your contractor profile first, then come back to redeem.',
      };
    }
    contractorProfileId = profile.id;
  }

  // Has this user already redeemed this audience?
  const existing = await prisma.betaTester.findFirst({
    where: { userId: session.user.id, audience },
    select: { id: true },
  });
  if (existing) {
    return { success: false, message: "You've already redeemed a beta code for this side." };
  }

  // Atomic claim of a redemption slot — the WHERE clause guarantees that
  // only `maxRedemptions` rows can win. Anything past that returns count=0.
  const claimed = await prisma.betaProgram.updateMany({
    where: {
      id: program.id,
      isActive: true,
      redeemedCount: { lt: program.maxRedemptions },
    },
    data: { redeemedCount: { increment: 1 } },
  });

  if (claimed.count === 0) {
    return {
      success: false,
      message: `All ${program.maxRedemptions} beta spots for this program were just taken.`,
    };
  }

  try {
    // Create the BetaTester record + flip the user's profile to enterprise.
    await prisma.$transaction(async (tx) => {
      await tx.betaTester.create({
        data: {
          programId: program.id,
          userId: session.user!.id,
          audience,
          landlordId,
          contractorProfileId,
          freePeriodStart: now,
          freePeriodEnd,
          discountPeriodEnd,
          redeemedFromIp: ctx.ip ?? null,
          redeemedUserAgent: ctx.userAgent ?? null,
        },
      });

      if (audience === 'pm' && landlordId) {
        await tx.landlord.update({
          where: { id: landlordId },
          data: {
            subscriptionTier: ENTERPRISE_TIER,
            subscriptionStatus: 'active',
            subscriptionEndsAt: freePeriodEnd,
            trialStatus: 'active',
            trialStartDate: now,
            trialEndDate: freePeriodEnd,
          },
        });
      } else if (audience === 'contractor' && contractorProfileId) {
        await tx.contractorProfile.update({
          where: { id: contractorProfileId },
          data: {
            subscriptionTier: ENTERPRISE_TIER,
            subscriptionStatus: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: freePeriodEnd,
            subscriptionEndsAt: freePeriodEnd,
            trialStatus: 'active',
            trialStartDate: now,
            trialEndDate: freePeriodEnd,
          },
        });
      }

      // Audit log entry — the security dashboard surfaces these.
      await tx.auditLog.create({
        data: {
          action: 'BETA_CODE_REDEEMED',
          userId: session.user!.id,
          landlordId: landlordId ?? undefined,
          resourceType: 'beta_program',
          resourceId: program.id,
          metadata: JSON.stringify({
            code: program.code,
            audience,
            freeMonths: program.freeMonths,
            postFreeDiscountPercent: program.postFreeDiscountPercent,
            postFreeDiscountMonths: program.postFreeDiscountMonths,
            freePeriodEnd: freePeriodEnd.toISOString(),
            discountPeriodEnd: discountPeriodEnd.toISOString(),
          }),
          ipAddress: ctx.ip ?? null,
          userAgent: ctx.userAgent ?? null,
          severity: 'INFO',
        },
      });
    });
  } catch (error) {
    // Refund the slot since we couldn't actually link the tester.
    await prisma.betaProgram
      .update({
        where: { id: program.id },
        data: { redeemedCount: { decrement: 1 } },
      })
      .catch(() => {});
    console.error('[redeemBetaCode]', error);
    return {
      success: false,
      message:
        'Something went wrong while redeeming. Your slot has been released — please try again.',
    };
  }

  return {
    success: true,
    message: `Welcome to the beta. You're on Enterprise free until ${freePeriodEnd.toLocaleDateString()}.`,
    audience,
    freePeriodEnd: freePeriodEnd.toISOString(),
    discountPeriodEnd: discountPeriodEnd.toISOString(),
    discountPercent: program.postFreeDiscountPercent,
    redirectTo: audience === 'pm' ? '/admin/beta-testers' : '/contractor-dashboard/beta-testers',
  };
}

export async function getMyBetaTesterStatus() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const testers = await prisma.betaTester.findMany({
    where: { userId: session.user.id },
    include: {
      program: {
        select: {
          code: true,
          audience: true,
          freeMonths: true,
          postFreeDiscountPercent: true,
          postFreeDiscountMonths: true,
        },
      },
    },
    orderBy: { redeemedAt: 'desc' },
  });

  return testers.map((t) => ({
    id: t.id,
    audience: t.audience as BetaAudience,
    code: t.program.code,
    freePeriodStart: t.freePeriodStart.toISOString(),
    freePeriodEnd: t.freePeriodEnd.toISOString(),
    discountPeriodEnd: t.discountPeriodEnd.toISOString(),
    discountPercent: t.program.postFreeDiscountPercent,
    discountMonths: t.program.postFreeDiscountMonths,
    redeemedAt: t.redeemedAt.toISOString(),
  }));
}

export async function getBetaProgramAvailability(audience: BetaAudience) {
  const program = await prisma.betaProgram.findFirst({
    where: { audience, isActive: true },
    select: {
      maxRedemptions: true,
      redeemedCount: true,
      freeMonths: true,
      postFreeDiscountPercent: true,
      postFreeDiscountMonths: true,
      expiresAt: true,
    },
  });
  if (!program) return null;
  return {
    maxRedemptions: program.maxRedemptions,
    redeemedCount: program.redeemedCount,
    spotsRemaining: Math.max(0, program.maxRedemptions - program.redeemedCount),
    freeMonths: program.freeMonths,
    postFreeDiscountPercent: program.postFreeDiscountPercent,
    postFreeDiscountMonths: program.postFreeDiscountMonths,
    expiresAt: program.expiresAt?.toISOString() ?? null,
  };
}

// =============================================================
// Beta feedback (tester side)
// =============================================================

export interface SubmitFeedbackInput {
  category: 'complaint' | 'like' | 'dislike' | 'feature' | 'bug' | 'testimonial';
  subject: string;
  body: string;
  npsScore?: number | null;
  consentToUseInMarketing?: boolean;
  attachments?: string[];
}

export interface FeedbackActionResult {
  success: boolean;
  message: string;
  feedbackId?: string;
}

const FEEDBACK_CATEGORIES = new Set([
  'complaint',
  'like',
  'dislike',
  'feature',
  'bug',
  'testimonial',
]);

export async function submitBetaFeedback(
  input: SubmitFeedbackInput
): Promise<FeedbackActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'You must be signed in.' };
  }

  if (!FEEDBACK_CATEGORIES.has(input.category)) {
    return { success: false, message: 'Invalid category.' };
  }
  const subject = (input.subject || '').trim();
  const body = (input.body || '').trim();
  if (subject.length < 3) {
    return { success: false, message: 'Subject is too short.' };
  }
  if (body.length < 10) {
    return { success: false, message: 'Please share a bit more detail (at least 10 characters).' };
  }
  if (subject.length > 200) {
    return { success: false, message: 'Subject is too long (200 character max).' };
  }
  if (body.length > 5000) {
    return { success: false, message: 'Body is too long (5000 character max).' };
  }
  if (
    typeof input.npsScore === 'number' &&
    (input.npsScore < 0 || input.npsScore > 10 || !Number.isFinite(input.npsScore))
  ) {
    return { success: false, message: 'NPS score must be 0–10.' };
  }
  if (Array.isArray(input.attachments) && input.attachments.length > 5) {
    return { success: false, message: 'Up to 5 attachments per submission.' };
  }

  // Spam guard — 20 feedback items per hour per user is generous but bounded.
  const limit = checkRateLimit(`beta-feedback:${session.user.id}`, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
  });
  if (!limit.allowed) {
    return {
      success: false,
      message: 'You have submitted a lot of feedback in the last hour — give it a few minutes.',
    };
  }

  // Find any tester record for this user (multiple audiences are possible
  // if someone runs both PM and contractor sides). Prefer most recent.
  const tester = await prisma.betaTester.findFirst({
    where: { userId: session.user.id },
    orderBy: { redeemedAt: 'desc' },
    select: { id: true, audience: true },
  });
  if (!tester) {
    return {
      success: false,
      message: 'You need to redeem a beta code before submitting feedback.',
    };
  }

  const feedback = await prisma.betaFeedback.create({
    data: {
      betaTesterId: tester.id,
      audience: tester.audience,
      category: input.category,
      subject,
      body,
      npsScore: typeof input.npsScore === 'number' ? input.npsScore : null,
      consentToUseInMarketing: Boolean(input.consentToUseInMarketing),
      attachments: input.attachments ?? [],
    },
    select: { id: true },
  });

  // Optional: update the tester's last NPS score so we can rank testimonials later.
  if (typeof input.npsScore === 'number') {
    await prisma.betaTester
      .update({
        where: { id: tester.id },
        data: { npsScore: input.npsScore },
      })
      .catch(() => {});
  }

  return {
    success: true,
    message: 'Thanks for the feedback. The team will review and reply if needed.',
    feedbackId: feedback.id,
  };
}

export async function getMyBetaFeedback() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const items = await prisma.betaFeedback.findMany({
    where: { tester: { userId: session.user.id } },
    orderBy: { createdAt: 'desc' },
    include: {
      messages: {
        // Tester only sees non-internal replies.
        where: { isInternal: false },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return items.map((f) => ({
    id: f.id,
    audience: f.audience,
    category: f.category,
    subject: f.subject,
    body: f.body,
    npsScore: f.npsScore,
    consentToUseInMarketing: f.consentToUseInMarketing,
    status: f.status,
    isFeaturedTestimonial: f.isFeaturedTestimonial,
    createdAt: f.createdAt.toISOString(),
    messages: f.messages.map((m) => ({
      id: m.id,
      senderRole: m.senderRole,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  }));
}

export async function postBetaFeedbackReplyAsTester(
  feedbackId: string,
  body: string
): Promise<FeedbackActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'You must be signed in.' };
  }
  const trimmed = (body || '').trim();
  if (trimmed.length < 1 || trimmed.length > 5000) {
    return { success: false, message: 'Reply must be 1–5000 characters.' };
  }

  const feedback = await prisma.betaFeedback.findFirst({
    where: { id: feedbackId, tester: { userId: session.user.id } },
    select: { id: true, status: true },
  });
  if (!feedback) {
    return { success: false, message: 'Feedback not found.' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.betaFeedbackMessage.create({
      data: {
        feedbackId: feedback.id,
        senderId: session.user!.id,
        senderRole: 'tester',
        body: trimmed,
        isInternal: false,
      },
    });
    // Re-open the conversation if the admin had marked it resolved.
    if (feedback.status === 'resolved' || feedback.status === 'replied') {
      await tx.betaFeedback.update({
        where: { id: feedback.id },
        data: { status: 'in_review', resolvedAt: null, resolvedBy: null },
      });
    }
  });

  return { success: true, message: 'Reply sent.' };
}
