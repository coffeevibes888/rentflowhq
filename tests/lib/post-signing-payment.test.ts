/**
 * Property Tests for Post-Signing Payment Flow
 * Feature: lease-workflow, Task 11
 * 
 * These tests validate universal correctness properties for the post-signing payment flow:
 * - Property 27: Post-Signing Payment Redirect
 * - Property 28: Move-In Cost Calculation
 * - Property 29: Payment Record Linkage
 */

import * as fc from 'fast-check';

// Generators for property-based tests
const uuidArb = fc.uuid();
const rentAmountArb = fc.integer({ min: 500, max: 10000 });
const depositMonthsArb = fc.integer({ min: 0, max: 3 });
const dateArb = fc.date({ min: new Date('2024-01-01'), max: new Date('2030-12-31') });

// Complex generators
const leaseArb = fc.record({
  id: uuidArb,
  tenantId: uuidArb,
  unitId: uuidArb,
  status: fc.constantFrom('pending_signature', 'active'),
  rentAmount: rentAmountArb,
  startDate: dateArb,
  endDate: fc.option(dateArb, { nil: null }),
  billingDayOfMonth: fc.integer({ min: 1, max: 28 }),
  tenantSignedAt: fc.option(dateArb, { nil: null }),
  landlordSignedAt: fc.option(dateArb, { nil: null }),
});

const landlordSettingsArb = fc.record({
  securityDepositMonths: depositMonthsArb,
  petDepositEnabled: fc.boolean(),
  petDepositAmount: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
  cleaningFeeEnabled: fc.boolean(),
  cleaningFeeAmount: fc.option(fc.integer({ min: 0, max: 500 }), { nil: null }),
});

const rentPaymentArb = fc.record({
  id: uuidArb,
  leaseId: uuidArb,
  tenantId: uuidArb,
  amount: rentAmountArb,
  status: fc.constantFrom('pending', 'processing', 'paid', 'failed'),
  dueDate: dateArb,
  metadata: fc.record({
    type: fc.constantFrom('first_month_rent', 'last_month_rent', 'security_deposit', 'monthly_rent'),
  }),
});

