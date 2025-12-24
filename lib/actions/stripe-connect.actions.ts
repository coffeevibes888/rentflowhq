/**
 * Stripe Connect Actions
 * Handles landlord onboarding and payouts via Stripe Connect Express
 */

'use server';

import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { formatError } from '@/lib/utils';
import { getOrCreateCurrentLandlord } from './landlord.actions';
import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('Stripe secret key not configured');
  }
  return new Stripe(stripeSecretKey);
}

// ============= CREATE CONNECT ACCOUNT =============

/**
 * Create a Stripe Connect Express account for the landlord
 * Returns the account ID to use with embedded onboarding
 */
export async function createConnectAccount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success || !landlordResult.landlord) {
      return { success: false, message: landlordResult.message };
    }

    const landlord = landlordResult.landlord;

    // If already has a Connect account, return it
    if (landlord.stripeConnectAccountId) {
      return {
        success: true,
        accountId: landlord.stripeConnectAccountId,
        alreadyExists: true,
      };
    }

    const stripe = getStripe();

    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: session.user.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        landlordId: landlord.id,
        platform: 'property_management',
      },
    });

    // Save to database
    await prisma.landlord.update({
      where: { id: landlord.id },
      data: {
        stripeConnectAccountId: account.id,
        stripeOnboardingStatus: 'pending',
      },
    });

    return {
      success: true,
      accountId: account.id,
    };
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return { success: false, message: formatError(error) };
  }
}

// ============= CREATE ACCOUNT SESSION FOR EMBEDDED ONBOARDING =============

/**
 * Create an Account Session for embedded onboarding components
 * This allows the Connect Onboarding to appear directly in your app
 */
export async function createConnectAccountSession() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success || !landlordResult.landlord) {
      return { success: false, message: landlordResult.message };
    }

    const landlord = landlordResult.landlord;

    // Create account if doesn't exist
    let accountId = landlord.stripeConnectAccountId;
    if (!accountId) {
      const createResult = await createConnectAccount();
      if (!createResult.success || !createResult.accountId) {
        return { success: false, message: createResult.message || 'Failed to create account' };
      }
      accountId = createResult.accountId;
    }

    const stripe = getStripe();

    // Create account session for embedded components
    const accountSession = await stripe.accountSessions.create({
      account: accountId,
      components: {
        account_onboarding: { enabled: true },
        payments: { enabled: true },
        payouts: { enabled: true },
      },
    });

    return {
      success: true,
      clientSecret: accountSession.client_secret,
      accountId,
    };
  } catch (error) {
    console.error('Error creating account session:', error);
    return { success: false, message: formatError(error) };
  }
}

// ============= GET CONNECT ACCOUNT STATUS =============

/**
 * Get the current status of the landlord's Connect account
 */
export async function getConnectAccountStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated', status: null };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success || !landlordResult.landlord) {
      return { success: false, message: landlordResult.message, status: null };
    }

    const landlord = landlordResult.landlord;

    if (!landlord.stripeConnectAccountId) {
      return {
        success: true,
        status: {
          hasAccount: false,
          isOnboarded: false,
          canReceivePayouts: false,
          payoutsEnabled: false,
          chargesEnabled: false,
        },
      };
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(landlord.stripeConnectAccountId);

    const isOnboarded = account.details_submitted || false;
    const canReceivePayouts = account.payouts_enabled || false;

    // Update local status if changed
    const newStatus = isOnboarded ? (canReceivePayouts ? 'active' : 'pending_verification') : 'pending';
    if (landlord.stripeOnboardingStatus !== newStatus) {
      await prisma.landlord.update({
        where: { id: landlord.id },
        data: { stripeOnboardingStatus: newStatus },
      });
    }

    return {
      success: true,
      status: {
        hasAccount: true,
        isOnboarded,
        canReceivePayouts,
        payoutsEnabled: account.payouts_enabled || false,
        chargesEnabled: account.charges_enabled || false,
        requirements: account.requirements,
        bankAccountLast4: account.external_accounts?.data?.[0]?.last4 || null,
      },
    };
  } catch (error) {
    console.error('Error getting Connect status:', error);
    return { success: false, message: formatError(error), status: null };
  }
}

// ============= CREATE PAYOUT =============

export interface CreatePayoutOptions {
  amount?: number;
  propertyId?: string; // If provided, use property's bank account as destination
  instant?: boolean;
}

export interface CreatePayoutResult {
  success: boolean;
  message: string;
  amount?: number;
  transferId?: string;
  destinationPropertyId?: string;
  destinationPropertyName?: string;
  destinationLast4?: string;
}

/**
 * Transfer funds to landlord's Connect account and initiate payout
 * Optionally specify a propertyId to direct funds to that property's bank account
 */
