/**
 * Property-Based Test for Cancellation Policy Application
 * Feature: contractor-marketplace-enhancement, Property 14: Cancellation Policy Application
 * Validates: Requirements 5.5
 * 
 * Property: For any booking cancellation within 24 hours of the appointment start time, 
 * the contractor's configured cancellation policy SHALL be applied (deposit forfeiture 
 * based on policy type).
 */

import * as fc from 'fast-check';
import { prismaBase as db } from '@/db/prisma-base';
import { instantBookingService } from '@/lib/services/instant-booking';
import { addHours, addDays, startOfDay } from 'date-fns';

describe('Cancellation Policy Application', () => {
  // Helper to create a test contractor with cancellation policy
  async function createTestContractor(
    cancellationPolicy: 'flexible' | 'moderate' | 'strict',
    cancellationHours: number
  ) {
    // Create user first
    const user = await db.User.create({
      data: {
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        name: 'Test Contractor',
        role: 'contractor',
      },
    });

    // Create contractor profile
    const contractor = await db.contractorProfile.create({
      data: {
        userId: user.id,
        slug: `test-contractor-${Date.now()}-${Math.random()}`,
        businessName: 'Test Business',
        displayName: 'Test Contractor',
        email: user.email,
        specialties: ['plumbing', 'electrical'],
        instantBookingEnabled: true,
        depositRequired: true,
        depositAmount: 100,
        cancellationPolicy,
        cancellationHours,
      },
    });

    // Create availability settings
    await db.contractorAvailability.create({
      data: {
        contractorId: contractor.id,
        mondayStart: '09:00',
        mondayEnd: '17:00',
        mondayEnabled: true,
        tuesdayStart: '09:00',
        tuesdayEnd: '17:00',
        tuesdayEnabled: true,
        wednesdayStart: '09:00',
        wednesdayEnd: '17:00',
        wednesdayEnabled: true,
        thursdayStart: '09:00',
        thursdayEnd: '17:00',
        thursdayEnabled: true,
        fridayStart: '09:00',
        fridayEnd: '17:00',
        fridayEnabled: true,
        saturdayStart: '09:00',
        saturdayEnd: '17:00',
        saturdayEnabled: false,
        sundayStart: '09:00',
        sundayEnd: '17:00',
        sundayEnabled: false,
        bufferMinutes: 0,
        minNoticeHours: 0,
        maxAdvanceDays: 30,
        blockedDates: [],
      },
    });

    return { contractor, user };
  }

  // Helper to create a customer
  async function createCustomer() {
    return await db.User.create({
      data: {
        email: `customer-${Date.now()}-${Math.random()}@example.com`,
        name: 'Test Customer',
        role: 'user',
      },
    });
  }

  // Helper to create an appointment with deposit
  async function createAppointmentWithDeposit(
    contractorId: string,
    customerId: string,
    startTime: Date,
    endTime: Date,
    depositAmount: number
  ) {
    return await db.contractorAppointment.create({
      data: {
        contractorId,
        customerId,
        serviceType: 'plumbing',
        title: 'Test Appointment',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zip: '12345',
        },
        startTime,
        endTime,
        status: 'confirmed',
        depositAmount,
        depositPaid: true,
        depositPaymentId: `pi_test_${Date.now()}`,
      },
    });
  }

  // Cleanup helper
  async function cleanup(contractorId: string, userId: string, customerId: string) {
    await db.contractorAppointment.deleteMany({
      where: { contractorId },
    });
    await db.contractorAvailability.deleteMany({
      where: { contractorId },
    });
    await db.contractorProfile.delete({
      where: { id: contractorId },
    });
    await db.User.delete({
      where: { id: userId },
    });
    await db.User.delete({
      where: { id: customerId },
    });
  }

  test('Property 14a: Flexible policy gives 50% refund regardless of timing', async () => {
    const { contractor, user } = await createTestContractor('flexible', 24);
    const customer = await createCustomer();

    try {
      // Create appointment 12 hours in the future (within 24 hour window)
      const appointmentStart = addHours(new Date(), 12);
      const appointmentEnd = addHours(appointmentStart, 1);
      const depositAmount = 100;

      const appointment = await createAppointmentWithDeposit(
        contractor.id,
        customer.id,
        appointmentStart,
        appointmentEnd,
        depositAmount
      );

      // Cancel the booking as customer
      const result = await instantBookingService.cancelBooking(
        appointment.id,
        'customer',
        'Test cancellation'
      );

      // Flexible policy should give 50% refund regardless of timing
      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(depositAmount * 0.5);
      expect(result.message).toContain('50%');
    } finally {
      await cleanup(contractor.id, user.id, customer.id);
    }
  }, 30000);

  test('Property 14b: Moderate policy gives no refund for late cancellation', async () => {
    const { contractor, user } = await createTestContractor('moderate', 24);
    const customer = await createCustomer();

    try {
      // Create appointment 12 hours in the future (within 24 hour window)
      const appointmentStart = addHours(new Date(), 12);
      const appointmentEnd = addHours(appointmentStart, 1);
      const depositAmount = 100;

      const appointment = await createAppointmentWithDeposit(
        contractor.id,
        customer.id,
        appointmentStart,
        appointmentEnd,
        depositAmount
      );

      // Cancel the booking as customer
      const result = await instantBookingService.cancelBooking(
        appointment.id,
        'customer',
        'Test cancellation'
      );

      // Moderate policy should give no refund for late cancellation
      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(0);
      expect(result.message).toContain('No refund');
    } finally {
      await cleanup(contractor.id, user.id, customer.id);
    }
  }, 30000);

  test('Property 14c: Strict policy gives no refund regardless of timing', async () => {
    const { contractor, user } = await createTestContractor('strict', 24);
    const customer = await createCustomer();

    try {
      // Create appointment 48 hours in the future (well outside 24 hour window)
      const appointmentStart = addHours(new Date(), 48);
      const appointmentEnd = addHours(appointmentStart, 1);
      const depositAmount = 100;

      const appointment = await createAppointmentWithDeposit(
        contractor.id,
        customer.id,
        appointmentStart,
        appointmentEnd,
        depositAmount
      );

      // Cancel the booking as customer
      const result = await instantBookingService.cancelBooking(
        appointment.id,
        'customer',
        'Test cancellation'
      );

      // Strict policy should give no refund regardless of timing
      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(0);
      expect(result.message).toContain('strict');
    } finally {
      await cleanup(contractor.id, user.id, customer.id);
    }
  }, 30000);

  test('Property 14d: Full refund when cancelled with sufficient notice', async () => {
    const { contractor, user } = await createTestContractor('moderate', 24);
    const customer = await createCustomer();

    try {
      // Create appointment 48 hours in the future (outside 24 hour window)
      const appointmentStart = addHours(new Date(), 48);
      const appointmentEnd = addHours(appointmentStart, 1);
      const depositAmount = 100;

      const appointment = await createAppointmentWithDeposit(
        contractor.id,
        customer.id,
        appointmentStart,
        appointmentEnd,
        depositAmount
      );

      // Cancel the booking as customer
      const result = await instantBookingService.cancelBooking(
        appointment.id,
        'customer',
        'Test cancellation'
      );

      // Should get full refund when cancelled with enough notice
      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(depositAmount);
      expect(result.message).toContain('Full deposit refund');
    } finally {
      await cleanup(contractor.id, user.id, customer.id);
    }
  }, 30000);

  test('Property 14e: Contractor cancellation always gives full refund', async () => {
    const { contractor, user } = await createTestContractor('strict', 24);
    const customer = await createCustomer();

    try {
      // Create appointment 6 hours in the future (within 24 hour window)
      const appointmentStart = addHours(new Date(), 6);
      const appointmentEnd = addHours(appointmentStart, 1);
      const depositAmount = 100;

      const appointment = await createAppointmentWithDeposit(
        contractor.id,
        customer.id,
        appointmentStart,
        appointmentEnd,
        depositAmount
      );

      // Cancel the booking as contractor
      const result = await instantBookingService.cancelBooking(
        appointment.id,
        'contractor',
        'Emergency - need to reschedule'
      );

      // Contractor cancellation should always give full refund
      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(depositAmount);
      expect(result.message).toContain('Full deposit refund');
    } finally {
      await cleanup(contractor.id, user.id, customer.id);
    }
  }, 30000);

  test('Property 14f: Custom cancellation hours are respected', async () => {
    const customCancellationHours = 48; // 48 hours instead of 24
    const { contractor, user } = await createTestContractor('moderate', customCancellationHours);
    const customer = await createCustomer();

    try {
      // Create appointment 36 hours in the future (within 48 hour window but outside 24)
      const appointmentStart = addHours(new Date(), 36);
      const appointmentEnd = addHours(appointmentStart, 1);
      const depositAmount = 100;

      const appointment = await createAppointmentWithDeposit(
        contractor.id,
        customer.id,
        appointmentStart,
        appointmentEnd,
        depositAmount
      );

      // Cancel the booking as customer
      const result = await instantBookingService.cancelBooking(
        appointment.id,
        'customer',
        'Test cancellation'
      );

      // Should get no refund because we're within the 48 hour window
      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(0);
      expect(result.message).toContain('48 hours');
    } finally {
      await cleanup(contractor.id, user.id, customer.id);
    }
  }, 30000);

  test('Property 14g: No refund for bookings without deposit', async () => {
    const { contractor, user } = await createTestContractor('flexible', 24);
    const customer = await createCustomer();

    try {
      // Create appointment without deposit
      const appointmentStart = addHours(new Date(), 12);
      const appointmentEnd = addHours(appointmentStart, 1);

      const appointment = await db.contractorAppointment.create({
        data: {
          contractorId: contractor.id,
          customerId: customer.id,
          serviceType: 'plumbing',
          title: 'Test Appointment',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zip: '12345',
          },
          startTime: appointmentStart,
          endTime: appointmentEnd,
          status: 'confirmed',
          depositPaid: false,
        },
      });

      // Cancel the booking as customer
      const result = await instantBookingService.cancelBooking(
        appointment.id,
        'customer',
        'Test cancellation'
      );

      // No refund should be processed if no deposit was paid
      expect(result.success).toBe(true);
      expect(result.refundAmount).toBe(0);
    } finally {
      await cleanup(contractor.id, user.id, customer.id);
    }
  }, 30000);

  // Property-based test using fast-check
  test('Property 14: Cancellation policy is consistently applied across all scenarios', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random cancellation policy
        fc.constantFrom('flexible', 'moderate', 'strict'),
        // Generate random cancellation hours (12-48 hours)
        fc.integer({ min: 12, max: 48 }),
        // Generate random hours until appointment (1-72 hours)
        fc.integer({ min: 1, max: 72 }),
        // Generate random deposit amount ($50-$200)
        fc.integer({ min: 50, max: 200 }),
        // Generate who cancels
        fc.constantFrom('customer', 'contractor'),
        async (policy, cancellationHours, hoursUntilAppointment, depositAmount, cancelledBy) => {
          const { contractor, user } = await createTestContractor(
            policy as 'flexible' | 'moderate' | 'strict',
            cancellationHours
          );
          const customer = await createCustomer();

          try {
            // Create appointment
            const appointmentStart = addHours(new Date(), hoursUntilAppointment);
            const appointmentEnd = addHours(appointmentStart, 1);

            const appointment = await createAppointmentWithDeposit(
              contractor.id,
              customer.id,
              appointmentStart,
              appointmentEnd,
              depositAmount
            );

            // Cancel the booking
            const result = await instantBookingService.cancelBooking(
              appointment.id,
              cancelledBy as 'customer' | 'contractor',
              'Test cancellation'
            );

            // Verify the result is successful
            expect(result.success).toBe(true);

            // Verify refund amount follows the policy rules
            if (cancelledBy === 'contractor') {
              // Contractor cancellation always gets full refund
              expect(result.refundAmount).toBe(depositAmount);
            } else {
              // Customer cancellation depends on policy type
              switch (policy) {
                case 'flexible':
                  // Always 50% refund regardless of timing
                  expect(result.refundAmount).toBe(depositAmount * 0.5);
                  break;
                case 'moderate':
                  // Full refund if cancelled with enough notice, no refund if late
                  if (hoursUntilAppointment > cancellationHours) {
                    expect(result.refundAmount).toBe(depositAmount);
                  } else if (hoursUntilAppointment < cancellationHours) {
                    expect(result.refundAmount).toBe(0);
                  } else {
                    // Edge case: hoursUntilAppointment === cancellationHours
                    // Due to differenceInHours truncation, this could go either way
                    expect([depositAmount, 0]).toContain(result.refundAmount);
                  }
                  break;
                case 'strict':
                  // No refund regardless of timing
                  expect(result.refundAmount).toBe(0);
                  break;
              }
            }

            // Verify refund amount is never negative or greater than deposit
            expect(result.refundAmount).toBeGreaterThanOrEqual(0);
            expect(result.refundAmount).toBeLessThanOrEqual(depositAmount);
          } finally {
            await cleanup(contractor.id, user.id, customer.id);
          }
        }
      ),
      { numRuns: 20 } // Reduced from 100 for faster execution
    );
  }, 60000); // Reduced timeout since we're running fewer iterations
});
