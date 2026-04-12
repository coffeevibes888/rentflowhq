'use server';

import { Resend } from 'resend';
import { render } from '@react-email/render';
import RentPaymentReceivedEmail from '@/email/templates/rent-payment-received';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendLandlordPaymentReceivedEmailParams {
  landlordEmail: string;
  landlordName: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amount: string;
  paymentMethod: string;
  paidAt: string;
  estimatedArrival: string;
  logoUrl?: string | null;
}

/**
 * Send email to landlord when a tenant pays rent
 * Notifies them of the payment and estimated bank deposit date
 */
export async function sendLandlordPaymentReceivedEmail({
  landlordEmail,
  landlordName,
  tenantName,
  propertyName,
  unitNumber,
  amount,
  paymentMethod,
  paidAt,
  estimatedArrival,
  logoUrl,
}: SendLandlordPaymentReceivedEmailParams) {
  try {
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

    const emailHtml = await render(
      RentPaymentReceivedEmail({
        landlordName,
        tenantName,
        propertyName,
        unitNumber,
        amount,
        paymentMethod,
        paidAt,
        estimatedArrival,
        logoUrl,
      })
    );

    const { data, error } = await resend.emails.send({
      from: `PropertyFlow HQ <${senderEmail}>`,
      to: landlordEmail,
      subject: `💰 Rent Payment Received - ${amount} from ${tenantName}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send landlord payment email:', error);
      return { success: false, error: error.message };
    }

    console.log('Landlord payment notification sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending landlord payment email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
