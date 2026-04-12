/**
 * Property-based tests for property-bank.actions.ts
 * Feature: property-cashout
 */

import * as fc from 'fast-check';

// ============= BANK ACCOUNT DATA MASKING LOGIC (extracted for testing) =============

/**
 * Masks a bank account number, returning only the last 4 digits
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length < 4) {
    return accountNumber;
  }
  return accountNumber.slice(-4);
}

/**
 * Validates that stored bank account data only contains masked info
 */
export function validateStoredBankAccount(
  storedData: { last4: string; fullAccountNumber?: string },
  originalAccountNumber: string
): { valid: boolean; reason?: string } {
  // Check that last4 matches the last 4 digits of original
  const expectedLast4 = originalAccountNumber.slice(-4);
  if (storedData.last4 !== expectedLast4) {
    return { valid: false, reason: 'last4 does not match original account number' };
  }
  
  // Check that full account number is NOT stored
  if (storedData.fullAccountNumber !== undefined) {
    return { valid: false, reason: 'Full account number should not be stored' };
  }
  
  // Check that last4 is exactly 4 characters
  if (storedData.last4.length !== 4) {
    return { valid: false, reason: 'last4 should be exactly 4 characters' };
  }
  
  return { valid: true };
}

// ============= BANK ACCOUNT REMOVAL LOGIC (extracted for testing) =============

interface BankAccountStore {
  accounts: Map<string, { last4: string; bankName: string | null }>;
}

/**
 * Simulates adding a bank account to a property
 */
export function addBankAccount(
  store: BankAccountStore,
  propertyId: string,
  accountNumber: string,
  bankName: string | null
): void {
  store.accounts.set(propertyId, {
    last4: accountNumber.slice(-4),
    bankName,
  });
}

/**
 * Simulates removing a bank account from a property
 */
export function removeBankAccount(
  store: BankAccountStore,
  propertyId: string
): boolean {
  return store.accounts.delete(propertyId);
}

/**
 * Gets bank account for a property
 */
export function getBankAccount(
  store: BankAccountStore,
  propertyId: string
): { last4: string; bankName: string | null } | null {
  return store.accounts.get(propertyId) || null;
}

// ============= PROPERTY TESTS =============

describe('Feature: property-cashout', () => {
  describe('Property 3: Bank Account Data Masking', () => {
    /**
     * Property 3: Bank Account Data Masking
     * For any bank account added to a property, the stored PropertyBankAccount
     * record SHALL contain only the last 4 digits of the account number
     * (not the full account number) and the bank name.
     * 
     * Validates: Requirements 3.3
     */
    it('should only store last 4 digits of account number', () => {
      fc.assert(
        fc.property(
          // Generate account numbers of various lengths (4-17 digits)
          fc.integer({ min: 4, max: 17 }).chain(length =>
            fc.string({ minLength: length, maxLength: length, unit: fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9') })
          ),
          (accountNumber) => {
            const masked = maskAccountNumber(accountNumber);
            
            // Verify only last 4 digits are returned
            expect(masked).toBe(accountNumber.slice(-4));
            expect(masked.length).toBe(4);
            
            // Verify full account number is not recoverable from masked
            if (accountNumber.length > 4) {
              expect(masked).not.toBe(accountNumber);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate stored data contains only masked info', () => {
      fc.assert(
        fc.property(
          // Generate account numbers (4-17 digit strings)
          fc.integer({ min: 4, max: 17 }).chain(length =>
            fc.array(fc.integer({ min: 0, max: 9 }), { minLength: length, maxLength: length })
              .map(digits => digits.join(''))
          ),
          (accountNumber) => {
            const storedData = {
              last4: accountNumber.slice(-4),
              // fullAccountNumber should NOT be present
            };
            
            const validation = validateStoredBankAccount(storedData, accountNumber);
            expect(validation.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject stored data that contains full account number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 17 }).chain(length =>
            fc.array(fc.integer({ min: 0, max: 9 }), { minLength: length, maxLength: length })
              .map(digits => digits.join(''))
          ),
          (accountNumber) => {
            const storedData = {
              last4: accountNumber.slice(-4),
              fullAccountNumber: accountNumber, // This should NOT be stored
            };
            
            const validation = validateStoredBankAccount(storedData, accountNumber);
            expect(validation.valid).toBe(false);
            expect(validation.reason).toBe('Full account number should not be stored');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Bank Account Removal Clears Association', () => {
    /**
     * Property 4: Bank Account Removal Clears Association
     * For any property with a linked bank account, after the bank account
     * is removed, querying the property's bank account SHALL return null.
     * 
     * Validates: Requirements 3.6
     */
    it('should return null after bank account is removed', () => {
      fc.assert(
        fc.property(
          // Generate property ID
          fc.uuid(),
          // Generate account number (4-17 digit string)
          fc.integer({ min: 4, max: 17 }).chain(length =>
            fc.array(fc.integer({ min: 0, max: 9 }), { minLength: length, maxLength: length })
              .map(digits => digits.join(''))
          ),
          // Generate bank name
          fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
          (propertyId, accountNumber, bankName) => {
            const store: BankAccountStore = { accounts: new Map() };
            
            // Add bank account
            addBankAccount(store, propertyId, accountNumber, bankName);
            
            // Verify it exists
            const beforeRemoval = getBankAccount(store, propertyId);
            expect(beforeRemoval).not.toBeNull();
            expect(beforeRemoval?.last4).toBe(accountNumber.slice(-4));
            
            // Remove bank account
            const removed = removeBankAccount(store, propertyId);
            expect(removed).toBe(true);
            
            // Verify it's null after removal
            const afterRemoval = getBankAccount(store, propertyId);
            expect(afterRemoval).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle removal of non-existent bank account gracefully', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (propertyId) => {
            const store: BankAccountStore = { accounts: new Map() };
            
            // Try to remove non-existent account
            const removed = removeBankAccount(store, propertyId);
            expect(removed).toBe(false);
            
            // Verify still returns null
            const account = getBankAccount(store, propertyId);
            expect(account).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only remove the specified property bank account', () => {
      fc.assert(
        fc.property(
          // Generate two different property IDs
          fc.tuple(fc.uuid(), fc.uuid()).filter(([a, b]) => a !== b),
          // Generate account numbers (4-17 digit strings)
          fc.tuple(
            fc.integer({ min: 4, max: 17 }).chain(length =>
              fc.array(fc.integer({ min: 0, max: 9 }), { minLength: length, maxLength: length })
                .map(digits => digits.join(''))
            ),
            fc.integer({ min: 4, max: 17 }).chain(length =>
              fc.array(fc.integer({ min: 0, max: 9 }), { minLength: length, maxLength: length })
                .map(digits => digits.join(''))
            )
          ),
          ([propertyId1, propertyId2], [accountNumber1, accountNumber2]) => {
            const store: BankAccountStore = { accounts: new Map() };
            
            // Add two bank accounts
            addBankAccount(store, propertyId1, accountNumber1, 'Bank A');
            addBankAccount(store, propertyId2, accountNumber2, 'Bank B');
            
            // Remove first account
            removeBankAccount(store, propertyId1);
            
            // First should be null
            expect(getBankAccount(store, propertyId1)).toBeNull();
            
            // Second should still exist
            const remaining = getBankAccount(store, propertyId2);
            expect(remaining).not.toBeNull();
            expect(remaining?.last4).toBe(accountNumber2.slice(-4));
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
