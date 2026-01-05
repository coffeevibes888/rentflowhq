/**
 * Platform Fee Configuration
 * 
 * SUBSCRIPTION-BASED MODEL - No transaction fees!
 * Revenue comes from monthly subscriptions ($19.99 / $39.99 / $79.99)
 * 
 * All platform fees are set to $0 - tenants pay only rent,
 * landlords receive full rent minus Stripe processing fees.
 */

export const PLATFORM_FEES = {
  /**
   * Base Platform Service Fee - DISABLED (subscription model)
   */
  BASE_FEE: 0,

  /**
   * Convenience Fee for Card Payments - DISABLED (subscription model)
   * Tenants pay exact rent amount, no extra fees
   */
  CONVENIENCE_FEE_INSTANT: 0,

  /**
   * ACH/Bank Transfer Fee - DISABLED (always free)
   */
  CONVENIENCE_FEE_ACH: 0,

  /**
   * Card Payment Surcharge - DISABLED
   * Stripe processing fees are absorbed by landlord (industry standard)
   */
  PASS_CARD_FEE_TO_TENANT: false,

  /**
   * ACH Payment Fee Handling - DISABLED
   */
  PASS_ACH_FEE_TO_TENANT: false,

  /**
   * Instant Payout Fee - DISABLED (subscription model)
   * Landlords only pay Stripe's 1.5% for instant payouts
   */
  INSTANT_PAYOUT_MARKUP: 0,
} as const;

/**
 * Calculate total payment amount - NO PLATFORM FEES
 * Tenant pays exact rent amount
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
  // No platform fees - tenant pays exact rent
  return {
    rentAmount,
    convenienceFee: 0,
    stripeFee: 0,
    totalAmount: rentAmount,
    feeDescription: paymentMethodType === 'ach' ? 'Free bank transfer' : 'No fees',
  };
}

/**
 * Calculate card surcharge - DISABLED
 */
export function calculateCardSurcharge(amount: number): number {
  return 0;
}

/**
 * Calculate ACH fee - DISABLED
 */
export function calculateACHSurcharge(amount: number): number {
  return 0;
}

/**
 * Get convenience fee in cents - ALWAYS 0
 */
export function getConvenienceFeeInCents(paymentMethodType: 'ach' | 'card' | 'instant' = 'card'): number {
  return 0;
}

/**
 * Get base platform fee in cents - ALWAYS 0
 */
export function getPlatformFeeInCents(): number {
  return 0;
}

/**
 * Revenue Projection Calculator - SUBSCRIPTION MODEL
 * Revenue now comes from subscriptions, not transaction fees
 */
export function estimateMonthlyRevenue(params: {
  starterSubscribers: number;  // $19.99/month
  proSubscribers: number;      // $39.99/month
  enterpriseSubscribers: number; // $79.99/month
}): {
  starterRevenue: number;
  proRevenue: number;
  enterpriseRevenue: number;
  totalMonthlyRevenue: number;
} {
  const starterRevenue = params.starterSubscribers * 19.99;
  const proRevenue = params.proSubscribers * 39.99;
  const enterpriseRevenue = params.enterpriseSubscribers * 79.99;
  
  return {
    starterRevenue,
    proRevenue,
    enterpriseRevenue,
    totalMonthlyRevenue: starterRevenue + proRevenue + enterpriseRevenue,
  };
}

/**
 * Example usage:
 * 
 * const revenue = estimateMonthlyRevenue({
 *   starterSubscribers: 100,    // 100 × $19.99 = $1,999
 *   proSubscribers: 50,         // 50 × $39.99 = $1,999.50
 *   enterpriseSubscribers: 20,  // 20 × $79.99 = $1,599.80
 * });
 * 
 * console.log(revenue.totalMonthlyRevenue); // $5,598.30
 */
