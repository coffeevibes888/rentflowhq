import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';

export async function GET(req: NextRequest) {
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

    const componentParam = req.nextUrl.searchParams.get('component');
    const component: 'account_onboarding' | 'payouts' =
      componentParam === 'payouts' ? 'payouts' : 'account_onboarding';

    let connectAccountId = landlord.stripeConnectAccountId || undefined;

    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: session.user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
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
      components:
        component === 'payouts'
          ? {
              payouts: {
                enabled: true,
                features: {
                  external_account_collection: true,
                  edit_payout_schedule: true,
                  instant_payouts: true,
                  standard_payouts: true,
                },
              },
            }
          : {
              account_onboarding: {
                enabled: true,
                features: {
                  external_account_collection: true,
                },
              },
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
      component,
      clientSecret: accountSession.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating payout onboarding link:', error);
    
    // Provide more specific error messages
    let message = 'Failed to start verification. Please try again.';
    
    if (error?.type === 'StripeInvalidRequestError') {
      message = error?.message || message;
      
      // If the account is invalid, it might be a test account with live keys
      if (error?.code === 'account_invalid') {
        message = 'Your payout account needs to be reconnected. Please try again.';
      }
    }
    
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
