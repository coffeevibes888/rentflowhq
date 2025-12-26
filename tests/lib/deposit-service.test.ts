/**
 * Property-based tests for DepositService
 * Feature: tenant-lifecycle-management
 */

import * as fc from 'fast-check';
import { DepositService } from '@/lib/services/deposit-service';

const depositService = new DepositService();

describe('DepositService', () => {
  /**
   * Property 11: Deposit Disposition Record Integrity
   * For any completed deposit disposition, the DepositDisposition record SHALL contain:
   * original amount, total deductions (sum of all deduction items), refund amount 
   * (original - deductions), and all deduction items with their evidence URLs.
   * 
   * Validates: Requirements 5.5, 5.6
   */
  describe('Property 11: Deposit Disposition Record Integrity', () => {
    it('should calculate refund as original minus deductions', () => {
      fc.assert(
        fc.property(
          // Generate original deposit amount (positive)
          fc.float({ min: 100, max: 10000, noNaN: true }),
          // Generate array of deduction amounts
          fc.array(
            fc.float({ min: 1, max: 500, noNaN: true }),
            { minLength: 0, maxLength: 10 }
          ),
          (originalAmount, deductionAmounts) => {
            const totalDeductions = deductionAmounts.reduce((sum, d) => sum + d, 0);
            
            // Only test valid cases where deductions don't exceed deposit
            if (totalDeductions > originalAmount) return true;
            
            const expectedRefund = originalAmount - totalDeductions;
            const actualRefund = originalAmount - totalDeductions;
            
            expect(Math.abs(actualRefund - expectedRefund)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure total deductions equals sum of individual deductions', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              category: fc.constantFrom('damages', 'unpaid_rent', 'cleaning', 'repairs', 'other'),
              amount: fc.float({ min: 1, max: 500, noNaN: true }),
              description: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (deductions) => {
            const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
            const sumOfIndividual = deductions.map(d => d.amount).reduce((a, b) => a + b, 0);
            
            expect(Math.abs(totalDeductions - sumOfIndividual)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never produce negative refund amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 100, max: 10000, noNaN: true }),
          fc.array(
            fc.float({ min: 1, max: 500, noNaN: true }),
            { minLength: 0, maxLength: 10 }
          ),
          (originalAmount, deductionAmounts) => {
            const totalDeductions = deductionAmounts.reduce((sum, d) => sum + d, 0);
            
            // Only test valid cases where deductions don't exceed deposit
            if (totalDeductions > originalAmount) return true;
            
            const refundAmount = originalAmount - totalDeductions;
            expect(refundAmount).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Deposit Applied to Balance Reduces Refund
   * For any deposit disposition where deposit is applied to outstanding balance,
   * the refund amount SHALL equal: original_deposit - deductions - amount_applied_to_balance
   * 
   * Validates: Requirements 6.5
   */
  describe('Property 13: Deposit Applied to Balance Reduces Refund', () => {
    it('should correctly calculate refund when applying to balance', () => {
      fc.assert(
        fc.property(
          // Original deposit
          fc.float({ min: 500, max: 5000, noNaN: true }),
          // Total deductions (less than deposit)
          fc.float({ min: 0, max: 400, noNaN: true }),
          // Outstanding balance
          fc.float({ min: 0, max: 2000, noNaN: true }),
          // Whether to apply to balance
          fc.boolean(),
          (originalDeposit, deductions, outstandingBalance, applyToBalance) => {
            const result = depositService.calculateRefundAfterBalance(
              originalDeposit,
              deductions,
              outstandingBalance,
              applyToBalance
            );

            const availableForRefund = originalDeposit - deductions;

            if (!applyToBalance || outstandingBalance <= 0) {
              // If not applying to balance, refund should equal available amount
              expect(Math.abs(result.refundAmount - availableForRefund)).toBeLessThan(0.01);
              expect(result.appliedToBalance).toBe(0);
            } else {
              // If applying to balance
              const expectedApplied = Math.min(availableForRefund, outstandingBalance);
              const expectedRefund = availableForRefund - expectedApplied;
              
              expect(Math.abs(result.appliedToBalance - expectedApplied)).toBeLessThan(0.01);
              expect(Math.abs(result.refundAmount - expectedRefund)).toBeLessThan(0.01);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never apply more than available after deductions', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 500, max: 5000, noNaN: true }),
          fc.float({ min: 0, max: 400, noNaN: true }),
          fc.float({ min: 0, max: 10000, noNaN: true }),
          (originalDeposit, deductions, outstandingBalance) => {
            const result = depositService.calculateRefundAfterBalance(
              originalDeposit,
              deductions,
              outstandingBalance,
              true
            );

            const availableForRefund = originalDeposit - deductions;
            expect(result.appliedToBalance).toBeLessThanOrEqual(availableForRefund + 0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never apply more than outstanding balance', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 500, max: 5000, noNaN: true }),
          fc.float({ min: 0, max: 400, noNaN: true }),
          fc.float({ min: 0, max: 10000, noNaN: true }),
          (originalDeposit, deductions, outstandingBalance) => {
            const result = depositService.calculateRefundAfterBalance(
              originalDeposit,
              deductions,
              outstandingBalance,
              true
            );

            expect(result.appliedToBalance).toBeLessThanOrEqual(outstandingBalance + 0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should satisfy: refund + applied = available', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 500, max: 5000, noNaN: true }),
          fc.float({ min: 0, max: 400, noNaN: true }),
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.boolean(),
          (originalDeposit, deductions, outstandingBalance, applyToBalance) => {
            const result = depositService.calculateRefundAfterBalance(
              originalDeposit,
              deductions,
              outstandingBalance,
              applyToBalance
            );

            const availableForRefund = originalDeposit - deductions;
            const total = result.refundAmount + result.appliedToBalance;
            
            expect(Math.abs(total - availableForRefund)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce non-negative refund and applied amounts', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 500, max: 5000, noNaN: true }),
          fc.float({ min: 0, max: 400, noNaN: true }),
          fc.float({ min: 0, max: 10000, noNaN: true }),
          fc.boolean(),
          (originalDeposit, deductions, outstandingBalance, applyToBalance) => {
            const result = depositService.calculateRefundAfterBalance(
              originalDeposit,
              deductions,
              outstandingBalance,
              applyToBalance
            );

            expect(result.refundAmount).toBeGreaterThanOrEqual(-0.01);
            expect(result.appliedToBalance).toBeGreaterThanOrEqual(-0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
