import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { TrialStatusBanner } from './trial-status-banner';

export async function TrialStatusWrapper() {
  const session = await auth();

  if (!session?.user?.id) return null;

  const role = session.user.role;

  // Only show for roles that have trials
  if (role !== 'landlord' && role !== 'contractor' && role !== 'agent') {
    return null;
  }

  // Get trial status based on role
  let trialData = null;

  if (role === 'landlord') {
    trialData = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
      select: {
        trialStatus: true,
        trialEndDate: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });
  } else if (role === 'contractor') {
    trialData = await prisma.contractorProfile.findFirst({
      where: { userId: session.user.id },
      select: {
        trialStatus: true,
        trialEndDate: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });
  } else if (role === 'agent') {
    trialData = await prisma.agent.findFirst({
      where: { userId: session.user.id },
      select: {
        trialStatus: true,
        trialEndDate: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });
  }

  // Don't show if no trial data or has active subscription
  if (!trialData || trialData.stripeSubscriptionId || trialData.subscriptionStatus === 'active') {
    return null;
  }

  // Calculate days left
  const now = new Date();
  const trialEndDate = trialData.trialEndDate ? new Date(trialData.trialEndDate) : null;
  const daysLeft = trialEndDate 
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : undefined;

  // Trigger email reminder check (non-blocking)
  if (trialEndDate && (daysLeft === 7 || daysLeft === 3 || daysLeft === 1 || daysLeft === 0 || daysLeft === -1)) {
    // Fire and forget - don't await
    fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/trial/send-reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, role }),
    }).catch(console.error);
  }

  return (
    <TrialStatusBanner
      trialStatus={trialData.trialStatus as any}
      daysLeft={daysLeft}
      trialEndDate={trialEndDate || undefined}
      role={role as any}
    />
  );
}
