import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { syncContractorSubscriptionFromStripe } from '@/lib/actions/contractor-subscription-sync';
import { SUBSCRIPTION_TIERS } from '@/lib/config/subscription-tiers';

// Manually sync a contractor's subscription from Stripe. Mirrors the landlord
// sync route so the dashboard can self-heal when webhooks aren't delivering
// (e.g. STRIPE_WEBHOOK_SECRET not configured locally).
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Resolve the contractor profile. For contractor employees, look up the
    // contractor they're linked to so they can self-heal too.
    let contractor: { id: string; stripeCustomerId: string | null } | null = null;

    if (session.user.role === 'contractor_employee') {
      const employee = await prisma.contractorEmployee.findFirst({
        where: { userId: session.user.id, status: 'active' },
        select: { contractorId: true },
      });
      if (employee) {
        contractor = await prisma.contractorProfile.findUnique({
          where: { id: employee.contractorId },
          select: { id: true, stripeCustomerId: true },
        });
      }
    } else {
      contractor = await prisma.contractorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true, stripeCustomerId: true },
      });
    }

    if (!contractor) {
      return NextResponse.json(
        { success: false, message: 'Contractor profile not found' },
        { status: 404 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Stripe is not configured on the server (missing STRIPE_SECRET_KEY).',
        },
        { status: 500 }
      );
    }

    // Make sure a Stripe customer exists before sync. If they don't, create
    // one so a future checkout can attach to them. (Sync still won't find a
    // subscription unless they've actually paid.)
    if (!contractor.stripeCustomerId) {
      const stripe = new Stripe(stripeSecretKey);
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        metadata: {
          contractorProfileId: contractor.id,
          userId: session.user.id,
        },
      });
      await prisma.contractorProfile.update({
        where: { id: contractor.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    const result = await syncContractorSubscriptionFromStripe(contractor.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }

    const tier = result.tier === 'free' ? 'starter' : result.tier;
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    return NextResponse.json({
      success: true,
      message: `Subscription synced! You are now on the ${tierConfig.name} plan.`,
      tier: result.tier,
      tierConfig,
    });
  } catch (error) {
    console.error('Contractor subscription sync error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}
