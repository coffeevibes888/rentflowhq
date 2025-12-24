/**
 * Property-based tests for stripe-connect.actions.ts
 * Feature: property-cashout
 */

import * as fc from 'fast-check';

// ============= VALIDATION LOGIC (extracted for testing) =============

/**
 * Validates cashout amount against available balance
 * Returns { valid: true } or { valid: false, message: string }
 */
export function validateCashoutAmount(
  amount: number,
  availableBalance: number
): { valid: true } | { valid: false; message: string } {
  if (amount < 1) {
    return { valid: false, message: 'Minimum payout is $1.00.' };
  }
  if (amount > availableBalance) {
    return { valid: false, message: 'Amount exceeds available balance.' };
  }
  return { valid: true };
}

/**
 * Calculates new wallet balance after cashout
 */
export function calculateNewBalance(
  currentBalance: number,
  cashoutAmount: number
): number {
  return currentBalance - cashoutAmount;
}

// ============= PROPERTY TESTS =============

describe('Feature: property-cashout', () => {
  describe('Property 1: Cashout Amount Validation', () => {
    /**
     * Property 1: Cashout Amount Validation
     * For any cashout amount and available balance, the system SHALL accept
     * the cashout if and only if the amount is >= $1.00 AND <= available balance.
     * 
     * Validates: Requirements 1.7, 2.1, 2.2
     */
    it('should accept amounts between $1.00 and available balance (inclusive)', () => {
      fc.assert(
        fc.property(
          // Generate available balance between $1 and $100,000
          fc.float({ min: 1, max: 100000, noNaN: true }),
          // Generate amount as a factor of balance (0 to 2x to test both valid and invalid)
          fc.float({ min: 0, max: 2, noNaN: true }),
          (availableBalance, factor) => {
            const amount = availableBalance * factor;
            const result = validateCashoutAmount(amount, availableBalance);
            
            const shouldBeValid = amount >= 1 && amount <= availableBalance;
            
            if (shouldBeValid) {
              expect(result.valid).toBe(true);
            } else {
              expect(result.valid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject amounts less than $1.00', () => {
      fc.assert(
        fc.property(
          // Generate amounts less than $1 (use Math.fround for 32-bit float)
          fc.float({ min: 0, max: Math.fround(0.99), noNaN: true }),
          // Generate any positive balance
          fc.float({ min: 1, max: 100000, noNaN: true }),
          (amount, availableBalance) => {
            const result = validateCashoutAmount(amount, availableBalance);
            
            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.message).toBe('Minimum payout is $1.00.');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject amounts exceeding available balance', () => {
      fc.assert(
        fc.property(
          // Generate available balance
          fc.float({ min: 1, max: 50000, noNaN: true }),
          // Generate excess amount (1.01x to 3x of balance) - use Math.fround
          fc.float({ min: Math.fround(1.01), max: 3, noNaN: true }),
          (availableBalance, factor) => {
            const amount = availableBalance * factor;
            const result = validateCashoutAmount(amount, availableBalance);
            
            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.message).toBe('Amount exceeds available balance.');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept exact balance amount', () => {
      fc.assert(
        fc.property(
          // Generate balance >= $1
          fc.float({ min: 1, max: 100000, noNaN: true }),
          (balance) => {
            const result = validateCashoutAmount(balance, balance);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept exactly $1.00 when balance allows', () => {
      fc.assert(
        fc.property(
          // Generate balance >= $1
          fc.float({ min: 1, max: 100000, noNaN: true }),
          (balance) => {
            const result = validateCashoutAmount(1, balance);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Wallet Balance Deduction Correctness', () => {
    /**
     * Property 2: Wallet Balance Deduction Correctness
     * For any successful cashout of amount X from a wallet with balance B,
     * the resulting wallet balance SHALL equal B - X exactly.
     * 
     * Validates: Requirements 2.3
     */
    it('should deduct exactly the cashout amount from balance', () => {
      fc.assert(
        fc.property(
          // Generate initial balance
          fc.float({ min: 1, max: 100000, noNaN: true }),
          // Generate valid cashout factor (between min $1 and full balance)
          fc.float({ min: 0, max: 1, noNaN: true }),
          (initialBalance, factor) => {
            // Ensure amount is at least $1
            const cashoutAmount = Math.max(1, initialBalance * factor);
            
            // Only test valid cashouts
            if (cashoutAmount <= initialBalance) {
              const newBalance = calculateNewBalance(initialBalance, cashoutAmount);
              
              // Use approximate equality for floating point
              expect(newBalance).toBeCloseTo(initialBalance - cashoutAmount, 10);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should result in zero balance when cashing out full amount', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 100000, noNaN: true }),
          (balance) => {
            const newBalance = calculateNewBalance(balance, balance);
            expect(newBalance).toBeCloseTo(0, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve remaining balance after partial cashout', () => {
      fc.assert(
        fc.property(
          // Generate initial balance
          fc.float({ min: 10, max: 100000, noNaN: true }),
          // Generate partial cashout (10% to 90% of balance) - use Math.fround
          fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
          (initialBalance, factor) => {
            const cashoutAmount = initialBalance * factor;
            const newBalance = calculateNewBalance(initialBalance, cashoutAmount);
            const expectedRemaining = initialBalance * (1 - factor);
            
            expect(newBalance).toBeCloseTo(expectedRemaining, 10);
            expect(newBalance).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// ============= METADATA BUILDING LOGIC (extracted for testing) =============

interface PropertyBankAccount {
  id: string;
  propertyId: string;
  last4: string;
  bankName: string | null;
}

/**
 * Builds payout metadata with destination info
 */
export function buildPayoutMetadata(
  options: { instant?: boolean; propertyId?: string },
  propertyName: string | null,
  propertyBankAccount: PropertyBankAccount | null
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    type: options.instant ? 'instant' : 'standard',
    requestedAt: new Date().toISOString(),
    destinationType: propertyBankAccount ? 'property_account' : 'default_account',
  };

  if (propertyBankAccount && options.propertyId) {
    metadata.destinationPropertyId = options.propertyId;
    metadata.destinationPropertyName = propertyName;
    metadata.destinationBankLast4 = propertyBankAccount.last4;
  }

  return metadata;
}

describe('Property 9: Payout Metadata Contains Destination Info', () => {
  /**
   * Property 9: Payout Metadata Contains Destination Info
   * For any successful payout to a property bank account, the Payout metadata
   * SHALL contain the destinationPropertyId, destinationPropertyName, and
   * destinationBankLast4 fields.
   * 
   * Validates: Requirements 5.6
   */
  it('should include all destination fields when property bank account is provided', () => {
    fc.assert(
      fc.property(
        // Generate property ID (UUID-like)
        fc.uuid(),
        // Generate property name
        fc.string({ minLength: 1, maxLength: 50 }),
        // Generate bank account last4 (4 digit string)
        fc.integer({ min: 0, max: 9999 }).map(n => n.toString().padStart(4, '0')),
        // Generate bank name
        fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
        (propertyId, propertyName, last4, bankName) => {
          const bankAccount: PropertyBankAccount = {
            id: 'bank-' + propertyId,
            propertyId,
            last4,
            bankName,
          };

          const metadata = buildPayoutMetadata(
            { propertyId },
            propertyName,
            bankAccount
          );

          // Verify all required fields are present
          expect(metadata.destinationPropertyId).toBe(propertyId);
          expect(metadata.destinationPropertyName).toBe(propertyName);
          expect(metadata.destinationBankLast4).toBe(last4);
          expect(metadata.destinationType).toBe('property_account');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set destinationType to default_account when no property bank account', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // instant flag
        (instant) => {
          const metadata = buildPayoutMetadata(
            { instant },
            null,
            null
          );

          expect(metadata.destinationType).toBe('default_account');
          expect(metadata.destinationPropertyId).toBeUndefined();
          expect(metadata.destinationPropertyName).toBeUndefined();
          expect(metadata.destinationBankLast4).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly set type based on instant flag', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (instant) => {
          const metadata = buildPayoutMetadata({ instant }, null, null);
          
          expect(metadata.type).toBe(instant ? 'instant' : 'standard');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always include requestedAt timestamp', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.option(fc.uuid(), { nil: undefined }),
        (instant, propertyId) => {
          const metadata = buildPayoutMetadata({ instant, propertyId }, null, null);
          
          expect(metadata.requestedAt).toBeDefined();
          expect(typeof metadata.requestedAt).toBe('string');
          // Verify it's a valid ISO date string
          expect(() => new Date(metadata.requestedAt as string)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============= ERROR HANDLING LOGIC (extracted for testing) =============

interface PayoutRecord {
  id: string;
  status: 'pending' | 'paid' | 'failed';
  stripeTransferId: string | null;
}

interface WalletState {
  availableBalance: number;
  pendingBalance: number;
}

/**
 * Simulates payout processing with success/failure handling
 */
export function processPayoutResult(
  payout: PayoutRecord,
  wallet: WalletState,
  cashoutAmount: number,
  stripeResult: { success: boolean; transferId?: string; error?: string }
): { payout: PayoutRecord; wallet: WalletState } {
  if (stripeResult.success && stripeResult.transferId) {
    // Success: update payout status and deduct from wallet
    return {
      payout: {
        ...payout,
        status: 'paid',
        stripeTransferId: stripeResult.transferId,
      },
      wallet: {
        ...wallet,
        availableBalance: wallet.availableBalance - cashoutAmount,
      },
    };
  } else {
    // Failure: update payout status but preserve wallet balance
    return {
      payout: {
        ...payout,
        status: 'failed',
        stripeTransferId: null,
      },
      wallet: {
        ...wallet,
        // Balance unchanged on failure
      },
    };
  }
}

describe('Property 7: Payout Status Updated on Success', () => {
  /**
   * Property 7: Payout Status Updated on Success
   * For any cashout where the Stripe transfer succeeds, the Payout record
   * status SHALL be updated to 'paid' and the stripeTransferId SHALL be recorded.
   * 
   * Validates: Requirements 5.4
   */
  it('should set status to paid and record transferId on success', () => {
    fc.assert(
      fc.property(
        // Generate payout ID
        fc.uuid(),
        // Generate transfer ID
        fc.string({ minLength: 10, maxLength: 30 }).map(s => 'tr_' + s),
        // Generate wallet balance
        fc.float({ min: 100, max: 100000, noNaN: true }),
        // Generate cashout amount (valid)
        fc.float({ min: 1, max: 100, noNaN: true }),
        (payoutId, transferId, balance, amount) => {
          const initialPayout: PayoutRecord = {
            id: payoutId,
            status: 'pending',
            stripeTransferId: null,
          };
          
          const initialWallet: WalletState = {
            availableBalance: balance,
            pendingBalance: 0,
          };
          
          const result = processPayoutResult(
            initialPayout,
            initialWallet,
            amount,
            { success: true, transferId }
          );
          
          // Verify payout status is 'paid'
          expect(result.payout.status).toBe('paid');
          
          // Verify transferId is recorded
          expect(result.payout.stripeTransferId).toBe(transferId);
          expect(result.payout.stripeTransferId).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should deduct amount from wallet on success', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 10, maxLength: 30 }).map(s => 'tr_' + s),
        fc.float({ min: 100, max: 100000, noNaN: true }),
        fc.float({ min: 1, max: 99, noNaN: true }),
        (payoutId, transferId, balance, amount) => {
          const initialPayout: PayoutRecord = {
            id: payoutId,
            status: 'pending',
            stripeTransferId: null,
          };
          
          const initialWallet: WalletState = {
            availableBalance: balance,
            pendingBalance: 0,
          };
          
          const result = processPayoutResult(
            initialPayout,
            initialWallet,
            amount,
            { success: true, transferId }
          );
          
          // Verify wallet balance is deducted
          expect(result.wallet.availableBalance).toBeCloseTo(balance - amount, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 8: Balance Preserved on Failure', () => {
  /**
   * Property 8: Balance Preserved on Failure
   * For any cashout where the Stripe transfer fails, the Payout record
   * status SHALL be updated to 'failed' AND the wallet balance SHALL
   * remain unchanged from before the cashout attempt.
   * 
   * Validates: Requirements 5.5
   */
  it('should set status to failed on Stripe error', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.float({ min: 100, max: 100000, noNaN: true }),
        fc.float({ min: 1, max: 100, noNaN: true }),
        fc.string({ minLength: 5, maxLength: 50 }), // error message
        (payoutId, balance, amount, errorMessage) => {
          const initialPayout: PayoutRecord = {
            id: payoutId,
            status: 'pending',
            stripeTransferId: null,
          };
          
          const initialWallet: WalletState = {
            availableBalance: balance,
            pendingBalance: 0,
          };
          
          const result = processPayoutResult(
            initialPayout,
            initialWallet,
            amount,
            { success: false, error: errorMessage }
          );
          
          // Verify payout status is 'failed'
          expect(result.payout.status).toBe('failed');
          
          // Verify transferId is null
          expect(result.payout.stripeTransferId).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve wallet balance on failure', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.float({ min: 100, max: 100000, noNaN: true }),
        fc.float({ min: 1, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 1000, noNaN: true }), // pending balance
        (payoutId, availableBalance, amount, pendingBalance) => {
          const initialPayout: PayoutRecord = {
            id: payoutId,
            status: 'pending',
            stripeTransferId: null,
          };
          
          const initialWallet: WalletState = {
            availableBalance,
            pendingBalance,
          };
          
          const result = processPayoutResult(
            initialPayout,
            initialWallet,
            amount,
            { success: false, error: 'Stripe error' }
          );
          
          // Verify wallet balance is UNCHANGED
          expect(result.wallet.availableBalance).toBe(availableBalance);
          expect(result.wallet.pendingBalance).toBe(pendingBalance);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle various Stripe error types consistently', () => {
    const errorTypes = [
      'insufficient_funds',
      'invalid_destination',
      'rate_limit_exceeded',
      'network_error',
      'authentication_error',
    ];
    
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.float({ min: 100, max: 100000, noNaN: true }),
        fc.float({ min: 1, max: 100, noNaN: true }),
        fc.constantFrom(...errorTypes),
        (payoutId, balance, amount, errorType) => {
          const initialPayout: PayoutRecord = {
            id: payoutId,
            status: 'pending',
            stripeTransferId: null,
          };
          
          const initialWallet: WalletState = {
            availableBalance: balance,
            pendingBalance: 0,
          };
          
          const result = processPayoutResult(
            initialPayout,
            initialWallet,
            amount,
            { success: false, error: errorType }
          );
          
          // All error types should result in same behavior
          expect(result.payout.status).toBe('failed');
          expect(result.wallet.availableBalance).toBe(balance);
        }
      ),
      { numRuns: 100 }
    );
  });
});
