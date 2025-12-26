'use server';

import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { formatError } from '../utils';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  contractorSchema,
  updateContractorSchema,
  workOrderSchema,
  workOrderStatusSchema,
  contractorPaymentSchema,
  workOrderMediaSchema,
  CONTRACTOR_PLATFORM_FEE_PERCENT,
} from '../validators';
import { getOrCreateCurrentLandlord } from './landlord.actions';
import { normalizeTier } from '../config/subscription-tiers';

// Helper to check PRO tier access
async function checkProTierAccess(landlordId: string) {
  const landlord = await prisma.landlord.findUnique({
    where: { id: landlordId },
    select: { subscriptionTier: true },
  });
  
  if (!landlord) {
    throw new Error('Landlord not found');
  }
  
  const tier = normalizeTier(landlord.subscriptionTier);
  if (tier === 'free') {
    throw new Error('Contractor management requires a PRO subscription');
  }
  
  return true;
}

// ============= CONTRACTOR DIRECTORY =============

// Add contractor to directory
export async function addContractor(data: z.infer<typeof contractorSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const landlord = landlordResult.landlord;
    await checkProTierAccess(landlord.id);

    const validatedData = contractorSchema.parse(data);

    const existing = await prisma.contractor.findUnique({
      where: {
        landlordId_email: {
          landlordId: landlord.id,
          email: validatedData.email,
        },
      },
    });

    if (existing) {
      return { success: false, message: 'A contractor with this email already exists' };
    }

    const contractor = await prisma.contractor.create({
      data: {
        landlordId: landlord.id,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        specialties: validatedData.specialties,
        notes: validatedData.notes || null,
      },
    });

    revalidatePath('/admin/contractors');
    return { success: true, message: 'Contractor added', contractorId: contractor.id };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all contractors
export async function getContractors(search?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated', contractors: [] };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message, contractors: [] };
    }

    const contractors = await prisma.contractor.findMany({
      where: {
        landlordId: landlordResult.landlord.id,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
      include: { _count: { select: { workOrders: true } } },
    });

    return {
      success: true,
      contractors: contractors.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        specialties: c.specialties,
        isPaymentReady: c.isPaymentReady,
        stripeOnboardingStatus: c.stripeOnboardingStatus,
        notes: c.notes,
        workOrderCount: c._count.workOrders,
        createdAt: c.createdAt,
      })),
    };
  } catch (error) {
    return { success: false, message: formatError(error), contractors: [] };
  }
}

