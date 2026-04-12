/**
 * Property-based tests for EvictionService
 * Feature: tenant-lifecycle-management
 */

import * as fc from 'fast-check';
import {
  NoticeType,
  NOTICE_DAYS,
  calculateDeadlineDate,
  isValidStatusTransition,
  EvictionNoticeStatus,
  EVICTION_STATUS_FLOW,
} from '@/types/tenant-lifecycle';

describe('EvictionService', () => {
  /**
   * Property 1: Eviction Notice Deadline Calculation
   * For any eviction notice with a valid notice type (3-day, 7-day, or 30-day) 
   * and serve date, the calculated deadline date SHALL equal the serve date 
   * plus the corresponding number of days.
   * 
   * Validates: Requirements 1.5
   */
  describe('Property 1: Eviction Notice Deadline Calculation', () => {
    const noticeTypes: NoticeType[] = ['3-day', '7-day', '30-day'];

    it('should calculate deadline as serve_date + notice_days for all notice types', () => {
      fc.assert(
        fc.property(
          // Generate a random date within a reasonable range
          fc.date({
            min: new Date('2020-01-01'),
            max: new Date('2030-12-31'),
          }),
          // Generate a random notice type
          fc.constantFrom(...noticeTypes),
          (serveDate, noticeType) => {
            const deadline = calculateDeadlineDate(serveDate, noticeType);
            const expectedDays = NOTICE_DAYS[noticeType];
            
            // Calculate expected deadline
            const expectedDeadline = new Date(serveDate);
            expectedDeadline.setDate(expectedDeadline.getDate() + expectedDays);
            
            // Verify the deadline matches
            expect(deadline.getTime()).toBe(expectedDeadline.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always produce a deadline after the serve date', () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date('2020-01-01'),
            max: new Date('2030-12-31'),
          }),
          fc.constantFrom(...noticeTypes),
          (serveDate, noticeType) => {
            // Skip invalid dates
            if (isNaN(serveDate.getTime())) return true;
            
            const deadline = calculateDeadlineDate(serveDate, noticeType);
            expect(deadline.getTime()).toBeGreaterThan(serveDate.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce deadline exactly N days after serve date', () => {
      fc.assert(
        fc.property(
          fc.date({
            min: new Date('2020-01-01'),
            max: new Date('2030-12-31'),
          }),
          fc.constantFrom(...noticeTypes),
          (serveDate, noticeType) => {
            const deadline = calculateDeadlineDate(serveDate, noticeType);
            const expectedDays = NOTICE_DAYS[noticeType];
            
            // Calculate difference in days using date comparison (ignoring time)
            const serveDateOnly = new Date(serveDate.getFullYear(), serveDate.getMonth(), serveDate.getDate());
            const deadlineDateOnly = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
            const diffTime = deadlineDateOnly.getTime() - serveDateOnly.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            expect(diffDays).toBe(expectedDays);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Specific examples for edge cases
    it('should handle month boundaries correctly', () => {
      // 3-day notice at end of January (using local date to avoid timezone issues)
      const jan31 = new Date(2024, 0, 31); // January 31, 2024
      const deadline3Day = calculateDeadlineDate(jan31, '3-day');
      expect(deadline3Day.getMonth()).toBe(1); // February
      expect(deadline3Day.getDate()).toBe(3);

      // 30-day notice at end of January
      const deadline30Day = calculateDeadlineDate(jan31, '30-day');
      expect(deadline30Day.getMonth()).toBe(2); // March
      expect(deadline30Day.getDate()).toBe(1);
    });

    it('should handle year boundaries correctly', () => {
      const dec30 = new Date(2024, 11, 30); // December 30, 2024
      const deadline = calculateDeadlineDate(dec30, '7-day');
      expect(deadline.getFullYear()).toBe(2025);
      expect(deadline.getMonth()).toBe(0); // January
      expect(deadline.getDate()).toBe(6);
    });

    it('should handle leap years correctly', () => {
      const feb28_2024 = new Date(2024, 1, 28); // February 28, 2024 (leap year)
      const deadline = calculateDeadlineDate(feb28_2024, '3-day');
      expect(deadline.getMonth()).toBe(2); // March
      expect(deadline.getDate()).toBe(2);
    });
  });

  /**
   * Property 17: Eviction Notice State Machine
   * For any eviction notice, status transitions SHALL only follow valid paths:
   * served → cure_period → (cured | expired) → filed_with_court → completed
   * 
   * Validates: Requirements 9.1
   */
  describe('Property 17: Eviction Notice State Machine', () => {
    const allStatuses: EvictionNoticeStatus[] = [
      'served',
      'cure_period',
      'cured',
      'expired',
      'filed_with_court',
      'completed',
    ];

    it('should only allow valid state transitions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...allStatuses),
          fc.constantFrom(...allStatuses),
          (currentStatus, newStatus) => {
            const isValid = isValidStatusTransition(currentStatus, newStatus);
            const expectedValidTransitions = EVICTION_STATUS_FLOW[currentStatus] || [];
            
            if (expectedValidTransitions.includes(newStatus)) {
              expect(isValid).toBe(true);
            } else {
              expect(isValid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not allow transitions from terminal states', () => {
      const terminalStates: EvictionNoticeStatus[] = ['cured', 'completed'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...terminalStates),
          fc.constantFrom(...allStatuses),
          (terminalStatus, anyStatus) => {
            const isValid = isValidStatusTransition(terminalStatus, anyStatus);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow served to transition to cure_period, cured, or expired', () => {
      expect(isValidStatusTransition('served', 'cure_period')).toBe(true);
      expect(isValidStatusTransition('served', 'cured')).toBe(true);
      expect(isValidStatusTransition('served', 'expired')).toBe(true);
      expect(isValidStatusTransition('served', 'filed_with_court')).toBe(false);
      expect(isValidStatusTransition('served', 'completed')).toBe(false);
    });

    it('should only allow expired to transition to filed_with_court', () => {
      expect(isValidStatusTransition('expired', 'filed_with_court')).toBe(true);
      expect(isValidStatusTransition('expired', 'served')).toBe(false);
      expect(isValidStatusTransition('expired', 'cured')).toBe(false);
      expect(isValidStatusTransition('expired', 'completed')).toBe(false);
    });

    it('should only allow filed_with_court to transition to completed', () => {
      expect(isValidStatusTransition('filed_with_court', 'completed')).toBe(true);
      expect(isValidStatusTransition('filed_with_court', 'served')).toBe(false);
      expect(isValidStatusTransition('filed_with_court', 'cured')).toBe(false);
      expect(isValidStatusTransition('filed_with_court', 'expired')).toBe(false);
    });
  });
});
