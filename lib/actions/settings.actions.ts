'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';
import { getOrCreateCurrentLandlord } from './landlord.actions';

const lateFeeSettingsSchema = z.object({
  enabled: z.boolean(),
  gracePeriodDays: z.number().int().min(0),
  feeType: z.enum(['flat', 'percentage']),
  feeAmount: z.number().min(0),
  maxFee: z.number().optional().nullable(),
});

export async function getLateFeeSettings() {
  try {
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success || !landlordResult.landlord) {
      throw new Error('Could not identify landlord.');
    }

    const settings = await prisma.lateFeeSettings.findUnique({
      where: { landlordId: landlordResult.landlord.id },
    });

    // Return default settings if none are found
    if (!settings) {
      return {
        enabled: false,
        gracePeriodDays: 5,
        feeType: 'flat',
        feeAmount: 50.00,
        maxFee: null,
      };
    }

    return {
      ...settings,
      feeAmount: Number(settings.feeAmount),
      maxFee: settings.maxFee ? Number(settings.maxFee) : null,
    };
  } catch (error) {
    console.error('Failed to get late fee settings:', error);
    // Return default settings on error
    return {
      enabled: false,
      gracePeriodDays: 5,
      feeType: 'flat',
      feeAmount: 50.00,
      maxFee: null,
    };
  }
}

export async function updateLateFeeSettings(data: z.infer<typeof lateFeeSettingsSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Not authenticated' };
        }

        const landlordResult = await getOrCreateCurrentLandlord();
        if (!landlordResult.success || !landlordResult.landlord) {
            return { success: false, message: 'Could not identify landlord.' };
        }
        const landlordId = landlordResult.landlord.id;

        const validatedData = lateFeeSettingsSchema.parse(data);

        await prisma.lateFeeSettings.upsert({
            where: { landlordId },
            create: {
                landlordId,
                ...validatedData,
            },
            update: validatedData,
        });

        revalidatePath('/admin/settings/financials');

        return { success: true, message: 'Late fee settings updated successfully.' };

    } catch (error) {
        return { success: false, message: formatError(error) };
    }
}