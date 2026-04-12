/**
 * Event Handlers - Replace cron job logic with event-driven handlers
 */

import { eventBus, EventPayload } from './event-bus';
import { jobQueue } from './job-queue';
import { addDays, addHours, addMinutes } from 'date-fns';
import { getWebSocketServer } from '@/lib/websocket-server';
import { NotificationService } from '@/lib/services/notification-service';

/**
 * Initialize all event handlers
 */
export function initializeEventHandlers() {
  console.log('Initializing event handlers...');

  // Lease events
  eventBus.subscribe('lease.tenant_signed', handleTenantSignedLease);
  eventBus.subscribe('lease.created', handleLeaseCreated);

  // Payment events
  eventBus.subscribe('payment.received', handlePaymentReceived);
  eventBus.subscribe('payment.pending', handlePendingPayment);

  // Appointment events
  eventBus.subscribe('appointment.created', handleAppointmentCreated);
  eventBus.subscribe('appointment.updated', handleAppointmentUpdated);

  // Verification events
  eventBus.subscribe('verification.uploaded', handleVerificationUploaded);
  eventBus.subscribe('verification.expiring_soon', handleVerificationExpiring);

  // Rent events
  eventBus.subscribe('rent.due_soon', handleRentDueSoon);

  // Invoice events
  eventBus.subscribe('invoice.created', handleInvoiceCreated);
  eventBus.subscribe('invoice.overdue', handleInvoiceOverdue);

  // Balance events
  eventBus.subscribe('balance.pending_release', handlePendingBalanceRelease);

  // Document events
  eventBus.subscribe('document.expired', handleDocumentExpired);

  // Webhook events
  eventBus.subscribe('webhook.failed', handleWebhookFailed);

  // Property showing events
  eventBus.subscribe('property.showing_scheduled', handlePropertyShowingScheduled);
  eventBus.subscribe('open_house.scheduled', handleOpenHouseScheduled);
  eventBus.subscribe('open_house.starting_soon', handleOpenHouseStartingSoon);

  // Work order events
  eventBus.subscribe('work_order.created', handleWorkOrderCreated);
  eventBus.subscribe('work_order.bid_received', handleWorkOrderBidReceived);
  eventBus.subscribe('work_order.bid_accepted', handleWorkOrderBidAccepted);

  // Contractor lead events
  eventBus.subscribe('contractor.lead_matched', handleContractorLeadMatched);

  console.log('Event handlers initialized');
}

/**
 * Handle tenant signing lease - notify landlord immediately
 */
async function handleTenantSignedLease(event: EventPayload) {
  const { leaseId, tenantName, propertyId, landlordId, landlordUserId } = event.data;

  // Send real-time notification via WebSocket
  const wsServer = getWebSocketServer();
  if (wsServer && landlordUserId) {
    wsServer.broadcastNewMessage(`landlord-${landlordUserId}`, {
      type: 'lease_signed',
      leaseId,
      tenantName,
      message: `${tenantName} has signed the lease. Please review and sign.`,
    });
  }

  // Create in-app notification
  await NotificationService.createNotification({
    userId: landlordUserId,
    type: 'reminder',
    title: 'Lease Awaiting Your Signature',
    message: `${tenantName} has signed the lease. Please review and sign to complete the agreement.`,
    actionUrl: `/admin/products/${propertyId}/details`,
    metadata: { leaseId, propertyId },
    landlordId,
  });

  // Schedule follow-up reminder if not signed in 24 hours
  await jobQueue.scheduleReminder(
    'lease_signing',
    landlordUserId,
    addHours(new Date(), 24),
    { leaseId, tenantName, propertyId }
  );
}

/**
 * Handle lease creation - schedule rent reminders
 */
async function handleLeaseCreated(event: EventPayload) {
  const { leaseId, rentDueDate, tenantId } = event.data;

  // Schedule rent reminder 3 days before due date
  await jobQueue.scheduleReminder(
    'rent',
    tenantId,
    addDays(new Date(rentDueDate), -3),
    { leaseId, daysUntilDue: 3 }
  );

  // Schedule rent reminder 1 day before due date
  await jobQueue.scheduleReminder(
    'rent',
    tenantId,
    addDays(new Date(rentDueDate), -1),
    { leaseId, daysUntilDue: 1 }
  );
}

