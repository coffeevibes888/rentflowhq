'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/email';
import { hash } from '../encrypt';
import { randomBytes } from 'crypto';

const generateToken = () => randomBytes(32).toString('hex');

const getVerificationEmailLink = (token: string) =>
  `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}`;

const getPasswordResetLink = (token: string) =>
  `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token}`;

export async function sendVerificationEmailToken(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    const verificationLink = getVerificationEmailLink(token);

    try {
      await sendVerificationEmail({
        email,
        verificationLink,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return {
        success: false,
        message: `Failed to send verification email: ${formatError(error)}`,
      };
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function verifyEmail(token: string) {
  try {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, message: 'Invalid or expired token' };
    }

    if (verificationToken.expires < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return { success: false, message: 'Token has expired' };
    }

    await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() },
    });

    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    const resetLink = getPasswordResetLink(token);

    try {
      await sendPasswordResetEmail({
        email,
        resetLink,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return {
        success: false,
        message: `Failed to send password reset email: ${formatError(error)}`,
      };
    }

    return {
      success: true,
      message: 'Password reset email sent successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!passwordResetToken) {
      return { success: false, message: 'Invalid or expired token' };
    }

    if (passwordResetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      });
      return { success: false, message: 'Token has expired' };
    }

    const hashedPassword = await hash(newPassword);

    await prisma.user.update({
      where: { email: passwordResetToken.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: passwordResetToken.id },
    });

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function sendPhoneOtp(userId: string, phoneNumber: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const otp = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.phoneVerificationToken.create({
      data: {
        userId,
        phone: phoneNumber,
        otp,
        expires,
      },
    });

    try {
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        console.error('Twilio credentials not configured');
        return {
          success: false,
          message: 'SMS service not configured',
        };
      }

      const auth = Buffer.from(
        `${twilioAccountSid}:${twilioAuthToken}`
      ).toString('base64');

      const params = new URLSearchParams();
      params.append('From', twilioPhoneNumber);
      params.append('To', phoneNumber);
      params.append('Body', `Your verification code is: ${otp}. This code will expire in 10 minutes.`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Twilio SMS error:', error);
        return {
          success: false,
          message: 'Failed to send verification code',
        };
      }
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError);
      return {
        success: false,
        message: 'Failed to send verification code via SMS',
      };
    }

    return {
      success: true,
      message: 'Verification code sent to your phone',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function verifyPhoneOtp(userId: string, otp: string) {
  try {
    const verificationToken = await prisma.phoneVerificationToken.findFirst({
      where: { userId, otp },
    });

    if (!verificationToken) {
      return { success: false, message: 'Invalid verification code' };
    }

    if (verificationToken.expires < new Date()) {
      await prisma.phoneVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return { success: false, message: 'Verification code has expired' };
    }

    if (verificationToken.attempts >= 3) {
      await prisma.phoneVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new code.',
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber: verificationToken.phone,
        phoneVerified: new Date(),
      },
    });

    await prisma.phoneVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    return { success: true, message: 'Phone number verified successfully' };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function incrementPhoneOtpAttempts(userId: string, otp: string) {
  try {
    const verificationToken = await prisma.phoneVerificationToken.findFirst({
      where: { userId, otp },
    });

    if (verificationToken) {
      await prisma.phoneVerificationToken.update({
        where: { id: verificationToken.id },
        data: { attempts: { increment: 1 } },
      });
    }
  } catch (error) {
    console.error('Failed to increment OTP attempts:', error);
  }
}
