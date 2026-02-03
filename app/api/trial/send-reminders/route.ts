import { NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { sendTrialReminderEmail } from '@/email';

/**
 * Send trial reminder emails
 * This can be called manually or triggered by user actions
 * No cron needed - runs on-demand
 */
export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    const now = new Date();
    let userData = null;
    let trialData = null;
    let remindersSent: any = {};

    // Get user and trial data based on role
    if (role === 'landlord') {
      const landlord = await prisma.landlord.findFirst({
        where: { ownerUserId: userId },
        select: {
          id: true,
          trialEndDate: true,
          trialStatus: true,
          trialRemindersSent: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!landlord || !landlord.owner) {
        return NextResponse.json({ error: 'Landlord not found' }, { status: 404 });
      }

      userData = landlord.owner;
      trialData = landlord;
      remindersSent = (landlord.trialRemindersSent as any) || {};
    } else if (role === 'contractor') {
      const contractor = await prisma.contractorProfile.findFirst({
        where: { userId },
        select: {
          id: true,
          trialEndDate: true,
          trialStatus: true,
          trialRemindersSent: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!contractor) {
        return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
      }

      userData = contractor.user;
      trialData = contractor;
      remindersSent = (contractor.trialRemindersSent as any) || {};
    } else if (role === 'agent') {
      const agent = await prisma.agent.findFirst({
        where: { userId },
        select: {
          id: true,
          trialEndDate: true,
          trialStatus: true,
          trialRemindersSent: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      userData = agent.user;
      trialData = agent;
      remindersSent = (agent.trialRemindersSent as any) || {};
    }

    if (!trialData || !trialData.trialEndDate || !userData) {
      return NextResponse.json({ error: 'No trial data found' }, { status: 404 });
    }

    // Calculate days left
    const trialEndDate = new Date(trialData.trialEndDate);
    const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Determine which reminder to send
    let reminderType: string | null = null;

    if (daysLeft === 7 && !remindersSent.day7) {
      reminderType = 'day7';
    } else if (daysLeft === 3 && !remindersSent.day3) {
      reminderType = 'day3';
    } else if (daysLeft === 1 && !remindersSent.day1) {
      reminderType = 'day1';
    } else if (daysLeft === 0 && !remindersSent.day0) {
      reminderType = 'day0';
    } else if (daysLeft === -1 && !remindersSent.dayMinus1) {
      reminderType = 'dayMinus1';
    }

    if (!reminderType) {
      return NextResponse.json({ 
        message: 'No reminder needed at this time',
        daysLeft,
        remindersSent,
      });
    }

    // Send email
    const subscriptionUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/onboarding/${role}/subscription`;
    
    await sendTrialReminderEmail({
      email: userData.email,
      name: userData.name,
      daysLeft: Math.max(0, daysLeft),
      subscriptionUrl,
      role: role as any,
    });

    // Update reminders sent
    remindersSent[reminderType] = true;

    if (role === 'landlord') {
      await prisma.landlord.update({
        where: { id: trialData.id },
        data: { trialRemindersSent: remindersSent },
      });
    } else if (role === 'contractor') {
      await prisma.contractorProfile.update({
        where: { id: trialData.id },
        data: { trialRemindersSent: remindersSent },
      });
    } else if (role === 'agent') {
      await prisma.agent.update({
        where: { id: trialData.id },
        data: { trialRemindersSent: remindersSent },
      });
    }

    return NextResponse.json({
      success: true,
      reminderType,
      daysLeft,
      email: userData.email,
    });
  } catch (error) {
    console.error('Failed to send trial reminder:', error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}
