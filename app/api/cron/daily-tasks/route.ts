import { NextRequest, NextResponse } from 'next/server';

// Combined daily tasks cron job
// Runs: rent reminders, late fees, lease signing reminders, check unit limits
// Schedule: 9 AM UTC daily

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret is set
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results: Record<string, any> = {};
  const errors: string[] = [];

  // 1. Rent Reminders
  try {
    const { processRentReminders } = await import('@/lib/actions/rent-automation.actions');
    const reminderResult = await processRentReminders();
    results.rentReminders = reminderResult;
  } catch (error) {
    console.error('Rent reminders error:', error);
    errors.push(`Rent reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 2. Late Fees
  try {
    const { processLateFees } = await import('@/lib/actions/rent-automation.actions');
    const lateFeeResult = await processLateFees();
    results.lateFees = lateFeeResult;
  } catch (error) {
    console.error('Late fees error:', error);
    errors.push(`Late fees: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 3. Lease Signing Reminders
  try {
    const { prisma } = await import('@/db/prisma');
    const { Resend } = await import('resend');
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const pendingLeases = await prisma.lease.findMany({
      where: {
        status: 'pending_signature',
        startDate: { lte: threeDaysFromNow },
      },
      include: {
        tenant: true,
        unit: { include: { property: true } },
      },
    });

    if (pendingLeases.length > 0 && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      let sent = 0;
      
      for (const lease of pendingLeases) {
        if (lease.tenant?.email) {
          try {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || 'noreply@example.com',
              to: lease.tenant.email,
              subject: 'Reminder: Please sign your lease agreement',
              html: `<p>Hi ${lease.tenant.name || 'there'},</p>
                <p>This is a reminder that your lease for ${lease.unit?.property?.name} - ${lease.unit?.name} is awaiting your signature.</p>
                <p>Please sign it before your move-in date.</p>`,
            });
            sent++;
          } catch (e) {
            console.error('Failed to send lease reminder:', e);
          }
        }
      }
      results.leaseReminders = { pending: pendingLeases.length, sent };
    } else {
      results.leaseReminders = { pending: pendingLeases.length || 0, sent: 0 };
    }
  } catch (error) {
    console.error('Lease reminders error:', error);
    errors.push(`Lease reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 4. Check Unit Limits
  try {
    const { checkAndNotifyAllLandlords } = await import('@/lib/actions/subscription.actions');
    const unitLimitResult = await checkAndNotifyAllLandlords();
    results.unitLimits = { notified: unitLimitResult.length };
  } catch (error) {
    console.error('Unit limits error:', error);
    errors.push(`Unit limits: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return NextResponse.json({
    success: errors.length === 0,
    timestamp: new Date().toISOString(),
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