/**
 * Handle payment received - release balance when ready
 */
async function handlePaymentReceived(event: EventPayload) {
  const { transactionId, availableAt, landlordId, amount } = event.data;

  // Schedule balance release for when Stripe makes it available
  await jobQueue.schedule({
    type: 'release_balance',
    payload: { transactionId },
    scheduledFor: new Date(availableAt),
    priority: 8,
  });

  // Send real-time notification
  const wsServer = getWebSocketServer();
  if (wsServer && landlordId) {
    wsServer.broadcastNewMessage(`landlord-${landlordId}`, {
      type: 'payment_received',
      amount,
      availableAt,
    });
  }
}

/**
 * Handle pending payment - track for release
 */
async function handlePendingPayment(event: EventPayload) {
  const { transactionId, availableAt } = event.data;

  await jobQueue.schedule({
    type: 'release_balance',
    payload: { transactionId },
    scheduledFor: new Date(availableAt),
    priority: 8,
  });
}

/**
 * Handle appointment creation - schedule reminder
 */
async function handleAppointmentCreated(event: EventPayload) {
  const { appointmentId, contractorId, startTime } = event.data;

  // Schedule reminder 24 hours before
  const reminderTime = addHours(new Date(startTime), -24);
  
  if (reminderTime > new Date()) {
    await jobQueue.scheduleReminder(
      'appointment',
      contractorId,
      reminderTime,
      { appointmentId }
    );
  }
}

/**
 * Handle appointment update - reschedule reminder if time changed
 */
async function handleAppointmentUpdated(event: EventPayload) {
  const { appointmentId, contractorId, startTime, previousStartTime } = event.data;

  // If time changed, cancel old reminder and schedule new one
  if (startTime !== previousStartTime) {
    // Cancel existing reminders for this appointment
    // (In production, you'd want to track reminder job IDs)
    
    const reminderTime = addHours(new Date(startTime), -24);
    
    if (reminderTime > new Date()) {
      await jobQueue.scheduleReminder(
        'appointment',
        contractorId,
        reminderTime,
        { appointmentId }
      );
    }
  }
}

/**
 * Handle verification upload - check expiration and schedule reminders
 */
async function handleVerificationUploaded(event: EventPayload) {
  const { verificationType, contractorId, expiresAt } = event.data;

  if (!expiresAt) return;

  const expirationDate = new Date(expiresAt);
  
  // Schedule reminder based on verification type
  const reminderDays = verificationType === 'insurance' ? 14 : 30;
  const reminderDate = addDays(expirationDate, -reminderDays);

  if (reminderDate > new Date()) {
    await jobQueue.scheduleReminder(
      'verification',
      contractorId,
      reminderDate,
      { verificationType, expiresAt }
    );
  }
}

/**
 * Handle verification expiring soon
 */
async function handleVerificationExpiring(event: EventPayload) {
  const { contractorId, verificationType, expiresAt, daysUntilExpiration } = event.data;

  await jobQueue.scheduleReminder(
    'verification',
    contractorId,
    new Date(),
    { verificationType, expiresAt, daysUntilExpiration }
  );
}

/**
 * Handle rent due soon
 */
async function handleRentDueSoon(event: EventPayload) {
  const { tenantId, leaseId, dueDate, amount } = event.data;

  await jobQueue.scheduleReminder(
    'rent',
    tenantId,
    new Date(),
    { leaseId, dueDate, amount }
  );
}

/**
 * Handle invoice creation - schedule payment reminder
 */
async function handleInvoiceCreated(event: EventPayload) {
  const { invoiceId, customerId, dueDate } = event.data;

  // Schedule reminder 3 days before due date
  const reminderDate = addDays(new Date(dueDate), -3);
  
  if (reminderDate > new Date()) {
    await jobQueue.scheduleReminder(
      'invoice',
      customerId,
      reminderDate,
      { invoiceId, daysUntilDue: 3 }
    );
  }
}

/**
 * Handle overdue invoice - apply late fees
 */
