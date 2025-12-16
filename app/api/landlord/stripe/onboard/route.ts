import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { success: false, message: 'Payout verification is not configured on the server.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const landlordResult = await getOrCreateCurrentLandlord();

    if (!landlordResult.success) {
      return NextResponse.json(
        { success: false, message: landlordResult.message || 'Unable to determine landlord.' },
        { status: 400 }
      );
    }

    const landlord = landlordResult.landlord;

    let connectAccountId = landlord.stripeConnectAccountId || undefined;

    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: session.user.email || undefined,
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          product_description: 'Property management software with rent collection and payouts',
        },
        metadata: {
          landlordId: landlord.id,
        },
      });

      connectAccountId = account.id;

      await prisma.landlord.update({
        where: { id: landlord.id },
        data: {
          stripeConnectAccountId: connectAccountId,
          stripeOnboardingStatus: 'pending',
        },
      });
    }

    const accountSession = await stripe.accountSessions.create({
      account: connectAccountId,
      components: {
        account_onboarding: { enabled: true },
      },
    });

    await prisma.landlord.update({
      where: { id: landlord.id },
      data: {
        stripeOnboardingStatus: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      accountId: connectAccountId,
      onboardingStatus: landlord.stripeOnboardingStatus || 'pending',
      clientSecret: accountSession.client_secret,
    });
  } catch (error) {
    console.error('Error creating Stripe Connect onboarding link:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to start secure payout verification.' },
      { status: 500 }
    );
  }
}
