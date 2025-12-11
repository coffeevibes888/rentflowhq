'use server';

import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { formatError } from '../utils';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function getOrCreateCurrentLandlord() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    const userId = session.user.id as string;
    const userName = session.user.name || 'My Properties';

    let landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: userId },
    });

    if (!landlord) {
      const base =
        userName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'landlord';

      let subdomain = base;
      let suffix = 1;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const existing = await prisma.landlord.findUnique({ where: { subdomain } });
        if (!existing) break;
        subdomain = `${base}-${suffix++}`;
      }

      landlord = await prisma.landlord.create({
        data: {
          name: userName,
          subdomain,
          ownerUserId: userId,
        },
      });
    }

    return { success: true as const, landlord };
  } catch (error) {
    return { success: false as const, message: formatError(error) };
  }
}

export async function updateCurrentLandlordSubdomain(formData: FormData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get current user's landlord
    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      throw new Error('Landlord not found');
    }

    const subdomain = formData.get('subdomain') as string;

    if (!subdomain || subdomain.trim().length === 0) {
      throw new Error('Subdomain is required');
    }

    // Validate subdomain format
    const sanitized = subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (sanitized.length < 3 || sanitized.length > 50) {
      throw new Error('Subdomain must be 3-50 characters, letters, numbers, and hyphens only');
    }

    // Check if subdomain is already taken
    const existing = await prisma.landlord.findUnique({
      where: { subdomain: sanitized },
    });

    if (existing && existing.id !== landlord.id) {
      throw new Error('Subdomain is already taken');
    }

    // Update landlord subdomain
    await prisma.landlord.update({
      where: { id: landlord.id },
      data: { subdomain: sanitized },
    });

    return { success: true };
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Failed to update subdomain:', error instanceof Error ? error.message : 'Unknown error');
    }
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update subdomain' };
  }
}

export async function uploadLandlordLogo(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get current user's landlord
    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      throw new Error('Landlord not found');
    }

    const file = formData.get('logo') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, SVG, or WebP');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 5MB');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${landlord.id}-${randomUUID()}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update landlord with new logo URL
    const logoUrl = `/uploads/logos/${fileName}`;
    await prisma.landlord.update({
      where: { id: landlord.id },
      data: { logoUrl },
    });

    return { success: true, logoUrl };
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Failed to upload logo:', error instanceof Error ? error.message : 'Unknown error');
    }
    return { success: false, message: error instanceof Error ? error.message : 'Failed to upload logo' };
  }
}

export async function updateCustomDomain(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get current user's landlord
    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      throw new Error('Landlord not found');
    }

    const customDomain = formData.get('customDomain') as string;

    if (!customDomain || customDomain.trim().length === 0) {
      // Remove custom domain
      await prisma.landlord.update({
        where: { id: landlord.id },
        data: { customDomain: null },
      });
      return { success: true };
    }

    // Validate domain format
    const sanitized = customDomain.toLowerCase().trim();
    const domainRegex = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
    if (!domainRegex.test(sanitized)) {
      throw new Error('Invalid domain format');
    }

    // Check if domain is already taken
    const existing = await prisma.landlord.findUnique({
      where: { customDomain: sanitized },
    });

    if (existing && existing.id !== landlord.id) {
      throw new Error('Domain is already taken');
    }

    // Update landlord custom domain
    await prisma.landlord.update({
      where: { id: landlord.id },
      data: { customDomain: sanitized },
    });

    return { success: true };
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Failed to update custom domain:', error instanceof Error ? error.message : 'Unknown error');
    }
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update custom domain' };
  }
}

export async function getLandlordBySubdomain(subdomain: string) {
  try {
    const normalized = subdomain.trim().toLowerCase();

    if (!normalized) {
      throw new Error('Subdomain is required');
    }

    const landlord = await prisma.landlord.findUnique({
      where: { subdomain: normalized },
    });

    if (!landlord) {
      return { success: false as const, message: 'Landlord not found for this subdomain.' };
    }

    return { success: true as const, landlord };
  } catch (error) {
    return { success: false as const, message: formatError(error) };
  }
}

