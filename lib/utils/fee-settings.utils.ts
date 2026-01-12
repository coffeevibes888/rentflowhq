import { prisma } from '@/db/prisma';

export interface EffectiveFeeSettings {
  securityDepositMonths: number;
  petDepositEnabled: boolean;
  petDepositAmount: number | null;
  petRentEnabled: boolean;
  petRentAmount: number | null;
  cleaningFeeEnabled: boolean;
  cleaningFeeAmount: number | null;
  applicationFeeEnabled: boolean;
  applicationFeeAmount: number | null;
  lastMonthRentRequired: boolean;
}

export interface LandlordFeeSettings {
  securityDepositMonths: number;
  petDepositEnabled: boolean;
  petDepositAmount: number | null;
  petRentEnabled: boolean;
  petRentAmount: number | null;
  cleaningFeeEnabled: boolean;
  cleaningFeeAmount: number | null;
  applicationFeeEnabled: boolean;
  applicationFeeAmount: number | null;
  lastMonthRentRequired: boolean;
}

/**
 * Get effective fee settings for a property, considering property-specific overrides
 * @param propertyId - The property ID
 * @param landlordSettings - The landlord's default fee settings
 * @returns Effective fee settings with property overrides applied
 */
export async function getEffectiveFeeSettings(
  propertyId: string,
  landlordSettings: LandlordFeeSettings
): Promise<EffectiveFeeSettings> {
  // Try to get property-specific overrides
  const propertyOverride = await (prisma as any).propertyFeeSettings?.findUnique?.({
    where: { propertyId },
  }).catch(() => null);

  if (!propertyOverride) {
    return landlordSettings;
  }

  return {
    // Security Deposit
    securityDepositMonths: propertyOverride.noSecurityDeposit 
      ? 0 
      : (propertyOverride.securityDepositMonths !== null 
          ? Number(propertyOverride.securityDepositMonths) 
          : landlordSettings.securityDepositMonths),

    // Pet Deposit
    petDepositEnabled: propertyOverride.noPetFees 
      ? false 
      : (propertyOverride.petDepositEnabled !== null 
          ? propertyOverride.petDepositEnabled 
          : landlordSettings.petDepositEnabled),
    petDepositAmount: propertyOverride.noPetFees 
      ? null 
      : (propertyOverride.petDepositAmount !== null 
          ? Number(propertyOverride.petDepositAmount) 
          : landlordSettings.petDepositAmount),

    // Pet Rent
    petRentEnabled: propertyOverride.noPetFees 
      ? false 
      : (propertyOverride.petRentEnabled !== null 
          ? propertyOverride.petRentEnabled 
          : landlordSettings.petRentEnabled),
    petRentAmount: propertyOverride.noPetFees 
      ? null 
      : (propertyOverride.petRentAmount !== null 
          ? Number(propertyOverride.petRentAmount) 
          : landlordSettings.petRentAmount),

    // Cleaning Fee
    cleaningFeeEnabled: propertyOverride.noCleaningFee 
      ? false 
      : (propertyOverride.cleaningFeeEnabled !== null 
          ? propertyOverride.cleaningFeeEnabled 
          : landlordSettings.cleaningFeeEnabled),
    cleaningFeeAmount: propertyOverride.noCleaningFee 
      ? null 
      : (propertyOverride.cleaningFeeAmount !== null 
          ? Number(propertyOverride.cleaningFeeAmount) 
          : landlordSettings.cleaningFeeAmount),

    // Application Fee
    applicationFeeEnabled: propertyOverride.noApplicationFee 
      ? false 
      : (propertyOverride.applicationFeeEnabled !== null 
          ? propertyOverride.applicationFeeEnabled 
          : landlordSettings.applicationFeeEnabled),
    applicationFeeAmount: propertyOverride.noApplicationFee 
      ? null 
      : (propertyOverride.applicationFeeAmount !== null 
          ? Number(propertyOverride.applicationFeeAmount) 
          : landlordSettings.applicationFeeAmount),

    // Last Month's Rent
    lastMonthRentRequired: propertyOverride.lastMonthRentRequired !== null 
      ? propertyOverride.lastMonthRentRequired 
      : landlordSettings.lastMonthRentRequired,
  };
}

/**
 * Get effective fee settings synchronously when property override is already loaded
 */
export function applyPropertyOverrides(
  landlordSettings: LandlordFeeSettings,
  propertyOverride: any | null
): EffectiveFeeSettings {
  if (!propertyOverride) {
    return landlordSettings;
  }

  return {
    securityDepositMonths: propertyOverride.noSecurityDeposit 
      ? 0 
      : (propertyOverride.securityDepositMonths !== null 
          ? Number(propertyOverride.securityDepositMonths) 
          : landlordSettings.securityDepositMonths),

    petDepositEnabled: propertyOverride.noPetFees 
      ? false 
      : (propertyOverride.petDepositEnabled !== null 
          ? propertyOverride.petDepositEnabled 
          : landlordSettings.petDepositEnabled),
    petDepositAmount: propertyOverride.noPetFees 
      ? null 
      : (propertyOverride.petDepositAmount !== null 
          ? Number(propertyOverride.petDepositAmount) 
          : landlordSettings.petDepositAmount),

    petRentEnabled: propertyOverride.noPetFees 
      ? false 
      : (propertyOverride.petRentEnabled !== null 
          ? propertyOverride.petRentEnabled 
          : landlordSettings.petRentEnabled),
    petRentAmount: propertyOverride.noPetFees 
      ? null 
      : (propertyOverride.petRentAmount !== null 
          ? Number(propertyOverride.petRentAmount) 
          : landlordSettings.petRentAmount),

    cleaningFeeEnabled: propertyOverride.noCleaningFee 
      ? false 
      : (propertyOverride.cleaningFeeEnabled !== null 
          ? propertyOverride.cleaningFeeEnabled 
          : landlordSettings.cleaningFeeEnabled),
    cleaningFeeAmount: propertyOverride.noCleaningFee 
      ? null 
      : (propertyOverride.cleaningFeeAmount !== null 
          ? Number(propertyOverride.cleaningFeeAmount) 
          : landlordSettings.cleaningFeeAmount),

    applicationFeeEnabled: propertyOverride.noApplicationFee 
      ? false 
      : (propertyOverride.applicationFeeEnabled !== null 
          ? propertyOverride.applicationFeeEnabled 
          : landlordSettings.applicationFeeEnabled),
    applicationFeeAmount: propertyOverride.noApplicationFee 
      ? null 
      : (propertyOverride.applicationFeeAmount !== null 
          ? Number(propertyOverride.applicationFeeAmount) 
          : landlordSettings.applicationFeeAmount),

    lastMonthRentRequired: propertyOverride.lastMonthRentRequired !== null 
      ? propertyOverride.lastMonthRentRequired 
      : landlordSettings.lastMonthRentRequired,
  };
}