async function handleInvoiceOverdue(event: EventPayload) {
  const { invoiceId, customerId } = event.data;

  // Schedule late fee application
  await jobQueue.schedule({
    type: 'process_late_fee',
    payload: { invoiceId },
    scheduledFor: new Date(),
    priority: 7,
  });

  // Send notification
  await jobQueue.schedule({
    type: 'send_notification',
    payload: {
      userId: customerId,
      type: 'alert',
      title: 'Invoice Overdue',
      message: 'Your invoice is overdue. Please make payment to avoid additional fees.',
      actionUrl: `/invoices/${invoiceId}`,
    },
    scheduledFor: new Date(),
    priority: 9,
  });
}

/**
 * Handle pending balance release
 */
async function handlePendingBalanceRelease(event: EventPayload) {
  const { transactionId, availableAt } = event.data;

  await jobQueue.schedule({
    type: 'release_balance',
    payload: { transactionId },
    scheduledFor: new Date(availableAt),
    priority: 8,
  });
}

/**
 * Handle expired document - cleanup
 */
async function handleDocumentExpired(event: EventPayload) {
  const { documentId } = event.data;

  await jobQueue.schedule({
    type: 'cleanup_documents',
    payload: { documentId },
    scheduledFor: new Date(),
    priority: 3,
  });
}

/**
 * Handle failed webhook - schedule retry
 */
async function handleWebhookFailed(event: EventPayload) {
  const { webhookId, retryCount } = event.data;

  // Exponential backoff for retries
  const retryDelay = Math.pow(2, retryCount) * 60000; // 2^n minutes

  await jobQueue.schedule({
    type: 'process_webhook',
    payload: { webhookId },
    scheduledFor: addMinutes(new Date(), retryDelay / 60000),
    priority: 5,
    maxRetries: 5,
  });
}

/**
 * Handle property showing scheduled - send confirmation and reminders
 */
async function handlePropertyShowingScheduled(event: EventPayload) {
  const { appointmentId, propertyId, date, startTime, visitorName, visitorEmail } = event.data;

  // Send confirmation email immediately
  await jobQueue.schedule({
    type: 'send_notification',
    payload: {
      type: 'email',
      to: visitorEmail,
      subject: 'Property Showing Confirmed',
      template: 'showing_confirmation',
      data: { visitorName, date, startTime, propertyId },
    },
    scheduledFor: new Date(),
    priority: 9,
  });

  // Schedule reminder 24 hours before
  const showingDateTime = new Date(`${date}T${startTime}`);
  const reminderTime = addHours(showingDateTime, -24);

  if (reminderTime > new Date()) {
    await jobQueue.schedule({
      type: 'send_reminder',
      payload: {
        reminderType: 'property_showing',
        recipientEmail: visitorEmail,
        appointmentId,
        showingDateTime,
      },
      scheduledFor: reminderTime,
      priority: 7,
    });
  }

  // Send real-time notification to property manager
  const wsServer = getWebSocketServer();
  if (wsServer) {
    wsServer.broadcastNewMessage(`property-${propertyId}`, {
      type: 'showing_scheduled',
      visitorName,
      date,
      startTime,
    });
  }
}

/**
 * Handle open house scheduled - notify agent and schedule reminders
 */
async function handleOpenHouseScheduled(event: EventPayload) {
  const { openHouseId, agentId, listingId, date, startTime, endTime } = event.data;

  // Schedule reminder 24 hours before
  const openHouseDateTime = new Date(`${date}T${startTime}`);
  const reminderTime = addHours(openHouseDateTime, -24);

  if (reminderTime > new Date()) {
    await jobQueue.scheduleReminder(
      'open_house',
      agentId,
      reminderTime,
      { openHouseId, listingId, date, startTime, endTime }
    );
  }

  // Schedule "starting soon" notification 1 hour before
  const startingSoonTime = addHours(openHouseDateTime, -1);

  if (startingSoonTime > new Date()) {
    await jobQueue.schedule({
      type: 'send_notification',
      payload: {
        type: 'open_house_starting',
        agentId,
        openHouseId,
      },
      scheduledFor: startingSoonTime,
      priority: 8,
    });
  }

  // Send real-time notification to agent
  const wsServer = getWebSocketServer();
  if (wsServer) {
    wsServer.broadcastNewMessage(`agent-${agentId}`, {
      type: 'open_house_scheduled',
      openHouseId,
      date,
      startTime,
    });
  }
}

/**
 * Handle open house starting soon
 */
