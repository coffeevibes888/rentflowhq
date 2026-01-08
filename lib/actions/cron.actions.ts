'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';

// This function is designed to be called by a cron job
export async function applyLateFees() {
  console.log('--- Starting Daily Late Fee Application Job ---');
  try {
    const today = new Date();
    
    // Find all landlords who have automatic late fees enabled
    const lateFeeSettings = await prisma.lateFeeSettings.findMany({
      where: { enabled: true },
    });

    if (lateFeeSettings.length === 0) {
      console.log('No landlords have late fees enabled. Exiting job.');
      return { success: true, message: 'No active settings.' };
    }

    let feesApplied = 0;

    for (const settings of lateFeeSettings) {
      const gracePeriod = settings.gracePeriodDays;

      // Find overdue payments for this landlord that are past the grace period
      const overduePayments = await prisma.rentPayment.findMany({
        where: {
          status: 'overdue',
          lease: {
            unit: {
              property: {
                landlordId: settings.landlordId,
              },
            },
          },
          dueDate: {
            lt: new Date(today.getTime() - gracePeriod * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          lease: true,
        },
      });

      for (const payment of overduePayments) {
        // Check if a late fee has already been applied for this specific payment
        const existingLateFee = await prisma.tenantInvoice.findFirst({
          where: {
            leaseId: payment.leaseId,
            reason: 'Automatic Late Fee',
            // Check if fee was generated for this specific overdue payment's period
            description: `For overdue payment due ${payment.dueDate.toISOString()}`,
          },
        });

        if (existingLateFee) {
          continue; // Skip if fee already applied
        }

        let feeAmount = 0;
        if (settings.feeType === 'flat') {
          feeAmount = Number(settings.feeAmount);
        } else if (settings.feeType === 'percentage') {
          const rentAmount = Number(payment.amount);
          const calculatedFee = rentAmount * (Number(settings.feeAmount) / 100);
          feeAmount = settings.maxFee ? Math.min(Number(settings.maxFee), calculatedFee) : calculatedFee;
        }

        if (feeAmount > 0) {
          // Create a new invoice for the late fee
          await prisma.tenantInvoice.create({
            data: {
              propertyId: payment.lease.unit.propertyId,
              tenantId: payment.tenantId,
              leaseId: payment.leaseId,
              amount: feeAmount,
              reason: 'Automatic Late Fee',
              description: `For overdue payment due ${payment.dueDate.toISOString()}`,
              dueDate: today,
              status: 'pending',
            },
          });
          feesApplied++;
        }
      }
    }

    console.log(`--- Late Fee Job Complete. Applied ${feesApplied} fees. ---`);
    return { success: true, message: `Applied ${feesApplied} late fees.` };
  } catch (error) {
    console.error('Failed to apply late fees:', error);
    return { success: false, message: formatError(error) };
  }
}
