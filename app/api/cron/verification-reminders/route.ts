import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import VerificationReminderEmail from '@/email/templates/verification-reminder';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Cron job to send verification expiration reminders
 * 
 * Requirements:
 * - 1.4: License expiration reminders (30 days)
 * - 2.3: Insurance expiration reminders (14 days)
 * - 3.5: Background check expiration reminders (30 days)
 * 
 * Schedule: Run daily at 9 AM
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const remindersSent = {
      license: 0,
      insurance: 0,
      backgroundCheck: 0,
    };

    // Calculate reminder dates
    const licenseReminderDate = new Date(now);
    licenseReminderDate.setDate(licenseReminderDate.getDate() + 30);

    const insuranceReminderDate = new Date(now);
    insuranceReminderDate.setDate(insuranceReminderDate.getDate() + 14);

    const backgroundCheckReminderDate = new Date(now);
    backgroundCheckReminderDate.setDate(backgroundCheckReminderDate.getDate() + 30);

    // Find contractors with expiring licenses (30 days)
    const contractorsWithExpiringLicense = await prisma.contractorProfile.findMany({
      where: {
        licenseVerifiedAt: { not: null },
        licenseExpiresAt: {
          gte: now,
          lte: licenseReminderDate,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Send license expiration reminders
    for (const contractor of contractorsWithExpiringLicense) {
      if (!contractor.user.email || !contractor.licenseExpiresAt) continue;

      const daysUntilExpiration = Math.ceil(
        (contractor.licenseExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const emailHtml = await render(
        VerificationReminderEmail({
          contractorName: contractor.user.name || contractor.businessName,
          verificationType: 'license',
          expirationDate: contractor.licenseExpiresAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          daysUntilExpiration,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contractor/settings/verification`,
        })
      );

      try {
        await resend.emails.send({
          from: `PropertyFlow <${process.env.SENDER_EMAIL || 'onboarding@resend.dev'}>`,
          to: contractor.user.email,
          subject: 'License Expiring Soon - Action Required',
          html: emailHtml,
        });

        remindersSent.license++;
      } catch (error) {
        console.error(`Failed to send license reminder to ${contractor.user.email}:`, error);
      }
    }

    // Find contractors with expiring insurance (14 days)
    // Note: We don't have insuranceExpiresAt in the schema, so we'll need to add it
    // For now, we'll skip this check and log a warning
    console.warn('Insurance expiration tracking not yet implemented - insuranceExpiresAt field needed');

    // Find contractors with expiring background checks (30 days)
    const contractorsWithExpiringBackgroundCheck = await prisma.contractorProfile.findMany({
      where: {
        backgroundCheckDate: { not: null },
        backgroundCheckExpires: {
          gte: now,
          lte: backgroundCheckReminderDate,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Send background check expiration reminders
    for (const contractor of contractorsWithExpiringBackgroundCheck) {
      if (!contractor.user.email || !contractor.backgroundCheckExpires) continue;

      const daysUntilExpiration = Math.ceil(
        (contractor.backgroundCheckExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const emailHtml = await render(
        VerificationReminderEmail({
          contractorName: contractor.user.name || contractor.businessName,
          verificationType: 'background_check',
          expirationDate: contractor.backgroundCheckExpires.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          daysUntilExpiration,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/contractor/settings/verification`,
        })
      );

      try {
        await resend.emails.send({
          from: `PropertyFlow <${process.env.SENDER_EMAIL || 'onboarding@resend.dev'}>`,
          to: contractor.user.email,
          subject: 'Background Check Expiring Soon - Action Required',
          html: emailHtml,
        });

        remindersSent.backgroundCheck++;
      } catch (error) {
        console.error(`Failed to send background check reminder to ${contractor.user.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Verification reminders cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to send verification reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
