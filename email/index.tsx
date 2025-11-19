import { Resend } from 'resend';
import { SENDER_EMAIL, APP_NAME } from '@/lib/constants';
import { Order } from '@/types';

import PurchaseReceiptEmail from './purchase-receipt';
import VerifyEmail from './verify-email';
import ResetPassword from './reset-password';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}

const resend = new Resend(apiKey);

// PURCHASE RECEIPT
export const sendPurchaseReceipt = async ({ order }: { order: Order }) => {
  try {
    const result = await resend.emails.send({
      from: `${APP_NAME} <${SENDER_EMAIL}>`,
      to: order.user.email,
      subject: `Order Confirmation ${order.id}`,
      react: <PurchaseReceiptEmail order={order} />,
    });

    console.log("✓ Purchase Receipt Email Sent:", result);
  } catch (err) {
    console.error("❌ Error sending Purchase Receipt email:", err);
  }
};

// VERIFICATION EMAIL
export const sendVerificationEmail = async ({
  email,
  verificationLink,
}: {
  email: string;
  verificationLink: string;
}) => {
  try {
    const result = await resend.emails.send({
      from: `${APP_NAME} <${SENDER_EMAIL}>`,
      to: email,
      subject: 'Verify your email address',
      react: <VerifyEmail email={email} verificationLink={verificationLink} />,
    });

    console.log("✓ Verification Email Sent:", result);
  } catch (err) {
    console.error("❌ Error sending verification email:", err);
  }
};

// PASSWORD RESET EMAIL
export const sendPasswordResetEmail = async ({
  email,
  resetLink,
}: {
  email: string;
  resetLink: string;
}) => {
  try {
    const result = await resend.emails.send({
      from: `${APP_NAME} <${SENDER_EMAIL}>`,
      to: email,
      subject: 'Reset your password',
      react: <ResetPassword email={email} resetLink={resetLink} />,
    });

    console.log("✓ Password Reset Email Sent:", result);
  } catch (err) {
    console.error("❌ Error sending password reset email:", err);
  }
};