// Get single contractor
export async function getContractor(contractorId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const contractor = await prisma.contractor.findFirst({
      where: { id: contractorId, landlordId: landlordResult.landlord.id },
      include: {
        workOrders: { orderBy: { createdAt: 'desc' }, take: 10 },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!contractor) {
      return { success: false, message: 'Contractor not found' };
    }

    return { success: true, contractor };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update contractor
export async function updateContractor(data: z.infer<typeof updateContractorSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const validatedData = updateContractorSchema.parse(data);

    const contractor = await prisma.contractor.findFirst({
      where: { id: validatedData.id, landlordId: landlordResult.landlord.id },
    });

    if (!contractor) {
      return { success: false, message: 'Contractor not found' };
    }

    await prisma.contractor.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        specialties: validatedData.specialties,
        notes: validatedData.notes || null,
      },
    });

    revalidatePath('/admin/contractors');
    return { success: true, message: 'Contractor updated' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Delete contractor
export async function deleteContractor(contractorId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const contractor = await prisma.contractor.findFirst({
      where: { id: contractorId, landlordId: landlordResult.landlord.id },
    });

    if (!contractor) {
      return { success: false, message: 'Contractor not found' };
    }

    await prisma.contractor.delete({ where: { id: contractorId } });
    revalidatePath('/admin/contractors');
    return { success: true, message: 'Contractor removed' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}


// ============= WORK ORDERS =============

// Create work order
export async function createWorkOrder(data: z.infer<typeof workOrderSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const landlord = landlordResult.landlord;
    await checkProTierAccess(landlord.id);

    const validatedData = workOrderSchema.parse(data);

    const contractor = await prisma.contractor.findFirst({
      where: { id: validatedData.contractorId, landlordId: landlord.id },
    });
    if (!contractor) {
      return { success: false, message: 'Contractor not found' };
    }

    const property = await prisma.property.findFirst({
      where: { id: validatedData.propertyId, landlordId: landlord.id },
    });
    if (!property) {
      return { success: false, message: 'Property not found' };
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        landlordId: landlord.id,
        contractorId: validatedData.contractorId,
        maintenanceTicketId: validatedData.maintenanceTicketId || null,
        propertyId: validatedData.propertyId,
        unitId: validatedData.unitId || null,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        agreedPrice: validatedData.agreedPrice,
        scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : null,
        notes: validatedData.notes || null,
        status: 'assigned',
      },
    });

    await prisma.workOrderHistory.create({
      data: {
        workOrderId: workOrder.id,
        changedById: session.user.id,
        previousStatus: 'draft',
        newStatus: 'assigned',
        notes: 'Work order created',
      },
    });

    revalidatePath('/admin/contractors');
    return { success: true, message: 'Work order created', workOrderId: workOrder.id };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get work orders
export async function getWorkOrders(filters?: { status?: string; contractorId?: string; propertyId?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated', workOrders: [] };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message, workOrders: [] };
    }

    const workOrders = await prisma.workOrder.findMany({
      where: {
        landlordId: landlordResult.landlord.id,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.contractorId && { contractorId: filters.contractorId }),
        ...(filters?.propertyId && { propertyId: filters.propertyId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        contractor: { select: { name: true, email: true } },
        property: { select: { name: true } },
        unit: { select: { name: true } },
        maintenanceTicket: { select: { title: true } },
        _count: { select: { media: true } },
      },
    });

    return {
      success: true,
      workOrders: workOrders.map((wo) => ({
        id: wo.id,
        title: wo.title,
        description: wo.description,
        status: wo.status,
        priority: wo.priority,
        agreedPrice: wo.agreedPrice.toString(),
        actualCost: wo.actualCost?.toString() || null,
        scheduledDate: wo.scheduledDate,
        completedAt: wo.completedAt,
        notes: wo.notes,
        contractor: wo.contractor,
        property: wo.property,
        unit: wo.unit,
        maintenanceTicket: wo.maintenanceTicket,
        mediaCount: wo._count.media,
        createdAt: wo.createdAt,
      })),
    };
  } catch (error) {
    return { success: false, message: formatError(error), workOrders: [] };
  }
}

// Get single work order
export async function getWorkOrder(workOrderId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, landlordId: landlordResult.landlord.id },
      include: {
        contractor: true,
        property: true,
        unit: true,
        maintenanceTicket: true,
        media: { orderBy: { createdAt: 'asc' }, include: { uploader: { select: { name: true } } } },
        history: { orderBy: { createdAt: 'desc' }, include: { changedBy: { select: { name: true } } } },
        payment: true,
      },
    });

    if (!workOrder) {
      return { success: false, message: 'Work order not found' };
    }

    return { success: true, workOrder };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update work order status
export async function updateWorkOrderStatus(data: z.infer<typeof workOrderStatusSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const validatedData = workOrderStatusSchema.parse(data);

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: validatedData.id, landlordId: landlordResult.landlord.id },
    });

    if (!workOrder) {
      return { success: false, message: 'Work order not found' };
    }

    const validTransitions: Record<string, string[]> = {
      draft: ['assigned', 'cancelled'],
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: ['paid'],
      paid: [],
      cancelled: [],
    };

    if (!validTransitions[workOrder.status]?.includes(validatedData.status)) {
      return { success: false, message: `Cannot transition from ${workOrder.status} to ${validatedData.status}` };
    }

    const updateData: Record<string, unknown> = { status: validatedData.status };
    if (validatedData.status === 'completed') {
      updateData.completedAt = new Date();
    }

    await prisma.workOrder.update({ where: { id: validatedData.id }, data: updateData });

    await prisma.workOrderHistory.create({
      data: {
        workOrderId: validatedData.id,
        changedById: session.user.id,
        previousStatus: workOrder.status,
        newStatus: validatedData.status,
        notes: validatedData.notes || null,
      },
    });

    if (validatedData.status === 'completed' && workOrder.maintenanceTicketId) {
      await prisma.maintenanceTicket.update({
        where: { id: workOrder.maintenanceTicketId },
        data: { status: 'resolved', resolvedAt: new Date() },
      });
    }

    revalidatePath('/admin/contractors');
    return { success: true, message: `Work order marked as ${validatedData.status}` };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}


