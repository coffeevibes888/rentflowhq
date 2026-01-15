import { NextRequest, NextResponse } from 'next/server';
import { contractorSchedulerService } from '@/lib/services/contractor-scheduler';
import { Resend } from 'resend';
import { format } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Cron job to send appointment reminders
 * 
 * Requirements:
 * - 9.5: Send reminder notifications 24 hours before appointments
 * 
 * Schedule: Run every hour to catch appointments in the 24-hour window
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointments = await contractorSchedulerService.getAppointmentsNeedingReminders();

    let remindersSent = 0;
    const errors: string[] = [];

    for (const appointment of appointments) {
      try {
        // Send email to contractor
        if (appointment.contractor.email) {
          await resend.emails.send({
            from: 'PropertyFlow <noreply@propertyflow.com>',
            to: appointment.contractor.email,
            subject: `Reminder: Appointment Tomorrow - ${appointment.title}`,
            html: generateContractorReminderEmail(appointment),
          });
        }

        // TODO: Send SMS reminder if phone number is available
        // if (appointment.contractor.phone) {
        //   await sendSMS(appointment.contractor.phone, generateSMSMessage(appointment));
        // }

        remindersSent++;
      } catch (error) {
        console.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
        errors.push(`Appointment ${appointment.id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      appointmentsChecked: appointments.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in appointment reminders cron:', error);
    return NextResponse.json(
      { error: 'Failed to process appointment reminders' },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML email for contractor reminder
 */
function generateContractorReminderEmail(appointment: any): string {
  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .appointment-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .detail-row {
            margin: 10px 0;
            display: flex;
            align-items: start;
          }
          .detail-label {
            font-weight: 600;
            min-width: 120px;
            color: #6b7280;
          }
          .detail-value {
            color: #111827;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Appointment Reminder</h1>
          <p style="margin: 10px 0 0 0;">You have an appointment tomorrow</p>
        </div>
        
        <div class="content">
          <p>Hi ${appointment.contractor.businessName || 'there'},</p>
          
          <p>This is a friendly reminder about your upcoming appointment:</p>
          
          <div class="appointment-details">
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">${appointment.title}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${format(startTime, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">
                ${appointment.address.street}<br>
                ${appointment.address.city}, ${appointment.address.state} ${appointment.address.zip}
              </span>
            </div>
            ${appointment.description ? `
              <div class="detail-row">
                <span class="detail-label">Notes:</span>
                <span class="detail-value">${appointment.description}</span>
              </div>
            ` : ''}
            ${appointment.depositAmount ? `
              <div class="detail-row">
                <span class="detail-label">Deposit:</span>
                <span class="detail-value">
                  $${appointment.depositAmount.toFixed(2)}
                  ${appointment.depositPaid ? '(Paid)' : '(Pending)'}
                </span>
              </div>
            ` : ''}
          </div>
          
          <p>Please make sure you have all necessary tools and materials ready for this appointment.</p>
          
          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/contractor/scheduler" class="button">
              View in Calendar
            </a>
          </center>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Need to reschedule or cancel? Please do so as soon as possible through your dashboard.
          </p>
        </div>
        
        <div class="footer">
          <p>PropertyFlow - Professional Contractor Services</p>
          <p>This is an automated reminder. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate SMS message for appointment reminder
 */
function generateSMSMessage(appointment: any): string {
  const startTime = new Date(appointment.startTime);
  return `Reminder: You have an appointment tomorrow at ${format(startTime, 'h:mm a')} - ${appointment.title}. Location: ${appointment.address.street}, ${appointment.address.city}. View details: ${process.env.NEXT_PUBLIC_APP_URL}/contractor/scheduler`;
}
