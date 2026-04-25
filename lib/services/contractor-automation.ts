/**
 * Contractor Automation Service
 * Handles the full pipeline: Quote Accepted → Contract → Job → Payment → Completion
 * Mirrors the PM-side tenant automation flow.
 */

import { prisma } from '@/db/prisma';
import { randomBytes } from 'crypto';
import { eventBus } from '@/lib/event-system';

const db = prisma as any;

function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CTR-${year}-${rand}`;
}

function generateJobNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `JOB-${year}-${rand}`;
}

// ── Quote Accepted Pipeline ───────────────────────────────────────────────────

export async function onQuoteAccepted(quoteId: string) {
  const quote = await db.contractorQuote.findUnique({
    where: { id: quoteId },
    include: {
      lead: true,
      contractor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      customer: { select: { id: true, name: true, email: true, phoneNumber: true } },
    },
  });

  if (!quote) throw new Error('Quote not found');

  const contractor = quote.contractor;
  const customer = quote.customer;
  const lead = quote.lead;

  // 1. Ensure customer record exists in contractor's CRM
  const customerRecord = await ensureCustomerRecord({
    contractorId: contractor.id,
    userId: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phoneNumber,
    source: lead?.source || 'marketplace',
  });

  // 2. Create the job
  const job = await createJobFromQuote(quote, customerRecord.id);

  // 3. Create the contract from quote
  const contract = await createContractFromQuote(quote, job.id, contractor, customer);

  // 4. Auto-send the contract for signing
  const signingUrl = await sendContractForSigning(contract.id, contractor);

  // 5. Send email to customer with signing link
  await sendContractEmail({
    customerEmail: customer.email,
    customerName: customer.name,
    contractorName: contractor.businessName || contractor.user.name,
    contractTitle: contract.title,
    contractAmount: quote.totalPrice,
    signingUrl,
  });

  // 6. Notify contractor
  await db.notification.create({
    data: {
      userId: contractor.user.id,
      type: 'reminder',
      title: 'Quote Accepted!',
      message: `${customer.name} accepted your quote "${quote.title}". A contract has been auto-generated and sent for signing.`,
      actionUrl: `/contractor/contracts/${contract.id}`,
    },
  });

  // 7. Update lead stage if applicable
  if (lead) {
    await db.contractorLead.update({
      where: { id: lead.id },
      data: {
        stage: 'won',
        convertedToJobId: job.id,
      },
    });
  }

  // 8. Emit events for downstream automation
  await eventBus.emit('contractor.quote.accepted', {
    quoteId: quote.id,
    jobId: job.id,
    contractId: contract.id,
    contractorId: contractor.id,
    customerId: customer.id,
    contractorUserId: contractor.user.id,
  });

  return { job, contract, signingUrl };
}

// ── Contract Signed Pipeline ──────────────────────────────────────────────────

export async function onContractSigned(contractId: string) {
  const contract = await db.contractorContract.findUnique({
    where: { id: contractId },
    include: {
      job: true,
      contractor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!contract) return;

  // 1. Transition job to "scheduled"
  if (contract.job) {
    await db.contractorJob.update({
      where: { id: contract.job.id },
      data: {
        status: 'scheduled',
      },
    });

    await eventBus.emit('contractor.job.status_changed', {
      jobId: contract.job.id,
      previousStatus: contract.job.status,
      newStatus: 'scheduled',
      contractorId: contract.contractorId,
      contractorUserId: contract.contractor.user.id,
    });
  }

  // 2. Notify contractor
  await db.notification.create({
    data: {
      userId: contract.contractor.user.id,
      type: 'reminder',
      title: 'Contract Signed — Ready to Schedule',
      message: `${contract.customerName} signed "${contract.title}". The job is now ready to be scheduled.`,
      actionUrl: contract.job
        ? `/contractor/jobs/${contract.job.id}`
        : `/contractor/contracts/${contract.id}`,
    },
  });

  // 3. Emit event
  await eventBus.emit('contractor.contract.signed', {
    contractId: contract.id,
    jobId: contract.job?.id,
    contractorId: contract.contractorId,
    contractorUserId: contract.contractor.user.id,
    customerName: contract.customerName,
    customerEmail: contract.customerEmail,
  });
}

// ── Job Status Change Pipeline ────────────────────────────────────────────────

export async function onJobStatusChanged(
  jobId: string,
  previousStatus: string,
  newStatus: string
) {
  const job = await db.contractorJob.findUnique({
    where: { id: jobId },
    include: {
      contractor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      customer: true,
    },
  });

  if (!job) return;

  // Job started → notify customer
  if (newStatus === 'in_progress' && previousStatus !== 'in_progress') {
    if (job.customer?.userId) {
      await db.notification.create({
        data: {
          userId: job.customer.userId,
          type: 'reminder',
          title: 'Work Has Started',
          message: `${job.contractor.businessName || 'Your contractor'} has started work on "${job.title}".`,
          actionUrl: `/customer/jobs/${job.id}`,
        },
      });
    }
  }

  // Job completed → notify customer, request review
  if (newStatus === 'completed' && previousStatus !== 'completed') {
    if (job.customer?.userId) {
      await db.notification.create({
        data: {
          userId: job.customer.userId,
          type: 'reminder',
          title: 'Job Completed — Review Required',
          message: `${job.contractor.businessName || 'Your contractor'} has marked "${job.title}" as complete. Please review and approve.`,
          actionUrl: `/customer/jobs/${job.id}`,
        },
      });
    }

    // Auto-generate final invoice
    await eventBus.emit('contractor.job.completed', {
      jobId: job.id,
      contractorId: job.contractorId,
      contractorUserId: job.contractor.user.id,
      customerId: job.customer?.id,
      customerUserId: job.customer?.userId,
      totalCost: job.actualCost || job.estimatedCost,
    });
  }

  // Job approved by customer → trigger payment
  if (newStatus === 'approved' && previousStatus !== 'approved') {
    await eventBus.emit('contractor.job.approved', {
      jobId: job.id,
      contractorId: job.contractorId,
      contractorUserId: job.contractor.user.id,
    });
  }
}

// ── Helper Functions ──────────────────────────────────────────────────────────

async function ensureCustomerRecord({
  contractorId,
  userId,
  name,
  email,
  phone,
  source,
}: {
  contractorId: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
}) {
  // Check if customer already exists for this contractor
  const existing = await db.contractorCustomer.findFirst({
    where: {
      contractorId,
      email,
    },
  });

  if (existing) {
    // Upgrade status if still a lead
    if (existing.status === 'lead' || existing.status === 'prospect') {
      await db.contractorCustomer.update({
        where: { id: existing.id },
        data: { status: 'customer', userId },
      });
    }
    return existing;
  }

  return db.contractorCustomer.create({
    data: {
      contractorId,
      userId,
      name,
      email,
      phone,
      status: 'customer',
      source,
    },
  });
}

async function createJobFromQuote(quote: any, customerRecordId: string) {
  let jobNumber = generateJobNumber();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.contractorJob.findUnique({ where: { jobNumber } });
    if (!existing) break;
    jobNumber = generateJobNumber();
    attempts++;
  }

  return db.contractorJob.create({
    data: {
      contractorId: quote.contractorId,
      customerId: customerRecordId,
      leadId: quote.leadId,
      jobNumber,
      title: quote.title,
      description: quote.projectScope || quote.description,
      status: 'approved',
      estimatedCost: quote.totalPrice,
      laborCost: quote.hourlyRate
        ? quote.hourlyRate * (quote.estimatedHours || 0)
        : null,
      estimatedStartDate: quote.startDate,
      estimatedEndDate: quote.completionDate,
      estimatedHours: quote.estimatedHours
        ? Math.round(Number(quote.estimatedHours))
        : null,
      priority: 'normal',
    },
  });
}

async function createContractFromQuote(
  quote: any,
  jobId: string,
  contractor: any,
  customer: any
) {
  let contractNumber = generateContractNumber();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.contractorContract.findUnique({
      where: { contractNumber },
    });
    if (!existing) break;
    contractNumber = generateContractNumber();
    attempts++;
  }

  const contractBody = generateContractBody(quote, contractor, customer);

  return db.contractorContract.create({
    data: {
      contractorId: contractor.id,
      jobId,
      contractNumber,
      title: `Service Agreement — ${quote.title}`,
      type: 'service_agreement',
      body: contractBody,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phoneNumber || null,
      contractorName: contractor.businessName || contractor.user.name,
      contractorEmail: contractor.email || contractor.user.email,
      contractorPhone: contractor.phone || null,
      contractAmount: quote.totalPrice,
      depositAmount: quote.paymentTerms === 'upfront' ? quote.totalPrice : null,
      paymentTerms: quote.paymentTerms || 'due_on_completion',
      expiresAt: new Date(Date.now() + 14 * 86_400_000), // 14 days to sign
      notes: quote.notes,
      status: 'draft',
    },
  });
}

async function sendContractForSigning(contractId: string, contractor: any) {
  const token = randomBytes(32).toString('hex');

  await db.contractorContract.update({
    where: { id: contractId },
    data: {
      token,
      status: 'sent',
      sentAt: new Date(),
    },
  });

  await db.contractorContractEvent.create({
    data: {
      contractId,
      eventType: 'sent',
      actor: 'system',
      actorName: 'Automation',
      note: 'Auto-sent after quote acceptance',
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return `${baseUrl}/sign/contractor/${token}`;
}

function generateContractBody(quote: any, contractor: any, customer: any): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const deliverables = (quote.deliverables || [])
    .map((d: string, i: number) => `  ${i + 1}. ${d}`)
    .join('\n');

  return `SERVICE AGREEMENT