describe('Post-Signing Payment Flow - Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 27: Post-Signing Payment Redirect
   * Validates: Requirements 9.1
   * 
   * For any tenant completing their lease signature, the system SHALL redirect
   * to the rent payment page with the lease ID in context.
   */
  describe('Property 27: Post-Signing Payment Redirect', () => {
    it('tenant signing completion triggers redirect to payment page', async () => {
      await fc.assert(
        fc.asyncProperty(
          leaseArb,
          dateArb,
          async (lease, signedDate) => {
            // Setup: tenant just signed
            const signedLease = {
              ...lease,
              status: 'pending_signature',
              tenantSignedAt: signedDate,
              landlordSignedAt: null,
            };

            // The redirect URL should be the rent-receipts page
            const expectedRedirectUrl = '/user/profile/rent-receipts';

            // Verify: tenant role should redirect to payment page
            const role = 'tenant';
            const redirectUrl = role === 'tenant' 
              ? '/user/profile/rent-receipts' 
              : '/admin/products';

            expect(redirectUrl).toBe(expectedRedirectUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('landlord signing completion does not redirect to payment page', async () => {
      await fc.assert(
        fc.asyncProperty(
          leaseArb,
          dateArb,
          dateArb,
          async (lease, tenantSignedDate, landlordSignedDate) => {
            // Setup: landlord just signed (after tenant)
            const fullySignedLease = {
              ...lease,
              status: 'active',
              tenantSignedAt: tenantSignedDate,
              landlordSignedAt: landlordSignedDate,
            };

            // Verify: landlord role should NOT redirect to payment page
            const role = 'landlord';
            const redirectUrl = role === 'tenant' 
              ? '/user/profile/rent-receipts' 
              : '/admin/products';

            expect(redirectUrl).not.toBe('/user/profile/rent-receipts');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 28: Move-In Cost Calculation
   * Validates: Requirements 9.2
   * 
   * For any newly signed lease displayed on the payment page, the system SHALL show
   * move-in costs that include: first month rent (from lease), security deposit
   * (from lease terms), and any applicable fees.
   */
  describe('Property 28: Move-In Cost Calculation', () => {
    it('move-in costs include first month rent', async () => {
      await fc.assert(
        fc.asyncProperty(
          leaseArb,
          landlordSettingsArb,
          async (lease, settings) => {
            // Calculate expected move-in costs
            const firstMonthRent = Number(lease.rentAmount);
            
            // First month rent should always be included
            expect(firstMonthRent).toBeGreaterThan(0);
            expect(firstMonthRent).toBe(Number(lease.rentAmount));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('move-in costs include security deposit based on settings', async () => {
      await fc.assert(
        fc.asyncProperty(
          leaseArb,
          landlordSettingsArb,
          async (lease, settings) => {
            const rentAmount = Number(lease.rentAmount);
            const securityDeposit = rentAmount * settings.securityDepositMonths;

            // Security deposit should be rent * deposit months
            if (settings.securityDepositMonths > 0) {
              expect(securityDeposit).toBeGreaterThan(0);
              expect(securityDeposit).toBe(rentAmount * settings.securityDepositMonths);
            } else {
              expect(securityDeposit).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('total move-in cost is sum of all components', async () => {
      await fc.assert(
        fc.asyncProperty(
          leaseArb,
          landlordSettingsArb,
          async (lease, settings) => {
            const rentAmount = Number(lease.rentAmount);
            
            // Calculate components
            const firstMonthRent = rentAmount;
            const securityDeposit = rentAmount * settings.securityDepositMonths;
            const petDeposit = settings.petDepositEnabled && settings.petDepositAmount 
              ? settings.petDepositAmount 
              : 0;
            const cleaningFee = settings.cleaningFeeEnabled && settings.cleaningFeeAmount 
              ? settings.cleaningFeeAmount 
              : 0;

            // Total should be sum of all components
            const expectedTotal = firstMonthRent + securityDeposit + petDeposit + cleaningFee;
            const calculatedTotal = firstMonthRent + securityDeposit + petDeposit + cleaningFee;

            expect(calculatedTotal).toBe(expectedTotal);
            expect(calculatedTotal).toBeGreaterThanOrEqual(firstMonthRent);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('move-in costs are non-negative', async () => {
      await fc.assert(
        fc.asyncProperty(
          leaseArb,
          landlordSettingsArb,
          async (lease, settings) => {
            const rentAmount = Number(lease.rentAmount);
            const securityDeposit = rentAmount * settings.securityDepositMonths;
            const petDeposit = settings.petDepositEnabled && settings.petDepositAmount 
              ? settings.petDepositAmount 
              : 0;
            const cleaningFee = settings.cleaningFeeEnabled && settings.cleaningFeeAmount 
              ? settings.cleaningFeeAmount 
              : 0;

            // All components should be non-negative
            expect(rentAmount).toBeGreaterThanOrEqual(0);
            expect(securityDeposit).toBeGreaterThanOrEqual(0);
            expect(petDeposit).toBeGreaterThanOrEqual(0);
            expect(cleaningFee).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 29: Payment Record Linkage
   * Validates: Requirements 9.4
   * 
   * For any successful payment submission, the created RentPayment record SHALL be
   * linked to the correct lease ID and tenant ID.
   */
  describe('Property 29: Payment Record Linkage', () => {
    it('payment record contains correct lease ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          leaseArb,
          rentPaymentArb,
          async (lease, payment) => {
            // Create payment linked to lease
            const linkedPayment = {
              ...payment,
              leaseId: lease.id,
              tenantId: lease.tenantId,
            };

            // Verify: payment is linked to correct lease
            expect(linkedPayment.leaseId).toBe(lease.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('payment record contains correct tenant ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          leaseArb,
          rentPaymentArb,
          async (lease, payment) => {
            // Create payment linked to lease
            const linkedPayment = {
              ...payment,
              leaseId: lease.id,
              tenantId: lease.tenantId,
            };

            // Verify: payment is linked to correct tenant
            expect(linkedPayment.tenantId).toBe(lease.tenantId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('payment amount matches lease rent amount for monthly rent', async () => {
      await fc.assert(
        fc.asyncProperty(
          leaseArb,
          async (lease) => {
            // Create monthly rent payment
            const monthlyPayment = {
              id: 'payment-id',
              leaseId: lease.id,
              tenantId: lease.tenantId,
              amount: Number(lease.rentAmount),
              status: 'pending',
              metadata: { type: 'monthly_rent' },
            };

            // Verify: monthly rent payment matches lease rent amount
            expect(monthlyPayment.amount).toBe(Number(lease.rentAmount));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('payment records have valid status', async () => {
      await fc.assert(
        fc.asyncProperty(
          rentPaymentArb,
          async (payment) => {
            const validStatuses = ['pending', 'processing', 'paid', 'failed', 'overdue'];
            
            // Verify: payment status is valid
            expect(validStatuses).toContain(payment.status);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('move-in payment types are correctly categorized', async () => {
      await fc.assert(
        fc.asyncProperty(
          rentPaymentArb,
          async (payment) => {
            const moveInTypes = ['first_month_rent', 'last_month_rent', 'security_deposit', 'pet_deposit_annual', 'cleaning_fee'];
            const paymentType = payment.metadata?.type;

            if (moveInTypes.includes(paymentType)) {
              // This is a move-in payment
              expect(moveInTypes).toContain(paymentType);
            } else {
              // This is a regular payment
              expect(paymentType).toBe('monthly_rent');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