export async function createPayout(options: CreatePayoutOptions = {}): Promise<CreatePayoutResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success || !landlordResult.landlord) {
      return { success: false, message: landlordResult.message || 'Unable to get landlord' };
    }

    const landlord = landlordResult.landlord;

    if (!landlord.stripeConnectAccountId) {
      return { success: false, message: 'Please complete payout setup first.' };
    }

    // Check account status
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(landlord.stripeConnectAccountId);

    if (!account.payouts_enabled) {
      return { success: false, message: 'Payouts not enabled. Please complete account verification.' };
    }

    // Get wallet balance
    const wallet = await prisma.landlordWallet.findUnique({
      where: { landlordId: landlord.id },
    });

    if (!wallet || Number(wallet.availableBalance) === 0) {
      return { success: false, message: 'No available balance to cash out.' };
    }

    const availableBalance = Number(wallet.availableBalance);
    const payoutAmount = options.amount || availableBalance;

    if (payoutAmount > availableBalance) {
      return { success: false, message: 'Amount exceeds available balance.' };
    }

    if (payoutAmount < 1) {
      return { success: false, message: 'Minimum payout is $1.00.' };
    }

    // Fetch property bank account if propertyId is provided
    let propertyBankAccount = null;
    let propertyName: string | null = null;

    if (options.propertyId) {
      const property = await prisma.property.findFirst({
        where: {
          id: options.propertyId,
          landlordId: landlord.id,
        },
        include: {
          bankAccount: true,
        },
      });

      if (!property) {
        return { success: false, message: 'Property not found or access denied.' };
      }

      propertyName = property.name;

      if (property.bankAccount) {
        propertyBankAccount = property.bankAccount;
      }
    }

    // Build metadata with destination info
    const payoutMetadata: Record<string, unknown> = {
      type: options.instant ? 'instant' : 'standard',
      requestedAt: new Date().toISOString(),
      destinationType: propertyBankAccount ? 'property_account' : 'default_account',
    };

    if (propertyBankAccount && options.propertyId) {
      payoutMetadata.destinationPropertyId = options.propertyId;
      payoutMetadata.destinationPropertyName = propertyName;
      payoutMetadata.destinationBankLast4 = propertyBankAccount.last4;
    }

    // Create payout record with destination metadata
    const payout = await prisma.payout.create({
      data: {
        landlordId: landlord.id,
        amount: payoutAmount,
        status: 'pending',
        metadata: payoutMetadata,
      },
    });

    try {
      // Build transfer options
      const transferOptions: Stripe.TransferCreateParams = {
        amount: Math.round(payoutAmount * 100),
        currency: 'usd',
        destination: landlord.stripeConnectAccountId,
        metadata: {
          landlordId: landlord.id,
          payoutId: payout.id,
          ...(options.propertyId && { propertyId: options.propertyId }),
        },
      };

      // Transfer funds to connected account
      const transfer = await stripe.transfers.create(transferOptions);

      // Update payout record with success
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          stripeTransferId: transfer.id,
          status: 'paid',
          paidAt: new Date(),
        },
      });

      // Deduct from wallet
      await prisma.landlordWallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: payoutAmount },
          lastPayoutAt: new Date(),
        },
      });

      // Build description with destination info
      const description = propertyBankAccount
        ? `Cash out to ${propertyName} (****${propertyBankAccount.last4})`
        : 'Cash out to bank';

      // Record transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'payout',
          amount: -payoutAmount,
          description,
          status: 'completed',
          referenceId: payout.id,
        },
      });

      revalidatePath('/admin/payouts');

      return {
        success: true,
        message: `$${payoutAmount.toFixed(2)} sent! Funds arrive in 2-3 business days.`,
        amount: payoutAmount,
        transferId: transfer.id,
        destinationPropertyId: options.propertyId,
        destinationPropertyName: propertyName || undefined,
        destinationLast4: propertyBankAccount?.last4,
      };
    } catch (stripeError) {
      // Mark payout as failed but preserve wallet balance
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'failed' },
      });

      const err = stripeError as { message?: string };
      console.error('Transfer error:', err);
      return { success: false, message: err.message || 'Failed to process payout.' };
    }
  } catch (error) {
    console.error('Error creating payout:', error);
    return { success: false, message: formatError(error) };
  }
}

// ============= CREATE ONBOARDING LINK (FALLBACK) =============

/**
 * Create a hosted onboarding link (fallback if embedded doesn't work)
 */
export async function createOnboardingLink() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success || !landlordResult.landlord) {
      return { success: false, message: landlordResult.message };
    }

    const landlord = landlordResult.landlord;

    let accountId = landlord.stripeConnectAccountId;
    if (!accountId) {
      const createResult = await createConnectAccount();
      if (!createResult.success || !createResult.accountId) {
        return { success: false, message: 'Failed to create account' };
      }
      accountId = createResult.accountId;
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/admin/payouts?refresh=true`,
      return_url: `${baseUrl}/admin/payouts?success=true`,
      type: 'account_onboarding',
    });

    return {
      success: true,
      url: accountLink.url,
    };
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    return { success: false, message: formatError(error) };
  }
}
