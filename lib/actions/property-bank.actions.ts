/**
 * Property Bank Account Actions
 * Server actions for landlords to manage property-specific bank accounts
 */

'use server';

import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { z } from 'zod';
import { formatError } from '@/lib/utils';
import { getOrCreateCurrentLandlord } from './landlord.actions';
import { propertyBankAccountSchema } from '@/lib/validators';
import { revalidatePath } from 'next/cache';

// ============= ADD PROPERTY BANK ACCOUNT =============

/**
 * Add a bank account for a specific property
 * This allows landlords to cash out to different accounts per property
 */
export async function addPropertyBankAccount(
  data: z.infer<typeof propertyBankAccountSchema>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const validatedData = propertyBankAccountSchema.parse(data);

    // Verify the property belongs to this landlord
    const property = await prisma.property.findFirst({
      where: {
        id: validatedData.propertyId,
        landlordId: landlordResult.landlord.id,
      },
    });

    if (!property) {
      return { success: false, message: 'Property not found or access denied' };
    }

    // Check if property already has a bank account
    const existingAccount = await prisma.propertyBankAccount.findUnique({
      where: { propertyId: validatedData.propertyId },
    });

    if (existingAccount) {
      // Update existing account
      await prisma.propertyBankAccount.update({
        where: { propertyId: validatedData.propertyId },
        data: {
          stripePaymentMethodId: validatedData.stripePaymentMethodId,
          accountHolderName: validatedData.accountHolderName,
          last4: validatedData.last4,
          bankName: validatedData.bankName,
          accountType: validatedData.accountType,
          routingNumber: validatedData.routingNumber,
          isVerified: false, // Reset verification on update
        },
      });

      revalidatePath('/admin/products');
      revalidatePath('/admin/payouts');

      return {
        success: true,
        message: 'Property bank account updated',
      };
    }

    // Create new bank account for property
    await prisma.propertyBankAccount.create({
      data: {
        propertyId: validatedData.propertyId,
        stripePaymentMethodId: validatedData.stripePaymentMethodId,
        accountHolderName: validatedData.accountHolderName,
        last4: validatedData.last4,
        bankName: validatedData.bankName,
        accountType: validatedData.accountType,
        routingNumber: validatedData.routingNumber,
        isVerified: false,
      },
    });

    revalidatePath('/admin/products');
    revalidatePath('/admin/payouts');

    return {
      success: true,
      message: 'Property bank account added. Complete verification to enable payouts.',
    };
  } catch (error) {
    console.error('Error adding property bank account:', error);
    return { success: false, message: formatError(error) };
  }
}

// ============= GET PROPERTY BANK ACCOUNT =============

/**
 * Get the bank account for a specific property
 */
export async function getPropertyBankAccount(propertyId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated', account: null };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message, account: null };
    }

    // Verify the property belongs to this landlord
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        landlordId: landlordResult.landlord.id,
      },
    });

    if (!property) {
      return { success: false, message: 'Property not found or access denied', account: null };
    }

    const account = await prisma.propertyBankAccount.findUnique({
      where: { propertyId },
    });

    if (!account) {
      return { success: true, account: null };
    }

    return {
      success: true,
      account: {
        id: account.id,
        propertyId: account.propertyId,
        accountHolderName: account.accountHolderName,
        last4: account.last4,
        bankName: account.bankName,
        accountType: account.accountType,
        isVerified: account.isVerified,
        createdAt: account.createdAt.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, message: formatError(error), account: null };
  }
}

// ============= DELETE PROPERTY BANK ACCOUNT =============

/**
 * Remove the bank account from a property
 */
export async function deletePropertyBankAccount(propertyId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    // Verify the property belongs to this landlord
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        landlordId: landlordResult.landlord.id,
      },
    });

    if (!property) {
      return { success: false, message: 'Property not found or access denied' };
    }

    await prisma.propertyBankAccount.delete({
      where: { propertyId },
    });

    revalidatePath('/admin/products');
    revalidatePath('/admin/payouts');

    return { success: true, message: 'Property bank account removed' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// ============= GET ALL PROPERTIES WITH BANK ACCOUNTS =============

/**
 * Get all properties with their bank account status
 */
export async function getPropertiesWithBankAccounts() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated', properties: [] };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message, properties: [] };
    }

    const properties = await prisma.property.findMany({
      where: {
        landlordId: landlordResult.landlord.id,
        status: { not: 'deleted' }, // Exclude soft-deleted properties
      },
      include: {
        bankAccount: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      properties: properties.map((prop) => ({
        id: prop.id,
        name: prop.name,
        slug: prop.slug,
        hasBankAccount: !!prop.bankAccount,
        bankAccount: prop.bankAccount
          ? {
              last4: prop.bankAccount.last4,
              bankName: prop.bankAccount.bankName,
              isVerified: prop.bankAccount.isVerified,
            }
          : null,
      })),
    };
  } catch (error) {
    return { success: false, message: formatError(error), properties: [] };
  }
}
