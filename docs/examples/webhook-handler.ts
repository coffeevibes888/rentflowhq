/**
 * Example Webhook Handler
 * 
 * This is an example of how to receive and verify webhooks from the Property Manager API.
 * Use this as a reference when building your own webhook handler.
 * 
 * This example uses Express.js, but the concepts apply to any framework.
 */

import express from 'express';
import crypto from 'crypto';

const app = express();

// IMPORTANT: Use raw body for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));

// Your webhook secret from the Property Manager dashboard
const WEBHOOK_SECRET = process.env.PROPERTY_MANAGER_WEBHOOK_SECRET!;

/**
 * Verify the webhook signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const parts = signature.split(',');
  const timestampPart = parts.find(p => p.startsWith('t='));
  const signaturePart = parts.find(p => p.startsWith('v1='));

  if (!timestampPart || !signaturePart) {
    console.error('Invalid signature format');
    return false;
  }

  const timestamp = parseInt(timestampPart.slice(2));
  const sig = signaturePart.slice(3);

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    console.error('Webhook timestamp too old');
    return false;
  }

  // Verify signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return sig === expectedSig;
}

/**
 * Webhook endpoint
 */
app.post('/webhooks/property-manager', (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const payload = req.body.toString();

  // Verify signature
  if (!verifySignature(payload, signature, WEBHOOK_SECRET)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse the event
  const event = JSON.parse(payload);

  console.log('Received webhook:', event.type);
  console.log('Event ID:', event.id);
  console.log('Data:', event.data);

  // Handle different event types
  switch (event.type) {
    case 'payment.completed':
      handlePaymentCompleted(event.data);
      break;

    case 'payment.failed':
      handlePaymentFailed(event.data);
      break;

    case 'lease.created':
      handleLeaseCreated(event.data);
      break;

    case 'lease.signed':
      handleLeaseSigned(event.data);
      break;

    case 'maintenance.created':
      handleMaintenanceCreated(event.data);
      break;

    case 'maintenance.resolved':
      handleMaintenanceResolved(event.data);
      break;

    case 'application.submitted':
      handleApplicationSubmitted(event.data);
      break;

    case 'application.approved':
      handleApplicationApproved(event.data);
      break;

    default:
      console.log('Unhandled event type:', event.type);
  }

  // Always respond with 200 to acknowledge receipt
  res.status(200).json({ received: true });
});

/**
 * Event Handlers
 */

function handlePaymentCompleted(data: any) {
  console.log('Payment completed:', data.paymentId);
  console.log('Amount:', data.amount);
  console.log('Tenant:', data.tenantId);
  
  // Example: Update your accounting system
  // await accountingService.recordPayment({
  //   externalId: data.paymentId,
  //   amount: data.amount,
  //   date: new Date(),
  // });
}

function handlePaymentFailed(data: any) {
  console.log('Payment failed:', data.paymentId);
  
  // Example: Send alert to property manager
  // await alertService.sendAlert({
  //   type: 'payment_failed',
  //   message: `Payment ${data.paymentId} failed`,
  // });
}

function handleLeaseCreated(data: any) {
  console.log('New lease created:', data.leaseId);
  console.log('Unit:', data.unitId);
  console.log('Tenant:', data.tenantId);
  
  // Example: Create record in your CRM
  // await crmService.createLease({
  //   leaseId: data.leaseId,
  //   startDate: data.startDate,
  //   rentAmount: data.rentAmount,
  // });
}

function handleLeaseSigned(data: any) {
  console.log('Lease signed:', data.leaseId);
  
  // Example: Trigger onboarding workflow
  // await workflowService.startOnboarding(data.tenantId);
}

function handleMaintenanceCreated(data: any) {
  console.log('New maintenance ticket:', data.ticketId);
  console.log('Title:', data.title);
  console.log('Priority:', data.priority);
  
  // Example: Create ticket in your helpdesk
  // await helpdeskService.createTicket({
  //   externalId: data.ticketId,
  //   title: data.title,
  //   priority: data.priority,
  // });
}

function handleMaintenanceResolved(data: any) {
  console.log('Maintenance resolved:', data.ticketId);
  
  // Example: Close ticket in your helpdesk
  // await helpdeskService.closeTicket(data.ticketId);
}

function handleApplicationSubmitted(data: any) {
  console.log('New application:', data.applicationId);
  console.log('Applicant:', data.applicantName);
  
  // Example: Start background check
  // await backgroundCheckService.initiate(data.applicationId);
}

function handleApplicationApproved(data: any) {
  console.log('Application approved:', data.applicationId);
  
  // Example: Send welcome email
  // await emailService.sendWelcome(data.applicantEmail);
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Webhook handler listening on port ${PORT}`);
});

export default app;