// ============= CONTRACTOR PAYMENTS =============

// Pay contractor for completed work order
export async function payContractor(data: z.infer<typeof contractorPaymentSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const userId = session.user.id;

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const landlord = landlordResult.landlord;
    await checkProTierAccess(landlord.id);

    const validatedData = contractorPaymentSchema.parse(data);

    // Get work order with contractor
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: validatedData.workOrderId, landlordId: landlord.id },
      include: { contractor: true, payment: true },
    });

    if (!workOrder) {
      return { success: false, message: 'Work order not found' };
    }

    if (workOrder.status !== 'completed') {
      return { success: false, message: 'Work order must be completed before payment' };
    }

    if (workOrder.payment) {
      return { success: false, message: 'Work order has already been paid' };
    }

    // Calculate payment amounts using Number() instead of Decimal
    const amount = Number(workOrder.agreedPrice);
    const platformFee = Number((amount * CONTRACTOR_PLATFORM_FEE_PERCENT / 100).toFixed(2));
    const netAmount = Number((amount - platformFee).toFixed(2));

    // Check landlord wallet balance
    const wallet = await prisma.landlordWallet.findUnique({
      where: { landlordId: landlord.id },
      select: { availableBalance: true },
    });

    if (!wallet) {
      return { success: false, message: 'Wallet not found. Please set up your wallet first.' };
    }

    const walletBalance = Number(wallet.availableBalance);
    if (walletBalance < amount) {
      return { success: false, message: `Insufficient wallet balance. You have $${walletBalance.toFixed(2)} but need $${amount.toFixed(2)}` };
    }

    // Create payment record and update wallet in transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Deduct from landlord wallet
      await tx.landlordWallet.update({
        where: { landlordId: landlord.id },
        data: { availableBalance: { decrement: amount } },
      });

      // Create payment record
      const paymentRecord = await tx.contractorPayment.create({
        data: {
          landlordId: landlord.id,
          contractorId: workOrder.contractorId,
          workOrderId: workOrder.id,
          amount,
          platformFee,
          netAmount,
          status: 'completed',
          paidAt: new Date(),
        },
      });

      // Update work order status to paid
      await tx.workOrder.update({
        where: { id: workOrder.id },
        data: { status: 'paid' },
      });

      // Create history record
      await tx.workOrderHistory.create({
        data: {
          workOrderId: workOrder.id,
          changedById: userId,
          previousStatus: 'completed',
          newStatus: 'paid',
          notes: `Payment of $${amount.toFixed(2)} processed`,
        },
      });

      return paymentRecord;
    });

    revalidatePath('/admin/contractors');
    return { 
      success: true, 
      message: `Payment of $${amount.toFixed(2)} sent to ${workOrder.contractor.name}`,
      paymentId: payment.id,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get contractor payments
export async function getContractorPayments(filters?: { contractorId?: string; status?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated', payments: [] };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message, payments: [] };
    }

    const payments = await prisma.contractorPayment.findMany({
      where: {
        landlordId: landlordResult.landlord.id,
        ...(filters?.contractorId && { contractorId: filters.contractorId }),
        ...(filters?.status && { status: filters.status }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        contractor: { select: { name: true, email: true } },
        workOrder: { select: { title: true, property: { select: { name: true } } } },
      },
    });

    return {
      success: true,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount.toString(),
        platformFee: p.platformFee.toString(),
        netAmount: p.netAmount.toString(),
        status: p.status,
        paidAt: p.paidAt,
        contractor: p.contractor,
        workOrder: {
          title: p.workOrder.title,
          propertyName: p.workOrder.property.name,
        },
        createdAt: p.createdAt,
      })),
    };
  } catch (error) {
    return { success: false, message: formatError(error), payments: [] };
  }
}

