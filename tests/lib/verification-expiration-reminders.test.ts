/**
 * Property-based tests for Verification Expiration Reminders
 * Feature: contractor-marketplace-enhancement, Property 2: Verification Expiration Reminders
 * 
 * For any verification type with an expiration date, if the expiration is within the configured
 * reminder window (30 days for license/background, 14 days for insurance), a reminder notification
 * SHALL be queued.
 * 
 * Validates: Requirements 1.4, 2.3, 3.5
 */

import * as fc from 'fast-check';

/**
 * Service to check if verification expiration reminders should be sent
 */
export class VerificationExpirationService {
  /**
   * Check if a license expiration reminder should be sent
   * Requirement 1.4: Send reminder 30 days before license expiration
   */
  shouldSendLicenseReminder(
    licenseVerifiedAt: Date | null,
    licenseExpiresAt: Date | null,
    currentDate: Date
  ): boolean {
    if (!licenseVerifiedAt || !licenseExpiresAt) {
      return false;
    }

    // License must not be expired yet
    if (licenseExpiresAt <= currentDate) {
      return false;
    }

    // Calculate days until expiration
    const daysUntilExpiration = Math.ceil(
      (licenseExpiresAt.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send reminder if within 30 days
    return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
  }

  /**
   * Check if an insurance expiration reminder should be sent
   * Requirement 2.3: Send reminder 14 days before insurance expiration
   */
  shouldSendInsuranceReminder(
    insuranceCertificateUrl: string | null,
    insuranceExpiry: Date | null,
    currentDate: Date
  ): boolean {
    if (!insuranceCertificateUrl || !insuranceExpiry) {
      return false;
    }

    // Insurance must not be expired yet
    if (insuranceExpiry <= currentDate) {
      return false;
    }

    // Calculate days until expiration
    const daysUntilExpiration = Math.ceil(
      (insuranceExpiry.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send reminder if within 14 days
    return daysUntilExpiration > 0 && daysUntilExpiration <= 14;
  }

  /**
   * Check if a background check expiration reminder should be sent
   * Requirement 3.5: Send reminder 30 days before background check expiration
   */
  shouldSendBackgroundCheckReminder(
    backgroundCheckDate: Date | null,
    backgroundCheckExpires: Date | null,
    currentDate: Date
  ): boolean {
    if (!backgroundCheckDate || !backgroundCheckExpires) {
      return false;
    }

    // Background check must not be expired yet
    if (backgroundCheckExpires <= currentDate) {
      return false;
    }

    // Calculate days until expiration
    const daysUntilExpiration = Math.ceil(
      (backgroundCheckExpires.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send reminder if within 30 days
    return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
  }

  /**
   * Get all reminders that should be sent for a contractor
   */
  getRemindersToSend(
    licenseVerifiedAt: Date | null,
    licenseExpiresAt: Date | null,
    insuranceCertificateUrl: string | null,
    insuranceExpiry: Date | null,
    backgroundCheckDate: Date | null,
    backgroundCheckExpires: Date | null,
    currentDate: Date
  ): {
    license: boolean;
    insurance: boolean;
    backgroundCheck: boolean;
  } {
    return {
      license: this.shouldSendLicenseReminder(licenseVerifiedAt, licenseExpiresAt, currentDate),
      insurance: this.shouldSendInsuranceReminder(
        insuranceCertificateUrl,
        insuranceExpiry,
        currentDate
      ),
      backgroundCheck: this.shouldSendBackgroundCheckReminder(
        backgroundCheckDate,
        backgroundCheckExpires,
        currentDate
      ),
    };
  }
}

const expirationService = new VerificationExpirationService();

describe('VerificationExpirationService', () => {
  /**
   * Property 2: Verification Expiration Reminders
   * 
   * For any verification type with an expiration date, if the expiration is within the configured
   * reminder window (30 days for license/background, 14 days for insurance), a reminder notification
   * SHALL be queued.
   */
  describe('Property 2: Verification Expiration Reminders', () => {
    /**
     * Test: License reminder is sent if and only if expiration is within 30 days
     */
    it('should send license reminder if and only if expiration is within 30 days', () => {
      fc.assert(
        fc.property(
          // Generate verification date (past date)
          fc.date({ max: new Date() }),
          // Generate expiration date (any date)
          fc.date(),
          // Current date for testing
          fc.date(),
          (licenseVerifiedAt, licenseExpiresAt, currentDate) => {
            const shouldSend = expirationService.shouldSendLicenseReminder(
              licenseVerifiedAt,
              licenseExpiresAt,
              currentDate
            );

            // Calculate days until expiration
            const daysUntilExpiration = Math.ceil(
              (licenseExpiresAt.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Reminder should be sent if:
            // 1. License is verified
            // 2. License is not expired (expiration > current)
            // 3. Days until expiration is between 1 and 30
            const expectedSend =
              licenseVerifiedAt !== null &&
              licenseExpiresAt > currentDate &&
              daysUntilExpiration > 0 &&
              daysUntilExpiration <= 30;

            expect(shouldSend).toBe(expectedSend);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Insurance reminder is sent if and only if expiration is within 14 days
     */
    it('should send insurance reminder if and only if expiration is within 14 days', () => {
      fc.assert(
        fc.property(
          // Generate certificate URL
          fc.option(fc.webUrl()),
          // Generate expiration date (any date)
          fc.date(),
          // Current date for testing
          fc.date(),
          (insuranceCertificateUrl, insuranceExpiry, currentDate) => {
            const shouldSend = expirationService.shouldSendInsuranceReminder(
              insuranceCertificateUrl,
              insuranceExpiry,
              currentDate
            );

            // Calculate days until expiration
            const daysUntilExpiration = Math.ceil(
              (insuranceExpiry.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Reminder should be sent if:
            // 1. Certificate exists
            // 2. Insurance is not expired (expiration > current)
            // 3. Days until expiration is between 1 and 14
            const expectedSend =
              insuranceCertificateUrl !== null &&
              insuranceExpiry > currentDate &&
              daysUntilExpiration > 0 &&
              daysUntilExpiration <= 14;

            expect(shouldSend).toBe(expectedSend);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Background check reminder is sent if and only if expiration is within 30 days
     */
    it('should send background check reminder if and only if expiration is within 30 days', () => {
      fc.assert(
        fc.property(
          // Generate check date (past date)
          fc.date({ max: new Date() }),
          // Generate expiration date (any date)
          fc.date(),
          // Current date for testing
          fc.date(),
          (backgroundCheckDate, backgroundCheckExpires, currentDate) => {
            const shouldSend = expirationService.shouldSendBackgroundCheckReminder(
              backgroundCheckDate,
              backgroundCheckExpires,
              currentDate
            );

            // Calculate days until expiration
            const daysUntilExpiration = Math.ceil(
              (backgroundCheckExpires.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Reminder should be sent if:
            // 1. Background check is completed
            // 2. Background check is not expired (expiration > current)
            // 3. Days until expiration is between 1 and 30
            const expectedSend =
              backgroundCheckDate !== null &&
              backgroundCheckExpires > currentDate &&
              daysUntilExpiration > 0 &&
              daysUntilExpiration <= 30;

            expect(shouldSend).toBe(expectedSend);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: No reminder is sent for expired verifications
     */
    it('should not send reminders for already expired verifications', () => {
      fc.assert(
        fc.property(
          // Generate past dates for verification
          fc.date({ max: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }),
          // Generate past dates for expiration (already expired)
          fc.date({
            min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            max: new Date(Date.now() - 1),
          }),
          // Current date
          fc.constant(new Date()),
          (verificationDate, expirationDate, currentDate) => {
            // License reminder
            const licenseReminder = expirationService.shouldSendLicenseReminder(
              verificationDate,
              expirationDate,
              currentDate
            );
            expect(licenseReminder).toBe(false);

            // Insurance reminder
            const insuranceReminder = expirationService.shouldSendInsuranceReminder(
              'https://example.com/cert.pdf',
              expirationDate,
              currentDate
            );
            expect(insuranceReminder).toBe(false);

            // Background check reminder
            const backgroundReminder = expirationService.shouldSendBackgroundCheckReminder(
              verificationDate,
              expirationDate,
              currentDate
            );
            expect(backgroundReminder).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: No reminder is sent for verifications expiring far in the future
     */
    it('should not send reminders for verifications expiring beyond the reminder window', () => {
      fc.assert(
        fc.property(
          // Generate past dates for verification
          fc.date({ max: new Date() }),
          // Generate future dates beyond reminder window (> 30 days for license/background, > 14 days for insurance)
          fc.integer({ min: 31, max: 365 }),
          // Current date
          fc.constant(new Date()),
          (verificationDate, daysInFuture, currentDate) => {
            const expirationDate = new Date(currentDate);
            expirationDate.setDate(expirationDate.getDate() + daysInFuture);

            // License reminder (30 day window)
            const licenseReminder = expirationService.shouldSendLicenseReminder(
              verificationDate,
              expirationDate,
              currentDate
            );
            expect(licenseReminder).toBe(false);

            // Background check reminder (30 day window)
            const backgroundReminder = expirationService.shouldSendBackgroundCheckReminder(
              verificationDate,
              expirationDate,
              currentDate
            );
            expect(backgroundReminder).toBe(false);

            // Insurance reminder should also be false if > 14 days
            if (daysInFuture > 14) {
              const insuranceReminder = expirationService.shouldSendInsuranceReminder(
                'https://example.com/cert.pdf',
                expirationDate,
                currentDate
              );
              expect(insuranceReminder).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Reminder is sent for verifications expiring within the window
     */
    it('should send reminders for verifications expiring within the reminder window', () => {
      fc.assert(
        fc.property(
          // Generate past dates for verification
          fc.date({ max: new Date() }),
          // Generate days within license/background window (1-30 days)
          fc.integer({ min: 1, max: 30 }),
          // Current date
          fc.constant(new Date()),
          (verificationDate, daysInFuture, currentDate) => {
            const expirationDate = new Date(currentDate);
            expirationDate.setDate(expirationDate.getDate() + daysInFuture);

            // License reminder (30 day window)
            const licenseReminder = expirationService.shouldSendLicenseReminder(
              verificationDate,
              expirationDate,
              currentDate
            );
            expect(licenseReminder).toBe(true);

            // Background check reminder (30 day window)
            const backgroundReminder = expirationService.shouldSendBackgroundCheckReminder(
              verificationDate,
              expirationDate,
              currentDate
            );
            expect(backgroundReminder).toBe(true);

            // Insurance reminder (14 day window)
            if (daysInFuture <= 14) {
              const insuranceReminder = expirationService.shouldSendInsuranceReminder(
                'https://example.com/cert.pdf',
                expirationDate,
                currentDate
              );
              expect(insuranceReminder).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: No reminder is sent if verification data is missing
     */
    it('should not send reminders if verification data is missing', () => {
      fc.assert(
        fc.property(fc.date(), (currentDate) => {
          // License reminder with null data
          const licenseReminder1 = expirationService.shouldSendLicenseReminder(
            null,
            new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000),
            currentDate
          );
          expect(licenseReminder1).toBe(false);

          const licenseReminder2 = expirationService.shouldSendLicenseReminder(
            new Date(),
            null,
            currentDate
          );
          expect(licenseReminder2).toBe(false);

          // Insurance reminder with null data
          const insuranceReminder1 = expirationService.shouldSendInsuranceReminder(
            null,
            new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000),
            currentDate
          );
          expect(insuranceReminder1).toBe(false);

          const insuranceReminder2 = expirationService.shouldSendInsuranceReminder(
            'https://example.com/cert.pdf',
            null,
            currentDate
          );
          expect(insuranceReminder2).toBe(false);

          // Background check reminder with null data
          const backgroundReminder1 = expirationService.shouldSendBackgroundCheckReminder(
            null,
            new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000),
            currentDate
          );
          expect(backgroundReminder1).toBe(false);

          const backgroundReminder2 = expirationService.shouldSendBackgroundCheckReminder(
            new Date(),
            null,
            currentDate
          );
          expect(backgroundReminder2).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Multiple reminders can be sent simultaneously
     */
    it('should send multiple reminders if multiple verifications are expiring', () => {
      fc.assert(
        fc.property(
          // Generate past dates for verification
          fc.date({ max: new Date() }),
          // Generate days within windows
          fc.integer({ min: 1, max: 14 }), // Within both windows
          // Current date
          fc.constant(new Date()),
          (verificationDate, daysInFuture, currentDate) => {
            const expirationDate = new Date(currentDate);
            expirationDate.setDate(expirationDate.getDate() + daysInFuture);

            const reminders = expirationService.getRemindersToSend(
              verificationDate,
              expirationDate,
              'https://example.com/cert.pdf',
              expirationDate,
              verificationDate,
              expirationDate,
              currentDate
            );

            // All three should be true since daysInFuture is within all windows
            expect(reminders.license).toBe(true);
            expect(reminders.insurance).toBe(true);
            expect(reminders.backgroundCheck).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