// ========== PAYOUT METHODS ==========

import { savedPayoutMethodSchema } from '../validators';
import { revalidatePath } from 'next/cache';

// Add saved payout method (bank account or card)
export async function addSavedPayoutMethod(
  data: z.infer<typeof savedPayoutMethodSchema>
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

    const landlord = landlordResult.landlord;
    const validatedData = savedPayoutMethodSchema.parse(data);

    if (validatedData.isDefault) {
      await prisma.savedPayoutMethod.updateMany({
        where: { landlordId: landlord.id },
        data: { isDefault: false },
      });
    }

    const payoutMethod = await prisma.savedPayoutMethod.create({
      data: {
        landlordId: landlord.id,
        stripePaymentMethodId: validatedData.stripePaymentMethodId,
        type: validatedData.type,
        accountHolderName: validatedData.accountHolderName,
        last4: validatedData.last4,
        bankName: validatedData.bankName,
        accountType: validatedData.accountType,
        routingNumber: validatedData.routingNumber,
        isDefault: validatedData.isDefault,
        isVerified: true,
      },
    });

    revalidatePath('/admin/payouts');

    return {
      success: true,
      message: 'Payout method saved successfully!',
      payoutMethodId: payoutMethod.id,
    };
  } catch (error) {
    console.error('Error saving payout method:', error);
    const message = formatError(error);
    return { success: false, message: message || 'Failed to save payout method' };
  }
}

// Get saved payout methods for current landlord
export async function getSavedPayoutMethods() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated', methods: [] };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message, methods: [] };
    }

    const landlord = landlordResult.landlord;

    const methods = await prisma.savedPayoutMethod.findMany({
      where: { landlordId: landlord.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      success: true,
      methods: methods.map(method => ({
        id: method.id,
        type: method.type,
        last4: method.last4,
        bankName: method.bankName,
        accountType: method.accountType,
        accountHolderName: method.accountHolderName,
        isDefault: method.isDefault,
        isVerified: method.isVerified,
      })),
    };
  } catch (error) {
    return { success: false, message: formatError(error), methods: [] };
  }
}

// Delete saved payout method
export async function deleteSavedPayoutMethod(payoutMethodId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const landlord = landlordResult.landlord;

    const payoutMethod = await prisma.savedPayoutMethod.findUnique({
      where: { id: payoutMethodId },
    });

    if (!payoutMethod || payoutMethod.landlordId !== landlord.id) {
      return { success: false, message: 'Payout method not found' };
    }

    await prisma.savedPayoutMethod.delete({
      where: { id: payoutMethodId },
    });

    revalidatePath('/admin/payouts');

    return {
      success: true,
      message: 'Payout method deleted successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update saved payout method
export async function updateSavedPayoutMethod(
  payoutMethodId: string,
  data: z.infer<typeof savedPayoutMethodSchema>
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

    const landlord = landlordResult.landlord;

    const payoutMethod = await prisma.savedPayoutMethod.findUnique({
      where: { id: payoutMethodId },
    });

    if (!payoutMethod || payoutMethod.landlordId !== landlord.id) {
      return { success: false, message: 'Payout method not found' };
    }

    const validatedData = savedPayoutMethodSchema.parse(data);

    if (validatedData.isDefault) {
      await prisma.savedPayoutMethod.updateMany({
        where: { 
          landlordId: landlord.id,
          id: { not: payoutMethodId }
        },
        data: { isDefault: false },
      });
    }

    await prisma.savedPayoutMethod.update({
      where: { id: payoutMethodId },
      data: {
        stripePaymentMethodId: validatedData.stripePaymentMethodId,
        type: validatedData.type,
        accountHolderName: validatedData.accountHolderName,
        last4: validatedData.last4,
        bankName: validatedData.bankName,
        accountType: validatedData.accountType,
        routingNumber: validatedData.routingNumber,
        isDefault: validatedData.isDefault,
      },
    });

    revalidatePath('/admin/payouts');

    return {
      success: true,
      message: 'Payout method updated successfully',
    };
  } catch (error) {
    console.error('Error updating payout method:', error);
    return { success: false, message: formatError(error) };
  }
}