Date: ${today}
Contract #: [Auto-assigned]

BETWEEN:
Contractor: ${contractor.businessName || contractor.user.name}
Email: ${contractor.email || contractor.user.email}
${contractor.phone ? `Phone: ${contractor.phone}` : ''}

AND:
Client: ${customer.name}
Email: ${customer.email}
${customer.phoneNumber ? `Phone: ${customer.phoneNumber}` : ''}

─────────────────────────────────────────────

1. SCOPE OF WORK

${quote.title}

${quote.projectScope || quote.description || 'As discussed and agreed upon.'}

${deliverables ? `Deliverables:\n${deliverables}` : ''}

2. TIMELINE

${quote.startDate ? `Estimated Start: ${new Date(quote.startDate).toLocaleDateString()}` : 'Start date to be scheduled after signing.'}
${quote.completionDate ? `Estimated Completion: ${new Date(quote.completionDate).toLocaleDateString()}` : ''}
${quote.estimatedHours ? `Estimated Hours: ${quote.estimatedHours}` : ''}

3. PRICING

Total Price: $${Number(quote.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
${Number(quote.discount) > 0 ? `Discount Applied: $${Number(quote.discount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}
${Number(quote.tax) > 0 ? `Tax: $${Number(quote.tax).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}

4. PAYMENT TERMS

${quote.paymentTerms === 'upfront' ? 'Full payment due before work begins.' : ''}${quote.paymentTerms === 'milestone' ? 'Payment due at completion of each milestone.' : ''}${quote.paymentTerms === 'net_30' ? 'Payment due within 30 days of invoice.' : ''}${!quote.paymentTerms || quote.paymentTerms === 'due_on_completion' ? 'Payment due upon completion of work.' : ''}

5. WARRANTY

${quote.warranty || 'Standard workmanship warranty applies. Contractor guarantees quality of work for 30 days after completion.'}

6. TERMS & CONDITIONS

a) Any changes to the scope of work must be agreed upon in writing by both parties.
b) Either party may cancel this agreement with 48 hours written notice.
c) The contractor is not liable for delays caused by weather, material shortages, or other circumstances beyond their control.
d) All work will be performed in a professional manner and in compliance with applicable codes and regulations.

