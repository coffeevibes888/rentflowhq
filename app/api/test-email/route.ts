import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'RESEND_API_KEY not configured in environment variables'
      }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    // Send test email using verified domain
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: `Property Management <${senderEmail}>`,
      to: email,
      subject: 'Test Email from Property Management App',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e293b;">Email Test Successful! ✅</h2>
          <p>This is a test email to verify your Resend configuration is working correctly.</p>
          <p>Your email system is now ready to send:</p>
          <ul>
            <li>Password reset emails</li>
            <li>Email verification</li>
            <li>Application status updates</li>
            <li>Rent reminders</li>
            <li>Maintenance updates</li>
            <li>And more!</li>
          </ul>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Test email error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send test email',
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully! Check your inbox.',
      messageId: data?.id
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
