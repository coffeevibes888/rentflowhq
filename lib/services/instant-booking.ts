import { prisma as db } from '@/db/prisma';
import { contractorSchedulerService } from './contractor-scheduler';
import { addMinutes, differenceInHours, isBefore } from 'date-fns';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  : null;

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  serviceTypes?: string[];
}

export interface BookingRequest {
  contractorId: string;
  customerId: string;
  serviceType: string;
  startTime: Date;
  endTime: Date;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  notes?: string;
  depositAmount?: number;
}

export interface Booking {
  id: string;
  contractorId: string;
  customerId: string;
  serviceType: string;
  title: string;
  description?: string;
  address: any;
  startTime: Date;
  endTime: Date;
  status: string;
  depositAmount?: number;
  depositPaid: boolean;
  depositPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CancellationResult {
  success: boolean;
  refundAmount?: number;
  message: string;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  paymentIntentId: string;
}

export class InstantBookingService {
  /**
   * Get available time slots for a contractor on a specific date
   * Respects contractor's availability, existing bookings, and calendar sync
   */
  async getAvailableSlots(
    contractorId: string,
    date: Date,
    serviceType: string,
    slotDuration: number = 60
  ): Promise<TimeSlot[]> {
    // Check if contractor has instant booking enabled
    const contractor = await db.contractorProfile.findUnique({
      where: { id: contractorId },
      select: {
        instantBookingEnabled: true,
        specialties: true,
      },
    });

    if (!contractor || !contractor.instantBookingEnabled) {
      return [];
    }

    // Verify contractor offers this service type
    if (!contractor.specialties.includes(serviceType)) {
      return [];
    }

    // Get available slots from scheduler service
    const slots = await contractorSchedulerService.getAvailableSlots(
      contractorId,
      date,
      slotDuration
    );

    // Add service type to each slot
    return slots.map((slot) => ({
      ...slot,
      serviceTypes: contractor.specialties,
    }));
  }

