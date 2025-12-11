/**
 * Platform Fee Configuration
 * 
 * This is YOUR SaaS revenue model - the application fee per transaction
 * that Stripe automatically routes to your platform account.
 */

export const PLATFORM_FEES = {
  /**
   * Base Platform Service Fee (for all payments)
   * Default: $0.00 - No base fee, only convenience fees
   */
  BASE_FEE: parseFloat(process.env.PLATFORM_BASE_FEE || '0.00'),

  /**
   * Convenience Fee for Instant Payment Methods
   * Applied to: Cards, Apple Pay, Google Pay, Venmo, CashApp
   * Default: $2.00 per transaction
   * 
   * This fee goes 100% to your platform account (super admin)
   * 
   * Example with $1,500 rent payment via Card:
   * - Tenant pays: $1,502.00 ($1,500 rent + $2 convenience fee)
   * - Landlord receives: $1,500.00 (minus Stripe processing fee ~$43)
   * - You receive: $2.00 (100% profit!)
   */
  CONVENIENCE_FEE_INSTANT: parseFloat(process.env.CONVENIENCE_FEE_INSTANT || '2.00'),

  /**
   * ACH/Bank Transfer Fee
   * Default: $0.00 - FREE for tenants to encourage bank payments
   * 
   * Example with $1,500 rent payment via ACH:
   * - Tenant pays: $1,500.00 (NO convenience fee)
   * - Landlord receives: ~$1,495.00 (minus Stripe ACH fee ~$5)
   * - You receive: $0.00 from this payment
   */
  CONVENIENCE_FEE_ACH: parseFloat(process.env.CONVENIENCE_FEE_ACH || '0.00'),

  /**
   * Card Payment Surcharge
   * If true, pass Stripe's 2.9% + $0.30 card fee to the tenant
   * If false, you absorb the card processing fee
   */
  PASS_CARD_FEE_TO_TENANT: process.env.PASS_CARD_FEE_TO_TENANT === 'true',

  /**
   * ACH Payment Fee Handling
   * If true, add Stripe's 0.8% ACH fee to tenant's payment
   * If false, you absorb the ACH fee (recommended for growth)
   */
  PASS_ACH_FEE_TO_TENANT: process.env.PASS_ACH_FEE_TO_TENANT === 'true',

  /**
   * Instant Payout Fee
   * What you charge landlords for instant payouts (on top of Stripe's 1.5%)
   * Default: 0.5% (so total is 2% to landlord)
   */
  INSTANT_PAYOUT_MARKUP: parseFloat(process.env.INSTANT_PAYOUT_MARKUP || '0.5'),
} as const;

/**
 * Calculate total payment amount including fees based on payment method
 */
export function calculateRentPaymentAmount(
  rentAmount: number, 
  paymentMethodType: 'ach' | 'card' | 'instant' = 'card'
): {
  rentAmount: number;
  convenienceFee: number;
  stripeFee: number;
  totalAmount: number;
  feeDescription: string;
} {
  let convenienceFee = 0;
  let stripeFee = 0;
  let feeDescription = '';

  if (paymentMethodType === 'ach') {
    // ACH: FREE convenience fee, optional Stripe fee passthrough
    convenienceFee = PLATFORM_FEES.CONVENIENCE_FEE_ACH;
    if (PLATFORM_FEES.PASS_ACH_FEE_TO_TENANT) {
      stripeFee = calculateACHSurcharge(rentAmount);
    }
    feeDescription = convenienceFee > 0 ? 'Bank transfer fee' : 'Free bank transfer';
  } else {
    // Card/Wallet: $2 convenience fee, optional card fee passthrough
    convenienceFee = PLATFORM_FEES.CONVENIENCE_FEE_INSTANT;
    if (PLATFORM_FEES.PASS_CARD_FEE_TO_TENANT) {
      stripeFee = calculateCardSurcharge(rentAmount);
    }
    feeDescription = 'Convenience fee (instant payment)';
  }

  const totalAmount = rentAmount + convenienceFee + stripeFee;

  return {
    rentAmount,
    convenienceFee,
    stripeFee,
    totalAmount,
    feeDescription,
  };
}

/**
 * Calculate card surcharge if enabled
 */
export function calculateCardSurcharge(amount: number): number {
  if (!PLATFORM_FEES.PASS_CARD_FEE_TO_TENANT) return 0;
  
  // Stripe's card fee: 2.9% + $0.30
  return amount * 0.029 + 0.30;
}

/**
 * Calculate ACH fee if passed to tenant
 */
export function calculateACHSurcharge(amount: number): number {
  if (!PLATFORM_FEES.PASS_ACH_FEE_TO_TENANT) return 0;
  
  // Stripe's ACH fee: 0.8% capped at $5
  return Math.min(amount * 0.008, 5.00);
}

/**
 * Get convenience fee in cents for Stripe
 */
export function getConvenienceFeeInCents(paymentMethodType: 'ach' | 'card' | 'instant' = 'card'): number {
  if (paymentMethodType === 'ach') {
    return Math.round(PLATFORM_FEES.CONVENIENCE_FEE_ACH * 100);
  }
  return Math.round(PLATFORM_FEES.CONVENIENCE_FEE_INSTANT * 100);
}

/**
 * Get base platform fee in cents (legacy compatibility)
 */
export function getPlatformFeeInCents(): number {
  return Math.round(PLATFORM_FEES.BASE_FEE * 100);
}

/**
 * Revenue Projection Calculator
 * Use this to estimate your monthly revenue
 */
export function estimateMonthlyRevenue(params: {
  numberOfLandlords: number;
  averageUnitsPerLandlord: number;
  averageRentPerUnit: number;
  cardPaymentRate: number; // percentage (0-100) of tenants using cards/wallets
  instantPayoutRate: number; // percentage (0-100) of landlords using instant payouts
}): {
  convenienceFeeRevenue: number;
  instantPayoutRevenue: number;
  totalMonthlyRevenue: number;
} {
  const totalUnits = params.numberOfLandlords * params.averageUnitsPerLandlord;
  const totalRentCollected = totalUnits * params.averageRentPerUnit;
  
  // Convenience fee revenue (only from card/wallet payments)
  const cardPaymentCount = totalUnits * (params.cardPaymentRate / 100);
  const convenienceFeeRevenue = cardPaymentCount * PLATFORM_FEES.CONVENIENCE_FEE_INSTANT;
  
  // Instant payout revenue (% of landlords who use it)
  const instantPayoutVolume = totalRentCollected * (params.instantPayoutRate / 100);
  const instantPayoutRevenue = instantPayoutVolume * (PLATFORM_FEES.INSTANT_PAYOUT_MARKUP / 100);
  
  return {
    convenienceFeeRevenue,
    instantPayoutRevenue,
    totalMonthlyRevenue: convenienceFeeRevenue + instantPayoutRevenue,
  };
}

/**
 * Example usage:
 * 
 * const revenue = estimateMonthlyRevenue({
 *   numberOfLandlords: 50,
 *   averageUnitsPerLandlord: 5,
 *   averageRentPerUnit: 1200,
 *   cardPaymentRate: 30, // 30% of tenants use cards/wallets
 *   instantPayoutRate: 30, // 30% of landlords use instant payouts
 * });
 * 
 * console.log(revenue);
 * // {
 * //   convenienceFeeRevenue: $150 (250 units × 30% × $2)
 * //   instantPayoutRevenue: $900 (30% × $300k × 0.5%)
 * //   totalMonthlyRevenue: $1,050
 * // }
 */

