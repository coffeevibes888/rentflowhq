import nodemailer from 'nodemailer';
import { prisma } from '@/db/prisma';
import RentReminderEmail from '@/email/templates/rent-reminder';
import { render } from '@react-email/render';
import MaintenanceUpdateEmail from '@/email/templates/maintenance-update';
import ApplicationStatusEmail from '@/email/templates/application-status';
import NotificationEmail from '@/email/templates/notification';

// Create transporter using Zoho SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string | string[];
  subject: string;
  template: 'rent-reminder' | 'maintenance-update' | 'application-status' | 'notification';
  data: any;
  landlordId: string;
}

export async function sendBrandedEmail({ to, subject, template, data, landlordId }: EmailOptions) {
  try {
    // Get landlord information for branding (including logo)
    const landlord = await prisma.landlord.findUnique({
      where: { id: landlordId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        logoUrl: true,
        useSubdomain: true,
      },
    });

    if (!landlord) {
      throw new Error('Landlord not found');
    }

    // Generate email content based on template
    let emailHtml: string;
    let fromEmail: string;
    let fromName: string;

    const subdomain = landlord.subdomain;
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
    
    // IMPORTANT: Zoho SMTP only allows sending from the authenticated email address
    // Use the SMTP_USER as the from email, but set the display name to the landlord's name
    fromEmail = process.env.SMTP_USER || `noreply@${rootDomain}`;
    fromName = landlord.name || 'Property Management';

    switch (template) {
      case 'rent-reminder':
        emailHtml = await render(RentReminderEmail({ ...data, landlord }));
        break;
      case 'maintenance-update':
        emailHtml = await render(MaintenanceUpdateEmail({ ...data, landlord }));
        break;
      case 'application-status':
        emailHtml = await render(ApplicationStatusEmail({ ...data, landlord }));
        break;
      case 'notification':
        emailHtml = await render(NotificationEmail({ ...data, landlord }));
        break;
      default:
        throw new Error('Unknown email template');
    }

    // Send email using Zoho SMTP
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject: `${subject} - ${fromName}`,
      html: emailHtml,
      replyTo: fromEmail, // Reply to the authenticated SMTP email
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

// Specific email functions
export async function sendRentReminder(
  tenantEmail: string,
  tenantName: string,
  propertyName: string,
  unitName: string,
  rentAmount: string,
  dueDate: string,
  landlordId: string,
  paymentUrl: string
) {
  return sendBrandedEmail({
    to: tenantEmail,
    subject: 'Rent Payment Reminder',
    template: 'rent-reminder',
    data: {
      tenantName,
      propertyName,
      unitName,
      rentAmount,
      dueDate,
      paymentUrl,
    },
    landlordId,
  });
}

export async function sendMaintenanceUpdate(
  tenantEmail: string,
  tenantName: string,
  propertyName: string,
  unitName: string,
  ticketTitle: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
  updateMessage: string,
  landlordId: string,
  ticketUrl: string
) {
  return sendBrandedEmail({
    to: tenantEmail,
    subject: 'Maintenance Request Update',
    template: 'maintenance-update',
    data: {
      tenantName,
      propertyName,
      unitName,
      ticketTitle,
      status,
      updateMessage,
      ticketUrl,
    },
    landlordId,
  });
}

export async function sendApplicationStatusUpdate(
  applicantEmail: string,
  applicantName: string,
  propertyName: string,
  unitName: string,
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn',
  message: string,
  landlordId: string,
  applicationUrl: string
) {
  return sendBrandedEmail({
    to: applicantEmail,
    subject: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    template: 'application-status',
    data: {
      applicantName,
      propertyName,
      unitName,
      status,
      message,
      applicationUrl,
    },
    landlordId,
  });
}

// Test email function
export async function testEmailService() {
  try {
    await transporter.verify();
    console.log('SMTP server is ready to send emails');
    return true;
  } catch (error) {
    console.error('SMTP server connection failed:', error);
    return false;
  }
}
