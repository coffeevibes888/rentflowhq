import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { Resend } from 'resend';
import { APP_NAME } from '@/lib/constants';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, projectType, message } = body ?? {};

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const session = await auth();
    const adminUserId = session?.user?.id ?? null;

    const thread = await prisma.thread.create({
      data: {
        type: 'contact',
        subject: subject || 'New contact message',
        createdByUserId: adminUserId,
        messages: {
          create: {
            senderUserId: null,
            senderName: name,
            senderEmail: email,
            content: [
              projectType ? `Inquiry type: ${projectType}` : null,
              message,
            ]
              .filter(Boolean)
              .join('\n\n'),
            role: 'user',
          },
        },
      },
    });

    // Send email notification to admin
    try {
      const adminEmail = process.env.SMTP_USER || 'allen@rockenmyvibe.com';
      
      await resend.emails.send({
        from: `${APP_NAME} <${process.env.SENDER_EMAIL || 'noreply@rooms4rentlv.com'}>`,
        to: adminEmail,
        replyTo: email,
        subject: `New Contact Form Submission: ${subject || 'No Subject'}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">From</p>
                <p style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 600;">${name}</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #475569;">${email}</p>
              </div>
              
              ${projectType ? `
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Inquiry Type</p>
                <p style="margin: 0; font-size: 14px; color: #1e293b;">${projectType}</p>
              </div>
              ` : ''}
              
              ${subject ? `
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Subject</p>
                <p style="margin: 0; font-size: 14px; color: #1e293b;">${subject}</p>
              </div>
              ` : ''}
              
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
                <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
              
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <a href="mailto:${email}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Reply to ${name}
                </a>
              </div>
            </div>
            
            <p style="margin-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
              This message was sent via the ${APP_NAME} contact form.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send contact notification email:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        threadId: thread.id,
        message: 'Your message has been received.',
      },
      { status: 201 }
    );
  } catch (error) {
    // Log error without exposing sensitive details
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error creating contact message:', error instanceof Error ? error.message : 'Unknown error');
    }
    return NextResponse.json(
      { error: 'Failed to submit message. Please try again later.' },
      { status: 500 }
    );
  }
}