  /**
   * Create an instant booking
   * Validates availability, creates appointment, and processes deposit if required
   */
  async createBooking(data: BookingRequest): Promise<Booking> {
    // Verify contractor has instant booking enabled
    const contractor = await db.contractorProfile.findUnique({
      where: { id: data.contractorId },
      select: {
        instantBookingEnabled: true,
        depositRequired: true,
        depositAmount: true,
        depositPercent: true,
        specialties: true,
      },
    });

    if (!contractor || !contractor.instantBookingEnabled) {
      throw new Error('Instant booking is not enabled for this contractor');
    }

    // Verify service type is offered
    if (!contractor.specialties.includes(data.serviceType)) {
      throw new Error('Contractor does not offer this service type');
    }

    // Check if slot is still available
    const isAvailable = await contractorSchedulerService.isSlotAvailable(
      data.contractorId,
      data.startTime,
      data.endTime
    );

    if (!isAvailable) {
      throw new Error('Time slot is no longer available');
    }

    // Calculate deposit amount if required
    let depositAmount = data.depositAmount;
    if (contractor.depositRequired && !depositAmount) {
      if (contractor.depositAmount) {
        depositAmount = Number(contractor.depositAmount);
      } else if (contractor.depositPercent) {
        // For instant booking, we might not know the total cost yet
        // So we use a default or require the deposit amount to be passed
        throw new Error('Deposit amount is required for this booking');
      }
    }

    // Create the appointment
    const appointment = await contractorSchedulerService.createAppointment({
      contractorId: data.contractorId,
      customerId: data.customerId,
      serviceType: data.serviceType,
      title: `${data.serviceType} - Instant Booking`,
      description: data.notes,
      address: data.address,
      startTime: data.startTime,
      endTime: data.endTime,
      depositAmount: depositAmount,
    });

    return {
      id: appointment.id,
      contractorId: appointment.contractorId,
      customerId: appointment.customerId,
      serviceType: appointment.serviceType,
      title: appointment.title,
      description: appointment.description || undefined,
      address: appointment.address,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      depositAmount: appointment.depositAmount
        ? Number(appointment.depositAmount)
        : undefined,
      depositPaid: appointment.depositPaid,
      depositPaymentId: appointment.depositPaymentId || undefined,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  /**
   * Cancel a booking and apply cancellation policy
   * Returns refund amount based on contractor's cancellation policy
   */
  async cancelBooking(
    bookingId: string,
    cancelledBy: 'contractor' | 'customer',
    reason?: string
  ): Promise<CancellationResult> {
    // Get the booking
    const appointment = await db.contractorAppointment.findUnique({
      where: { id: bookingId },
      include: {
        contractor: {
          select: {
            cancellationPolicy: true,
            cancellationHours: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new Error('Booking not found');
    }

    if (appointment.status === 'cancelled') {
      throw new Error('Booking is already cancelled');
    }

    // Calculate hours until appointment
    const hoursUntilAppointment = differenceInHours(
      appointment.startTime,
      new Date()
    );

    // Determine refund amount based on cancellation policy
    let refundAmount = 0;
    let message = 'Booking cancelled successfully';

    if (
      cancelledBy === 'customer' &&
      appointment.depositPaid &&
      appointment.depositAmount
    ) {
      const depositAmount = Number(appointment.depositAmount);
      const cancellationHours = appointment.contractor.cancellationHours || 24;
      const policy = appointment.contractor.cancellationPolicy || 'moderate';

      // Apply cancellation policy based on policy type
      switch (policy) {
        case 'flexible':
          // 50% refund regardless of timing
          refundAmount = depositAmount * 0.5;
          message =
            'Booking cancelled. 50% deposit refund will be processed per flexible cancellation policy.';
          break;
        case 'moderate':
          // Full refund if cancelled with enough notice, no refund if late
          if (hoursUntilAppointment >= cancellationHours) {
            refundAmount = depositAmount;
            message = 'Booking cancelled. Full deposit refund will be processed.';
          } else {
            refundAmount = 0;
            message = `Booking cancelled. No refund available for cancellations within ${cancellationHours} hours per moderate cancellation policy.`;
          }
          break;
        case 'strict':
          // No refund regardless of timing
          refundAmount = 0;
          message =
            'Booking cancelled. No refund available per strict cancellation policy.';
          break;
        default:
          refundAmount = 0;
      }
    } else if (cancelledBy === 'contractor' && appointment.depositPaid) {
      // Contractor cancellation always gets full refund
      refundAmount = Number(appointment.depositAmount || 0);
      message =
        'Booking cancelled by contractor. Full deposit refund will be processed.';
    }

    // Cancel the appointment
    await contractorSchedulerService.cancelAppointment(
      bookingId,
      cancelledBy,
      reason
    );

    // Process refund if applicable
    if (refundAmount > 0 && appointment.depositPaymentId && stripe) {
      try {
        await stripe.refunds.create({
          payment_intent: appointment.depositPaymentId,
          amount: Math.round(refundAmount * 100), // Convert to cents
        });
      } catch (error) {
        console.error('Refund failed:', error);
        message += ' Refund processing failed - please contact support.';
      }
    }

    return {
      success: true,
      refundAmount,
      message,
    };
  }

  /**
   * Create a payment intent for deposit
   */
  async applyDeposit(
    bookingId: string,
    amount: number
  ): Promise<PaymentIntent> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    const appointment = await db.contractorAppointment.findUnique({
      where: { id: bookingId },
      include: {
        contractor: {
          select: {
            stripeCustomerId: true,
            businessName: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new Error('Booking not found');
    }

    if (appointment.depositPaid) {
      throw new Error('Deposit has already been paid');
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId: appointment.id,
        contractorId: appointment.contractorId,
        customerId: appointment.customerId,
        type: 'booking_deposit',
      },
      description: `Booking deposit for ${appointment.contractor.businessName}`,
    });

    // Update appointment with payment intent ID
    await db.contractorAppointment.update({
      where: { id: bookingId },
      data: {
        depositPaymentId: paymentIntent.id,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      amount,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Mark deposit as paid (called after successful payment)
   */
  async markDepositPaid(bookingId: string, paymentIntentId: string): Promise<void> {
    await db.contractorAppointment.update({
      where: { id: bookingId },
      data: {
        depositPaid: true,
        depositPaymentId: paymentIntentId,
      },
    });
  }

  /**
   * Get booking details
   */
  async getBooking(bookingId: string): Promise<Booking | null> {
    const appointment = await db.contractorAppointment.findUnique({
      where: { id: bookingId },
    });

    if (!appointment) {
      return null;
    }

    return {
      id: appointment.id,
      contractorId: appointment.contractorId,
      customerId: appointment.customerId,
      serviceType: appointment.serviceType,
      title: appointment.title,
      description: appointment.description || undefined,
      address: appointment.address,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      depositAmount: appointment.depositAmount
        ? Number(appointment.depositAmount)
        : undefined,
      depositPaid: appointment.depositPaid,
      depositPaymentId: appointment.depositPaymentId || undefined,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }
}

export const instantBookingService = new InstantBookingService();