${quote.notes ? `7. ADDITIONAL NOTES\n\n${quote.notes}` : ''}

─────────────────────────────────────────────

By signing below, both parties agree to the terms outlined in this agreement.`;
}

// ── Email Sending ─────────────────────────────────────────────────────────────

async function sendContractEmail({
  customerEmail,
  customerName,
  contractorName,
  contractTitle,
  contractAmount,
  signingUrl,
}: {
  customerEmail: string;
  customerName: string;
  contractorName: string;
  contractTitle: string;
  contractAmount: any;
  signingUrl: string;
}) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

    const amount = Number(contractAmount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    await resend.emails.send({
      from: `PropertyFlowHQ <${senderEmail}>`,
      to: customerEmail,
      subject: `Contract Ready to Sign: ${contractTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0891b2, #2563eb); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Contract Ready for Signing</h1>
          </div>
          
          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #374151;">Hi ${customerName},</p>
            
            <p style="color: #6b7280;">
              <strong>${contractorName}</strong> has prepared a service agreement for your review and signature.
            </p>
            
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px; font-weight: 600; color: #111827;">${contractTitle}</p>
              <p style="margin: 0; color: #6b7280;">Contract Amount: <strong style="color: #059669;">${amount}</strong></p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${signingUrl}" style="display: inline-block; background: linear-gradient(135deg, #0891b2, #2563eb); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Review & Sign Contract
              </a>
            </div>
            
            <p style="font-size: 13px; color: #9ca3af; text-align: center;">
              This link expires in 14 days. If you have questions, reply directly to ${contractorName}.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">Secured by PropertyFlowHQ</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send contract email:', error);
  }
}
