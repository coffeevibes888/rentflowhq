import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { headers } from 'next/headers';

interface SubscriptionGateProps {
  role: 'landlord' | 'contractor' | 'agent';
  redirectTo?: string;
}

/**
 * Server component that checks if user has an active subscription
 * Redirects to subscription page if not subscribed
 * 
 * Note: Tenants (user role) and homeowners do NOT require subscriptions
 * 
 * Usage: Add to layout.tsx before rendering dashboard content
 */
export async function SubscriptionGate({ role, redirectTo }: SubscriptionGateProps) {
  const session = await auth();

  // If not logged in, redirect to sign-in
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Check if user has the correct role
  // Allow contractor employees (role='contractor_employee') to access contractor routes
  const allowedRoles = role === 'contractor'
    ? [role, 'contractor_employee', 'admin', 'superAdmin']
    : [role, 'admin', 'superAdmin'];

  if (!allowedRoles.includes(session.user.role)) {
    redirect('/unauthorized');
  }

  // Check if coming from successful Stripe checkout - allow access while webhook processes
  const headersList = await headers();
  const referer = headersList.get('referer') || '';
  const isFromStripeCheckout = referer.includes('checkout.stripe.com');

  // Role-specific subscription checks
  if (role === 'landlord') {
    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
      select: {
        id: true,
        trialStatus: true,
        trialStartDate: true,
        trialEndDate: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
        subscription: {
          select: {
            status: true,
            stripeSubscriptionId: true,
          },
        },
      },
    });

    if (landlord) {
      const now = new Date();
      const trialEnded = landlord.trialEndDate && landlord.trialEndDate < now;

      // Check if they have active subscription
      const hasActiveSubscription = 
        landlord.stripeSubscriptionId ||
        landlord.subscription?.stripeSubscriptionId ||
        landlord.subscriptionStatus === 'active' ||
        landlord.subscription?.status === 'active';

      // A trial is considered valid when:
      //   1. trialStatus === 'trialing'
      //   2. trialEndDate is set and in the future
      //   3. trialStartDate is set (proves the user actively started a trial)
      // Email verification is no longer a hard gate here — it's nudged from
      // settings post-signup so we don't strand new users mid-funnel. The
      // real abuse protection is that trial creation requires going through
      // the role picker (signed-in, conscious selection) and access to
      // anything that sends mail / moves money is gated separately.
      const trialIsLegitimate =
        landlord.trialStatus === 'trialing' &&
        landlord.trialEndDate !== null &&
        landlord.trialStartDate !== null &&
        !trialEnded;

      // Allow access if:
      // 1. Active subscription OR
      // 2. Legitimate in-trial window OR
      // 3. Trial expired but in grace period (read-only) OR
      // 4. Coming from Stripe checkout
      const allowAccess = 
        hasActiveSubscription || 
        trialIsLegitimate || 
        landlord.trialStatus === 'trial_expired' ||
        isFromStripeCheckout;

      // If suspended, redirect to subscription page
      if (landlord.trialStatus === 'suspended' && !hasActiveSubscription && !isFromStripeCheckout) {
        redirect(redirectTo || '/onboarding/landlord/subscription?reason=suspended');
      }

      // If trial expired and no subscription, update status to trial_expired
      if (trialEnded && !hasActiveSubscription && landlord.trialStatus === 'trialing') {
        await prisma.landlord.update({
          where: { id: landlord.id },
          data: { trialStatus: 'trial_expired' },
        });
      }

      if (!allowAccess) {
        redirect(redirectTo || '/onboarding/landlord/subscription?reason=trial_ended');
      }
    } else {
      // No landlord profile, redirect to onboarding
      redirect('/onboarding');
    }
  }

  if (role === 'contractor') {
    // For contractor employees, look up their linked contractor's subscription
    let contractorQuery: any;
    if (session.user.role === 'contractor_employee') {
      const employee = await prisma.contractorEmployee.findFirst({
        where: { userId: session.user.id, status: 'active' },
        select: { contractorId: true },
      });
      if (!employee) redirect('/unauthorized');
      contractorQuery = { id: employee!.contractorId };
    } else {
      contractorQuery = { userId: session.user.id };
    }

    const contractor = await prisma.contractorProfile.findFirst({
      where: contractorQuery,
      select: {
        id: true,
        trialStatus: true,
        trialEndDate: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        subscriptionTier: true,
      },
    });

    if (contractor) {
      const now = new Date();
      const trialEnded = contractor.trialEndDate && contractor.trialEndDate < now;

      const hasActiveSubscription = 
        contractor.stripeSubscriptionId ||
        contractor.subscriptionStatus === 'active' ||
        contractor.subscriptionTier === 'starter'; // Starter tier is always allowed (free tier)

      // trialEndDate being null means they never started a trial (no plan selected yet)
      const isInTrial = 
        contractor.trialStatus === 'trialing' && 
        contractor.trialEndDate !== null &&
        !trialEnded;

      const allowAccess = 
        hasActiveSubscription || 
        isInTrial || 
        contractor.trialStatus === 'trial_expired' ||
        isFromStripeCheckout;

      if (contractor.trialStatus === 'suspended' && !hasActiveSubscription && !isFromStripeCheckout) {
        redirect(redirectTo || '/onboarding/contractor/subscription?reason=suspended');
      }

      if (trialEnded && !hasActiveSubscription && contractor.trialStatus === 'trialing') {
        await prisma.contractorProfile.update({
          where: { id: contractor.id },
          data: { trialStatus: 'trial_expired' },
        });
      }

      if (!allowAccess) {
        redirect(redirectTo || '/onboarding/contractor/subscription?reason=trial_ended');
      }
    } else {
      redirect('/onboarding');
    }
  }

  if (role === 'agent') {
    const agent = await prisma.agent.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        trialStatus: true,
        trialEndDate: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (agent) {
      const now = new Date();
      const trialEnded = agent.trialEndDate && agent.trialEndDate < now;

      const hasActiveSubscription = 
        agent.stripeSubscriptionId ||
        agent.subscriptionStatus === 'active';

      const isInTrial = 
        agent.trialStatus === 'trialing' && 
        !trialEnded;

      const allowAccess = 
        hasActiveSubscription || 
        isInTrial || 
        agent.trialStatus === 'trial_expired' ||
        isFromStripeCheckout;

      if (agent.trialStatus === 'suspended' && !hasActiveSubscription && !isFromStripeCheckout) {
        redirect(redirectTo || '/onboarding/agent/subscription?reason=suspended');
      }

      if (trialEnded && !hasActiveSubscription && agent.trialStatus === 'trialing') {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { trialStatus: 'trial_expired' },
        });
      }

      if (!allowAccess) {
        redirect(redirectTo || '/onboarding/agent/subscription?reason=trial_ended');
      }
    } else {
      redirect('/onboarding');
    }
  }

  // If all checks pass, return null (allow access)
  return null;
}