async function handleOpenHouseStartingSoon(event: EventPayload) {
  const { agentId, openHouseId } = event.data;

  await jobQueue.schedule({
    type: 'send_notification',
    payload: {
      userId: agentId,
      type: 'alert',
      title: 'Open House Starting Soon',
      message: 'Your open house starts in 1 hour. Make sure everything is ready!',
      actionUrl: `/agent/open-houses/${openHouseId}`,
    },
    scheduledFor: new Date(),
    priority: 9,
  });
}

/**
 * Handle work order created - notify contractors if open bid
 */
async function handleWorkOrderCreated(event: EventPayload) {
  const { workOrderId, posterType, posterId, title, category, isOpenBid, contractorId } = event.data;

  if (isOpenBid) {
    // Notify all contractors in this category via WebSocket
    const wsServer = getWebSocketServer();
    if (wsServer) {
      wsServer.broadcastNewMessage(`contractors-${category}`, {
        type: 'new_job_available',
        workOrderId,
        title,
        category,
        posterType,
      });
    }
  } else if (contractorId) {
    // Direct assignment - notify specific contractor
    await jobQueue.schedule({
      type: 'send_notification',
      payload: {
        userId: contractorId,
        type: 'work_order',
        title: 'New Work Order Assigned',
        message: `You have been assigned a new job: ${title}`,
        actionUrl: `/contractor/work-orders/${workOrderId}`,
      },
      scheduledFor: new Date(),
      priority: 9,
    });

    // Real-time notification
    const wsServer = getWebSocketServer();
    if (wsServer) {
      wsServer.broadcastNewMessage(`contractor-${contractorId}`, {
        type: 'work_order_assigned',
        workOrderId,
        title,
      });
    }
  }
}

/**
 * Handle bid received on work order - notify owner
 */
async function handleWorkOrderBidReceived(event: EventPayload) {
  const { bidId, workOrderId, contractorId, amount, workOrderOwnerId } = event.data;

  // Send real-time notification to owner
  const wsServer = getWebSocketServer();
  if (wsServer) {
    wsServer.broadcastNewMessage(`user-${workOrderOwnerId}`, {
      type: 'bid_received',
      workOrderId,
      bidId,
      amount,
    });
  }

  // Create in-app notification
  await jobQueue.schedule({
    type: 'send_notification',
    payload: {
      userId: workOrderOwnerId,
      type: 'bid',
      title: 'New Bid Received',
      message: `A contractor has submitted a bid of $${amount} for your work order`,
      actionUrl: `/work-orders/${workOrderId}`,
    },
    scheduledFor: new Date(),
    priority: 8,
  });
}

/**
 * Handle bid accepted - notify contractor
 */
async function handleWorkOrderBidAccepted(event: EventPayload) {
  const { bidId, workOrderId, contractorId, amount } = event.data;

  // Send real-time notification to contractor
  const wsServer = getWebSocketServer();
  if (wsServer) {
    wsServer.broadcastNewMessage(`contractor-${contractorId}`, {
      type: 'bid_accepted',
      workOrderId,
      bidId,
      amount,
    });
  }

  // Create in-app notification
  await jobQueue.schedule({
    type: 'send_notification',
    payload: {
      userId: contractorId,
      type: 'success',
      title: 'Bid Accepted!',
      message: `Your bid of $${amount} has been accepted. Time to get to work!`,
      actionUrl: `/contractor/work-orders/${workOrderId}`,
    },
    scheduledFor: new Date(),
    priority: 9,
  });
}

/**
 * Handle contractor lead matched - notify contractor of new lead
 */
async function handleContractorLeadMatched(event: EventPayload) {
  const { matchId, leadId, contractorId, serviceType, leadScore } = event.data;

  // Send real-time notification
  const wsServer = getWebSocketServer();
  if (wsServer) {
    wsServer.broadcastNewMessage(`contractor-${contractorId}`, {
      type: 'new_lead',
      matchId,
      leadId,
      serviceType,
      leadScore,
    });
  }

  // Create in-app notification
  await jobQueue.schedule({
    type: 'send_notification',
    payload: {
      userId: contractorId,
      type: 'lead',
      title: 'New Lead Available',
      message: `A new ${serviceType} lead (score: ${leadScore}) is waiting for your response`,
      actionUrl: `/contractor/leads/${matchId}`,
    },
    scheduledFor: new Date(),
    priority: 8,
  });
}
