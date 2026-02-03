import { Resend } from 'resend';
import { render } from '@react-email/components';
import { SENDER_EMAIL, APP_NAME } from '@/lib/constants';
import { Order } from '@/types';

import PurchaseReceiptEmail from './purchase-receipt';
import VerifyEmail from './verify-email';
import ResetPassword from './reset-password';
import EvictionNoticeEmail from './eviction-notice';
import DepositDispositionEmail from './deposit-disposition';
import AffiliateWelcomeEmail from './affiliate-welcome';
import TrialReminderEmail from './trial-reminder';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender - use your verified domain or Resend's test domain
const getDefaultSender = () => {
  const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
  return `${APP_NAME} <${senderEmail}>`;
};

export const sendPurchaseReceipt = async ({ order }: { order: Order }) => {
  try {
    const html = await render(<PurchaseReceiptEmail order={order} />);

    const { data, error } = await resend.emails.send({
      from: getDefaultSender(),
      to: order.user.email,
      subject: `Order Confirmation ${order.id}`,
      html,
    });

    if (error) {
      console.error('❌ Error sending Purchase Receipt email:', error);
      return { success: false, error };
    }

    console.log('✓ Purchase Receipt Email Sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('❌ Error sending Purchase Receipt email:', err);
    return { success: false, error: err };
  }
};

export const sendVerificationEmail = async ({
  email,
  verificationLink,
}: {
  email: string;
  verificationLink: string;
}) => {
  try {
    const html = await render(<VerifyEmail email={email} verificationLink={verificationLink} />);

    const { data, error } = await resend.emails.send({
      from: getDefaultSender(),
      to: email,
      subject: 'Verify your email address',
      html,
    });

    if (error) {
      console.error('❌ Error sending verification email:', error);
      return { success: false, error };
    }

    console.log('✓ Verification Email Sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('❌ Error sending verification email:', err);
    return { success: false, error: err };
  }
};

export const sendPasswordResetEmail = async ({
  email,
  resetLink,
}: {
  email: string;
  resetLink: string;
}) => {
  try {
    const html = await render(<ResetPassword email={email} resetLink={resetLink} />);

    const { data, error } = await resend.emails.send({
      from: getDefaultSender(),
      to: email,
      subject: 'Reset your password',
      html,
    });

    if (error) {
      console.error('❌ Error sending password reset email:', error);
      throw new Error(error.message);
    }

    console.log('✓ Password Reset Email Sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('❌ Error sending password reset email:', err);
    throw err;
  }
};

// Tenant Lifecycle Emails

export const sendEvictionNoticeEmail = async ({
  email,
  tenantName,
  propertyAddress,
  unitName,
  noticeType,
  reason,
  amountOwed,
  deadlineDate,
  landlordName,
}: {
  email: string;
  tenantName: string;
  propertyAddress: string;
  unitName: string;
  noticeType: string;
  reason: string;
  amountOwed?: number;
  deadlineDate: string;
  landlordName: string;
}) => {
  try {
    const html = await render(
      <EvictionNoticeEmail
        tenantName={tenantName}
        propertyAddress={propertyAddress}
        unitName={unitName}
        noticeType={noticeType}
        reason={reason}
        amountOwed={amountOwed}
        deadlineDate={deadlineDate}
        landlordName={landlordName}
      />
    );

    const noticeTypeLabel = {
      'three_day': '3-Day',
      'seven_day': '7-Day',
      'thirty_day': '30-Day',
    }[noticeType] || noticeType;

    const { data, error } = await resend.emails.send({
      from: `${landlordName} <${process.env.SENDER_EMAIL || 'onboarding@resend.dev'}>`,
      to: email,
      subject: `${noticeTypeLabel} Notice to Vacate - ${propertyAddress}`,
      html,
    });

    if (error) {
      console.error('❌ Error sending Eviction Notice email:', error);
      return { success: false, error };
    }

    console.log('✓ Eviction Notice Email Sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('❌ Error sending Eviction Notice email:', err);
    return { success: false, error: err };
  }
};

export const sendDepositDispositionEmail = async ({
  email,
  tenantName,
  propertyAddress,
  unitName,
  originalDeposit,
  deductions,
  totalDeductions,
  refundAmount,
  refundMethod,
  landlordName,
}: {
  email: string;
  tenantName: string;
  propertyAddress: string;
  unitName: string;
  originalDeposit: number;
  deductions: { category: string; amount: number; description: string }[];
  totalDeductions: number;
  refundAmount: number;
  refundMethod: string;
  landlordName: string;
}) => {
  try {
    const html = await render(
      <DepositDispositionEmail
        tenantName={tenantName}
        propertyAddress={propertyAddress}
        unitName={unitName}
        originalDeposit={originalDeposit}
        deductions={deductions}
        totalDeductions={totalDeductions}
        refundAmount={refundAmount}
        refundMethod={refundMethod}
        landlordName={landlordName}
      />
    );

    const { data, error } = await resend.emails.send({
      from: `${landlordName} <${process.env.SENDER_EMAIL || 'onboarding@resend.dev'}>`,
      to: email,
      subject: `Security Deposit Disposition - ${propertyAddress}`,
      html,
    });

    if (error) {
      console.error('❌ Error sending Deposit Disposition email:', error);
      return { success: false, error };
    }

    console.log('✓ Deposit Disposition Email Sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('❌ Error sending Deposit Disposition email:', err);
    return { success: false, error: err };
  }
};

export const sendOffboardingSummaryEmail = async ({
  email,
  landlordName,
  tenantName,
  propertyAddress,
  unitName,
  departureDate,
  depositRefunded,
  depositDeducted,
  outstandingBalance,
}: {
  email: string;
  landlordName: string;
  tenantName: string;
  propertyAddress: string;
  unitName: string;
  departureDate: string;
  depositRefunded: number;
  depositDeducted: number;
  outstandingBalance: number;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: getDefaultSender(),
      to: email,
      subject: `Tenant Offboarding Complete - ${tenantName} at ${propertyAddress}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Tenant Offboarding Complete</h2>
          <p>The offboarding process for <strong>${tenantName}</strong> has been completed.</p>
          
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Property:</strong> ${propertyAddress}</p>
            <p style="margin: 4px 0;"><strong>Unit:</strong> ${unitName}</p>
            <p style="margin: 4px 0;"><strong>Departure Date:</strong> ${new Date(departureDate).toLocaleDateString()}</p>
          </div>
          
          <h3 style="color: #1e293b;">Financial Summary</h3>
          <ul>
            <li>Deposit Refunded: $${depositRefunded.toLocaleString()}</li>
            <li>Deposit Deducted: $${depositDeducted.toLocaleString()}</li>
            <li>Outstanding Balance: $${outstandingBalance.toLocaleString()}</li>
          </ul>
          
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
            A turnover checklist has been created for this unit. Please complete all items before listing the unit again.
          </p>
          
          <p style="color: #8898aa; font-size: 12px; margin-top: 24px;">
            This notification was sent via ${APP_NAME}.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Error sending Offboarding Summary email:', error);
      return { success: false, error };
    }

    console.log('✓ Offboarding Summary Email Sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('❌ Error sending Offboarding Summary email:', err);
    return { success: false, error: err };
  }
};


// Affiliate Program Emails

export const sendAffiliateWelcomeEmail = async ({
  email,
  affiliateName,
  referralCode,
  referralLink,
  commissionPro,
  commissionEnterprise,
}: {
  email: string;
  affiliateName: string;
  referralCode: string;
  referralLink: string;
  commissionPro: number;
  commissionEnterprise: number;
}) => {
  try {
    const html = await render(
      <AffiliateWelcomeEmail
        affiliateName={affiliateName}
        referralCode={referralCode}
        referralLink={referralLink}
        commissionPro={commissionPro}
        commissionEnterprise={commissionEnterprise}
      />
    );

    const { data, error } = await resend.emails.send({
      from: getDefaultSender(),
      to: email,
      subject: `🎉 Welcome to the ${APP_NAME} Affiliate Program!`,
      html,
    });

    if (error) {
      console.error('❌ Error sending Affiliate Welcome email:', error);
      return { success: false, error };
    }

    console.log('✓ Affiliate Welcome Email Sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('❌ Error sending Affiliate Welcome email:', err);
    return { success: false, error: err };
  }
};

// Generic send email function
export const sendEmail = async ({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: from || getDefaultSender(),
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error };
    }

    console.log('✓ Email Sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('❌ Error sending email:', err);
    return { success: false, error: err };
  }
};

// Trial Reminder Emails
export const sendTrialReminderEmail = async ({
  email,
  name,
  daysLeft,
  subscriptionUrl,
  role,
}: {
  email: string;
  name: string;
  daysLeft: number;
  subscriptionUrl: string;
  role: 'landlord' | 'contractor' | 'agent';
}) => {
  try {
    const html = await render(
      <TrialReminderEmail
        name={name}
        daysLeft={daysLeft}
        subscriptionUrl={subscriptionUrl}
        role={role}
      />
    );

    const subject = daysLeft > 0 
      ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left in your Property Flow HQ trial`
      : 'Your Property Flow HQ trial has ended';

    const { data, error} = await resend.emails.send({
      from: getDefaultSender(),
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Error sending Trial Reminder email:', error);
      return { success: false, error };
    }

    console.log('✓ Trial Reminder Email Sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('❌ Error sending Trial Reminder email:', err);
    return { success: false, error: err };
  }
};
