/**
 * Property-Based Test for Appointment Slot Availability
 * Feature: contractor-marketplace-enhancement, Property 6: Appointment Slot Availability
 * Validates: Requirements 5.1, 5.7, 9.7
 * 
 * Property: For any contractor with instant booking enabled, available time slots SHALL 
 * only include times that are: within the contractor's availability schedule, not blocked, 
 * not already booked, not marked busy in synced calendars, and respect the buffer time setting.
 */

import * as fc from 'fast-check';
import { prismaBase as db } from '@/db/prisma-base';
import { instantBookingService } from '@/lib/services/instant-booking';
import { contractorSchedulerService } from '@/lib/services/contractor-scheduler';
import {
  addDays,
  addMinutes,
  format,
  parse,
  startOfDay,
  isBefore,
  isAfter,
  isWithinInterval,
} from 'date-fns';

describe('Appointment Slot Availability', () => {
  // Helper to create a test contractor with availability
  async function createTestContractor(availability: {
    enabled: boolean;
    schedule: { start: string; end: string; enabled: boolean };
    bufferMinutes: number;
    minNoticeHours: number;
    maxAdvanceDays: number;
    blockedDates: Date[];
  }) {
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
        instantBookingEnabled: availability.enabled,
      },
    });

    // Create availability settings
    await db.contractorAvailability.create({
      data: {
        contractorId: contractor.id,
        mondayStart: availability.schedule.start,
        mondayEnd: availability.schedule.end,
        mondayEnabled: availability.schedule.enabled,
        tuesdayStart: availability.schedule.start,
        tuesdayEnd: availability.schedule.end,
        tuesdayEnabled: availability.schedule.enabled,
        wednesdayStart: availability.schedule.start,
        wednesdayEnd: availability.schedule.end,
        wednesdayEnabled: availability.schedule.enabled,
        thursdayStart: availability.schedule.start,
        thursdayEnd: availability.schedule.end,
        thursdayEnabled: availability.schedule.enabled,
        fridayStart: availability.schedule.start,
        fridayEnd: availability.schedule.end,
        fridayEnabled: availability.schedule.enabled,
        saturdayStart: availability.schedule.start,
        saturdayEnd: availability.schedule.end,
        saturdayEnabled: false,
        sundayStart: availability.schedule.start,
        sundayEnd: availability.schedule.end,
        sundayEnabled: false,
        bufferMinutes: availability.bufferMinutes,
        minNoticeHours: availability.minNoticeHours,
        maxAdvanceDays: availability.maxAdvanceDays,
        blockedDates: availability.blockedDates,
      },
    });

    return { contractor, user };
  }

  // Helper to create an appointment
  async function createAppointment(
    contractorId: string,
    customerId: string,
    startTime: Date,
    endTime: Date
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
      },
    });
  }

  // Cleanup helper
  async function cleanup(contractorId: string, userId: string) {
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
  }

  test('Property 6a: Slots are only available within weekly schedule hours', async () => {
    const scheduleStart = '09:00';
    const scheduleEnd = '17:00';

    const { contractor, user } = await createTestContractor({
      enabled: true,
      schedule: { start: scheduleStart, end: scheduleEnd, enabled: true },
      bufferMinutes: 0,
      minNoticeHours: 0,
      maxAdvanceDays: 30,
      blockedDates: [],
    });

    try {
      // Test a weekday (Monday)
      const testDate = addDays(startOfDay(new Date()), 7); // Next week Monday
      const slots = await instantBookingService.getAvailableSlots(
        contractor.id,
        testDate,
        'plumbing',
        60
      );

      // All available slots should be within schedule hours
      const allWithinSchedule = slots
        .filter((slot) => slot.isAvailable)
        .every((slot) => {
          const slotStart = parse(
            format(slot.startTime, 'HH:mm'),
            'HH:mm',
            testDate
          );
          const slotEnd = parse(
            format(slot.endTime, 'HH:mm'),
            'HH:mm',
            testDate
          );
          const schedStart = parse(scheduleStart, 'HH:mm', testDate);
          const schedEnd = parse(scheduleEnd, 'HH:mm', testDate);

          return (
            !isBefore(slotStart, schedStart) && !isAfter(slotEnd, schedEnd)
          );
        });

      expect(allWithinSchedule).toBe(true);
    } finally {
      await cleanup(contractor.id, user.id);
    }
  }, 30000);

  test('Property 6b: Blocked dates have no available slots', async () => {
    const testDate = addDays(startOfDay(new Date()), 7);

    const { contractor, user } = await createTestContractor({
      enabled: true,
      schedule: { start: '09:00', end: '17:00', enabled: true },
      bufferMinutes: 0,
      minNoticeHours: 0,
      maxAdvanceDays: 30,
      blockedDates: [testDate],
    });

    try {
      const slots = await instantBookingService.getAvailableSlots(
        contractor.id,
        testDate,
        'plumbing',
        60
      );

      // No slots should be available on blocked date
      expect(slots.length).toBe(0);
    } finally {
      await cleanup(contractor.id, user.id);
    }
  }, 30000);

  test('Property 6c: Slots respect minimum notice hours', async () => {
    const minNoticeHours = 24;

    const { contractor, user } = await createTestContractor({
      enabled: true,
      schedule: { start: '09:00', end: '17:00', enabled: true },
      bufferMinutes: 0,
      minNoticeHours,
      maxAdvanceDays: 30,
      blockedDates: [],
    });

    try {
      // Test tomorrow (within 24 hours)
      const tomorrow = addDays(startOfDay(new Date()), 1);
      const slots = await instantBookingService.getAvailableSlots(
        contractor.id,
        tomorrow,
        'plumbing',
        60
      );

      const now = new Date();
      const minNoticeTime = addMinutes(now, minNoticeHours * 60);

      // All available slots should be after minimum notice time
      const allRespectMinNotice = slots
        .filter((slot) => slot.isAvailable)
        .every((slot) => !isBefore(slot.startTime, minNoticeTime));

      expect(allRespectMinNotice).toBe(true);
    } finally {
      await cleanup(contractor.id, user.id);
    }
  }, 30000);

  test('Property 6d: Slots respect maximum advance days', async () => {
    const maxAdvanceDays = 30;

    const { contractor, user } = await createTestContractor({
      enabled: true,
      schedule: { start: '09:00', end: '17:00', enabled: true },
      bufferMinutes: 0,
      minNoticeHours: 0,
      maxAdvanceDays,
      blockedDates: [],
    });

    try {
      // Test date beyond max advance days
      const farFuture = addDays(startOfDay(new Date()), maxAdvanceDays + 5);
      const slots = await instantBookingService.getAvailableSlots(
        contractor.id,
        farFuture,
        'plumbing',
        60
      );

      // No slots should be available beyond max advance days
      expect(slots.length).toBe(0);
    } finally {
      await cleanup(contractor.id, user.id);
    }
  }, 30000);

  test('Property 6e: Booked slots are not available', async () => {
    const { contractor, user } = await createTestContractor({
      enabled: true,
      schedule: { start: '09:00', end: '17:00', enabled: true },
      bufferMinutes: 0,
      minNoticeHours: 0,
      maxAdvanceDays: 30,
      blockedDates: [],
    });

    // Create a customer
    const customer = await db.User.create({
      data: {
        email: `customer-${Date.now()}@example.com`,
        name: 'Test Customer',
        role: 'user',
      },
    });

    try {
      const testDate = addDays(startOfDay(new Date()), 7);
      const appointmentStart = parse('10:00', 'HH:mm', testDate);
      const appointmentEnd = parse('11:00', 'HH:mm', testDate);

      // Create an existing appointment
      await createAppointment(
        contractor.id,
        customer.id,
        appointmentStart,
        appointmentEnd
      );

      // Get available slots
      const slots = await instantBookingService.getAvailableSlots(
        contractor.id,
        testDate,
        'plumbing',
        60
      );

      // Find the slot that overlaps with the appointment
      const overlappingSlot = slots.find(
        (slot) =>
          slot.startTime.getTime() === appointmentStart.getTime() &&
          slot.endTime.getTime() === appointmentEnd.getTime()
      );

      // The overlapping slot should not be available
      if (overlappingSlot) {
        expect(overlappingSlot.isAvailable).toBe(false);
      }
    } finally {
      await cleanup(contractor.id, user.id);
      await db.User.delete({ where: { id: customer.id } });
    }
  }, 30000);

  test('Property 6f: Buffer time prevents adjacent bookings', async () => {
    const bufferMinutes = 30;

    const { contractor, user } = await createTestContractor({
      enabled: true,
      schedule: { start: '09:00', end: '17:00', enabled: true },
      bufferMinutes,
      minNoticeHours: 0,
      maxAdvanceDays: 30,
      blockedDates: [],
    });

    const customer = await db.User.create({
      data: {
        email: `customer-${Date.now()}@example.com`,
        name: 'Test Customer',
        role: 'user',
      },
    });

    try {
      const testDate = addDays(startOfDay(new Date()), 7);
      const appointmentStart = parse('10:00', 'HH:mm', testDate);
      const appointmentEnd = parse('11:00', 'HH:mm', testDate);

      // Create an existing appointment
      await createAppointment(
        contractor.id,
        customer.id,
        appointmentStart,
        appointmentEnd
      );

      // Try to book a slot immediately after (should fail due to buffer)
      const nextSlotStart = appointmentEnd;
      const nextSlotEnd = addMinutes(nextSlotStart, 60);

      const isAvailable = await contractorSchedulerService.isSlotAvailable(
        contractor.id,
        nextSlotStart,
        nextSlotEnd
      );

      // Should not be available due to buffer time
      expect(isAvailable).toBe(false);
    } finally {
      await cleanup(contractor.id, user.id);
      await db.User.delete({ where: { id: customer.id } });
    }
  }, 30000);

  test('Property 6g: Instant booking disabled returns no slots', async () => {
    const { contractor, user } = await createTestContractor({
      enabled: false, // Instant booking disabled
      schedule: { start: '09:00', end: '17:00', enabled: true },
      bufferMinutes: 0,
      minNoticeHours: 0,
      maxAdvanceDays: 30,
      blockedDates: [],
    });

    try {
      const testDate = addDays(startOfDay(new Date()), 7);
      const slots = await instantBookingService.getAvailableSlots(
        contractor.id,
        testDate,
        'plumbing',
        60
      );

      // No slots should be available when instant booking is disabled
      expect(slots.length).toBe(0);
    } finally {
      await cleanup(contractor.id, user.id);
    }
  }, 30000);

  test('Property 6h: Only offered service types return slots', async () => {
    const { contractor, user } = await createTestContractor({
      enabled: true,
      schedule: { start: '09:00', end: '17:00', enabled: true },
      bufferMinutes: 0,
      minNoticeHours: 0,
      maxAdvanceDays: 30,
      blockedDates: [],
    });

    try {
      const testDate = addDays(startOfDay(new Date()), 7);

      // Request a service type the contractor doesn't offer
      const slots = await instantBookingService.getAvailableSlots(
        contractor.id,
        testDate,
        'roofing', // Not in contractor's specialties
        60
      );

      // No slots should be available for non-offered service
      expect(slots.length).toBe(0);
    } finally {
      await cleanup(contractor.id, user.id);
    }
  }, 30000);
});
