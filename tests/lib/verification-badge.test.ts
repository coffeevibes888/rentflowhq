/**
 * Property-based tests for Verification Badge Display
 * Feature: contractor-marketplace-enhancement, Property 1: Verification Badge Display Consistency
 * 
 * For any contractor profile and any verification type (license, insurance, background check, identity),
 * the corresponding badge SHALL be displayed if and only if the verification is valid AND not expired.
 * 
 * Validates: Requirements 1.2, 1.3, 2.2, 2.4, 3.2, 3.3, 4.2
 */

import * as fc from 'fast-check';
import {
  VerificationBadgeService,
  VerificationStatus,
} from '@/lib/services/verification-badge';

const badgeService = new VerificationBadgeService();

describe('VerificationBadgeService', () => {
  /**
   * Property 1: Verification Badge Display Consistency
   * 
   * For any contractor profile and any verification type (license, insurance, background check, identity),
   * the corresponding badge SHALL be displayed if and only if the verification is valid AND not expired.
   */
  describe('Property 1: Verification Badge Display Consistency', () => {
    /**
     * Test: License badge is shown if and only if license is verified and not expired
     */
    it('should show license badge if and only if verified and not expired', () => {
      fc.assert(
        fc.property(
          // Generate verification date (can be null or a past date)
          fc.option(fc.date({ max: new Date() })),
          // Generate expiration date (can be null or future/past date)
          fc.option(fc.date()),
          // Current date for testing
          fc.date(),
          (licenseVerifiedAt, licenseExpiresAt, currentDate) => {
            const status: VerificationStatus = {
              licenseVerifiedAt,
              licenseExpiresAt,
              insuranceCertificateUrl: null,
              insuranceExpiry: null,
              backgroundCheckDate: null,
              backgroundCheckExpires: null,
              identityVerifiedAt: null,
            };

            const display = badgeService.getBadgeDisplay(status, currentDate);

            // Badge should be shown if:
            // 1. License is verified (has verifiedAt date)
            // 2. Either no expiration OR expiration is in the future
            const shouldShow =
              licenseVerifiedAt !== null &&
              (licenseExpiresAt === null || licenseExpiresAt > currentDate);

            expect(display.showLicenseBadge).toBe(shouldShow);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Insurance badge is shown if and only if certificate exists and not expired
     */
    it('should show insurance badge if and only if certificate exists and not expired', () => {
      fc.assert(
        fc.property(
          // Generate certificate URL (can be null or a string)
          fc.option(fc.webUrl()),
          // Generate expiration date (can be null or future/past date)
          fc.option(fc.date()),
          // Current date for testing
          fc.date(),
          (insuranceCertificateUrl, insuranceExpiry, currentDate) => {
            const status: VerificationStatus = {
              licenseVerifiedAt: null,
              licenseExpiresAt: null,
              insuranceCertificateUrl,
              insuranceExpiry,
              backgroundCheckDate: null,
              backgroundCheckExpires: null,
              identityVerifiedAt: null,
            };

            const display = badgeService.getBadgeDisplay(status, currentDate);

            // Badge should be shown if:
            // 1. Certificate exists
            // 2. Either no expiration OR expiration is in the future
            const shouldShow =
              insuranceCertificateUrl !== null &&
              (insuranceExpiry === null || insuranceExpiry > currentDate);

            expect(display.showInsuranceBadge).toBe(shouldShow);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Background check badge is shown if and only if check is completed and not expired
     */
    it('should show background check badge if and only if completed and not expired', () => {
      fc.assert(
        fc.property(
          // Generate check date (can be null or a past date)
          fc.option(fc.date({ max: new Date() })),
          // Generate expiration date (can be null or future/past date)
          fc.option(fc.date()),
          // Current date for testing
          fc.date(),
          (backgroundCheckDate, backgroundCheckExpires, currentDate) => {
            const status: VerificationStatus = {
              licenseVerifiedAt: null,
              licenseExpiresAt: null,
              insuranceCertificateUrl: null,
              insuranceExpiry: null,
              backgroundCheckDate,
              backgroundCheckExpires,
              identityVerifiedAt: null,
            };

            const display = badgeService.getBadgeDisplay(status, currentDate);

            // Badge should be shown if:
            // 1. Background check is completed (has check date)
            // 2. Either no expiration OR expiration is in the future
            const shouldShow =
              backgroundCheckDate !== null &&
              (backgroundCheckExpires === null ||
                backgroundCheckExpires > currentDate);

            expect(display.showBackgroundCheckBadge).toBe(shouldShow);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Identity badge is shown if and only if identity is verified (never expires)
     */
    it('should show identity badge if and only if identity is verified', () => {
      fc.assert(
        fc.property(
          // Generate verification date (can be null or a past date)
          fc.option(fc.date({ max: new Date() })),
          // Current date for testing (doesn't matter for identity)
          fc.date(),
          (identityVerifiedAt, currentDate) => {
            const status: VerificationStatus = {
              licenseVerifiedAt: null,
              licenseExpiresAt: null,
              insuranceCertificateUrl: null,
              insuranceExpiry: null,
              backgroundCheckDate: null,
              backgroundCheckExpires: null,
              identityVerifiedAt,
            };

            const display = badgeService.getBadgeDisplay(status, currentDate);

            // Badge should be shown if identity is verified
            // Identity verification never expires
            const shouldShow = identityVerifiedAt !== null;

            expect(display.showIdentityBadge).toBe(shouldShow);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Multiple badges can be shown simultaneously
     */
    it('should show multiple badges when multiple verifications are valid', () => {
      fc.assert(
        fc.property(
          // Generate all verification dates
          fc.option(fc.date({ max: new Date() })),
          fc.option(fc.webUrl()),
          fc.option(fc.date({ max: new Date() })),
          fc.option(fc.date({ max: new Date() })),
          // Generate future expiration dates to ensure valid
          fc.date({ min: new Date() }),
          (
            licenseVerifiedAt,
            insuranceCertificateUrl,
            backgroundCheckDate,
            identityVerifiedAt,
            futureDate
          ) => {
            const currentDate = new Date();
            const status: VerificationStatus = {
              licenseVerifiedAt,
              licenseExpiresAt: futureDate,
              insuranceCertificateUrl,
              insuranceExpiry: futureDate,
              backgroundCheckDate,
              backgroundCheckExpires: futureDate,
              identityVerifiedAt,
            };

            const display = badgeService.getBadgeDisplay(status, currentDate);
            const activeBadges = badgeService.getActiveBadges(status, currentDate);

            // Count how many verifications are valid
            // A verification is valid if it has a verified date AND (no expiration OR expiration is in future)
            let expectedCount = 0;
            if (licenseVerifiedAt && futureDate > currentDate) expectedCount++;
            if (insuranceCertificateUrl && futureDate > currentDate) expectedCount++;
            if (backgroundCheckDate && futureDate > currentDate) expectedCount++;
            if (identityVerifiedAt) expectedCount++; // Identity doesn't expire

            // Active badges count should match valid verifications
            expect(activeBadges.length).toBe(expectedCount);

            // Each badge display should match verification status
            expect(display.showLicenseBadge).toBe(
              licenseVerifiedAt !== null && futureDate > currentDate
            );
            expect(display.showInsuranceBadge).toBe(
              insuranceCertificateUrl !== null && futureDate > currentDate
            );
            expect(display.showBackgroundCheckBadge).toBe(
              backgroundCheckDate !== null && futureDate > currentDate
            );
            expect(display.showIdentityBadge).toBe(identityVerifiedAt !== null);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: No badges shown when nothing is verified
     */
    it('should show no badges when nothing is verified', () => {
      fc.assert(
        fc.property(fc.date(), (currentDate) => {
          const status: VerificationStatus = {
            licenseVerifiedAt: null,
            licenseExpiresAt: null,
            insuranceCertificateUrl: null,
            insuranceExpiry: null,
            backgroundCheckDate: null,
            backgroundCheckExpires: null,
            identityVerifiedAt: null,
          };

          const display = badgeService.getBadgeDisplay(status, currentDate);
          const activeBadges = badgeService.getActiveBadges(status, currentDate);

          expect(display.showLicenseBadge).toBe(false);
          expect(display.showInsuranceBadge).toBe(false);
          expect(display.showBackgroundCheckBadge).toBe(false);
          expect(display.showIdentityBadge).toBe(false);
          expect(activeBadges.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Expired verifications do not show badges
     */
    it('should not show badges for expired verifications', () => {
      fc.assert(
        fc.property(
          // Generate past dates for verification
          fc.date({ max: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }),
          // Generate past dates for expiration
          fc.date({
            min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            max: new Date(Date.now() - 1),
          }),
          (verifiedDate, expiredDate) => {
            const currentDate = new Date();
            const status: VerificationStatus = {
              licenseVerifiedAt: verifiedDate,
              licenseExpiresAt: expiredDate,
              insuranceCertificateUrl: 'https://example.com/cert.pdf',
              insuranceExpiry: expiredDate,
              backgroundCheckDate: verifiedDate,
              backgroundCheckExpires: expiredDate,
              identityVerifiedAt: verifiedDate, // Identity doesn't expire
            };

            const display = badgeService.getBadgeDisplay(status, currentDate);

            // All badges with expiration should be hidden
            expect(display.showLicenseBadge).toBe(false);
            expect(display.showInsuranceBadge).toBe(false);
            expect(display.showBackgroundCheckBadge).toBe(false);
            
            // Identity badge should still show (doesn't expire)
            expect(display.showIdentityBadge).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Badge display is consistent across multiple calls with same data
     */
    it('should return consistent results for the same input', () => {
      fc.assert(
        fc.property(
          fc.option(fc.date({ max: new Date() })),
          fc.option(fc.date()),
          fc.option(fc.webUrl()),
          fc.option(fc.date()),
          fc.option(fc.date({ max: new Date() })),
          fc.option(fc.date()),
          fc.option(fc.date({ max: new Date() })),
          fc.date(),
          (
            licenseVerifiedAt,
            licenseExpiresAt,
            insuranceCertificateUrl,
            insuranceExpiry,
            backgroundCheckDate,
            backgroundCheckExpires,
            identityVerifiedAt,
            currentDate
          ) => {
            const status: VerificationStatus = {
              licenseVerifiedAt,
              licenseExpiresAt,
              insuranceCertificateUrl,
              insuranceExpiry,
              backgroundCheckDate,
              backgroundCheckExpires,
              identityVerifiedAt,
            };

            // Call multiple times with same data
            const display1 = badgeService.getBadgeDisplay(status, currentDate);
            const display2 = badgeService.getBadgeDisplay(status, currentDate);
            const display3 = badgeService.getBadgeDisplay(status, currentDate);

            // All calls should return identical results
            expect(display1).toEqual(display2);
            expect(display2).toEqual(display3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