// Get contractor spending report
export async function getContractorSpendingReport(dateRange?: { start: Date; end: Date }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated', report: null };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message, report: null };
    }

    const whereClause: Record<string, unknown> = {
      landlordId: landlordResult.landlord.id,
      status: 'completed',
    };

    if (dateRange) {
      whereClause.paidAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    // Get payments grouped by contractor
    const payments = await prisma.contractorPayment.findMany({
      where: whereClause,
      include: {
        contractor: { select: { id: true, name: true, email: true } },
      },
    });

    // Aggregate by contractor
    const byContractor: Record<string, { name: string; email: string; total: number; count: number }> = {};
    let totalSpent = 0;
    let totalFees = 0;

    for (const payment of payments) {
      const amount = Number(payment.amount);
      const fee = Number(payment.platformFee);
      totalSpent += amount;
      totalFees += fee;

      if (!byContractor[payment.contractorId]) {
        byContractor[payment.contractorId] = {
          name: payment.contractor.name,
          email: payment.contractor.email,
          total: 0,
          count: 0,
        };
      }
      byContractor[payment.contractorId].total += amount;
      byContractor[payment.contractorId].count += 1;
    }

    return {
      success: true,
      report: {
        totalSpent,
        totalFees,
        totalPayments: payments.length,
        byContractor: Object.entries(byContractor).map(([id, data]) => ({
          contractorId: id,
          ...data,
        })),
      },
    };
  } catch (error) {
    return { success: false, message: formatError(error), report: null };
  }
}

// ============= WORK ORDER MEDIA =============

// Add media to work order
export async function addWorkOrderMedia(data: z.infer<typeof workOrderMediaSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    const validatedData = workOrderMediaSchema.parse(data);

    // Verify work order belongs to landlord
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: validatedData.workOrderId, landlordId: landlordResult.landlord.id },
    });

    if (!workOrder) {
      return { success: false, message: 'Work order not found' };
    }

    // Determine uploader role
    const uploaderRole = 'landlord'; // For now, only landlords can upload via admin

    const media = await prisma.workOrderMedia.create({
      data: {
        workOrderId: validatedData.workOrderId,
        uploadedById: session.user.id,
        uploaderRole,
        type: validatedData.type,
        url: validatedData.url,
        thumbnailUrl: validatedData.thumbnailUrl || null,
        caption: validatedData.caption || null,
        phase: validatedData.phase,
      },
    });

    revalidatePath('/admin/contractors');
    return { success: true, message: 'Media added', mediaId: media.id };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get work order media
export async function getWorkOrderMedia(workOrderId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated', media: [] };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message, media: [] };
    }

    // Verify work order belongs to landlord
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, landlordId: landlordResult.landlord.id },
    });

    if (!workOrder) {
      return { success: false, message: 'Work order not found', media: [] };
    }

    const media = await prisma.workOrderMedia.findMany({
      where: { workOrderId },
      orderBy: { createdAt: 'asc' },
      include: { uploader: { select: { name: true } } },
    });

    return {
      success: true,
      media: media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        caption: m.caption,
        phase: m.phase,
        uploaderName: m.uploader.name,
        uploaderRole: m.uploaderRole,
        createdAt: m.createdAt,
      })),
    };
  } catch (error) {
    return { success: false, message: formatError(error), media: [] };
  }
}

// Delete work order media
export async function deleteWorkOrderMedia(mediaId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Not authenticated' };
    }

    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return { success: false, message: landlordResult.message };
    }

    // Get media with work order to verify ownership
    const media = await prisma.workOrderMedia.findUnique({
      where: { id: mediaId },
      include: { workOrder: { select: { landlordId: true } } },
    });

    if (!media) {
      return { success: false, message: 'Media not found' };
    }

    if (media.workOrder.landlordId !== landlordResult.landlord.id) {
      return { success: false, message: 'Not authorized to delete this media' };
    }

    await prisma.workOrderMedia.delete({ where: { id: mediaId } });

    revalidatePath('/admin/contractors');
    return { success: true, message: 'Media deleted' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
