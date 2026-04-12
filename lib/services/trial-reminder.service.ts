/**
 * Trial Reminder Service
 *
 * Event-driven — called on login/session load for PM and Contractor users.
 * No cron job required. Sends email + in-app push notification when a user
 * is within 7 days of their trial end date.
 *
 * SMS: wire sendSMSReminder() once you have a provider (Twilio, etc.)
 */

import { prisma } from '@/db/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'RentFlowHQ';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rentflowhq.com';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

const REMINDER_DAYS = [5, 3, 1]; // Send reminders at 5 days, 3 days, and 24 hours (1 day) before trial ends
const COOLDOWN_HOURS = 20; // Don't re-send within 20 hours

// ─────────────────────────────────────────────
// Main entry points
// ─────────────────────────────────────────────

export async function checkLandlordTrialReminder(userId: string) {
  // ownerUserId is not a unique key — use findFirst
  const landlord = await prisma.landlord.findFirst({
    where: { ownerUserId: userId },
    select: {
      id: true,
      trialEndDate: true,
      trialStatus: true,
      subscriptionStatus: true,
      owner: { select: { email: true, name: true } },
    },
  });

  if (!landlord?.trialEndDate) return;
  if (landlord.subscriptionStatus === 'active') return;
  if (landlord.trialStatus === 'trial_expired') return;

  await maybeFireReminder({
    userId,
    email: landlord.owner?.email ?? '',
    name: landlord.owner?.name ?? 'Property Manager',
    trialEndDate: landlord.trialEndDate,
    lastReminderSentAt: (landlord as any).lastReminderSentAt ?? null,
    upgradeUrl: `${APP_URL}/onboarding/landlord/subscription`,
    role: 'Property Manager',
    updateLastSent: () =>
      prisma.landlord.update({
        where: { id: landlord.id },
        data: { lastReminderSentAt: new Date() } as any,
      }),
  });
}

export async function checkContractorTrialReminder(userId: string) {
  const contractor = await prisma.contractorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      trialEndDate: true,
      trialStatus: true,
      subscriptionStatus: true,
      user: { select: { email: true, name: true } },
    },
  });

  if (!contractor?.trialEndDate) return;
  if (contractor.subscriptionStatus === 'active') return;
  if (contractor.trialStatus === 'trial_expired') return;

  await maybeFireReminder({
    userId,
    email: contractor.user?.email ?? '',
    name: contractor.user?.name ?? 'Contractor',
    trialEndDate: contractor.trialEndDate,
    lastReminderSentAt: (contractor as any).lastReminderSentAt ?? null,
    upgradeUrl: `${APP_URL}/onboarding/contractor/subscription`,
    role: 'Contractor',
    updateLastSent: () =>
      prisma.contractorProfile.update({
        where: { id: contractor.id },
        data: { lastReminderSentAt: new Date() } as any,
      }),
  });
}

// ─────────────────────────────────────────────
// Core logic
// ─────────────────────────────────────────────

async function maybeFireReminder({
  userId,
  email,
  name,
  trialEndDate,
  lastReminderSentAt,
  upgradeUrl,
  role,
  updateLastSent,
}: {
  userId: string;
  email: string;
  name: string;
  trialEndDate: Date;
  lastReminderSentAt: Date | null;
  upgradeUrl: string;
  role: string;
  updateLastSent: () => Promise<unknown>;
}) {
  if (!email) return;

  const now = new Date();
  const msLeft = trialEndDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  // Only fire on the defined reminder day thresholds
  if (!REMINDER_DAYS.includes(daysLeft) && daysLeft > 0) return;

  // Enforce cooldown — don't spam if already sent recently
  if (lastReminderSentAt) {
    const hoursSinceLast = (now.getTime() - lastReminderSentAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLast < COOLDOWN_HOURS) return;
  }

  const subject =
    daysLeft <= 0
      ? `Your ${APP_NAME} trial has ended`
      : daysLeft === 1
      ? `Last day of your ${APP_NAME} trial`
      : `${daysLeft} days left in your ${APP_NAME} trial`;

  const bodyText =
    daysLeft <= 0
      ? `Your free trial has expired. Upgrade now to keep your account active.`
      : `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining in your free trial. Upgrade before it ends to avoid interruption.`;

  await Promise.allSettled([
    // 1. Email via Resend
    sendTrialEmail({ email, name, subject, bodyText, upgradeUrl, daysLeft }),

    // 2. In-app push notification
    prisma.notification.create({
      data: {
        userId,
        type: 'reminder',
        title: subject,
        message: bodyText,
        actionUrl: upgradeUrl,
      },
    }),

    // 3. SMS — wire this when you have a provider
    // sendSMSReminder({ phone, subject, bodyText, upgradeUrl }),
  ]);

  // Mark sent so we respect cooldown
  await updateLastSent().catch(() => {});
}

// ─────────────────────────────────────────────
// Email sender
// ─────────────────────────────────────────────

async function sendTrialEmail({
  email,
  name,
  subject,
  bodyText,
  upgradeUrl,
  daysLeft,
}: {
  email: string;
  name: string;
  subject: string;
  bodyText: string;
  upgradeUrl: string;
  daysLeft: number;
}) {
  const urgencyColor = daysLeft <= 1 ? '#dc2626' : daysLeft <= 3 ? '#d97706' : '#2563eb';

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f8fafc;margin:0;padding:32px 0;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(to right,#f43f5e,#fb923c);padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">${APP_NAME}</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#0f172a;font-size:16px;margin:0 0 8px;">Hi ${name},</p>
      <p style="color:#334155;font-size:15px;margin:0 0 24px;">${bodyText}</p>
      <a href="${upgradeUrl}" style="display:inline-block;background:${urgencyColor};color:#fff;padding:12px 28px;border-radius:8px;font-weight:600;text-decoration:none;font-size:15px;">
        Upgrade Now
      </a>
      <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;">
        If you have questions, reply to this email or visit <a href="${APP_URL}" style="color:#38bdf8;">${APP_URL}</a>.
      </p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: [email],
    subject,
    html,
  });
}
