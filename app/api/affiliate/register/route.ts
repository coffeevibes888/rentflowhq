import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { hash } from '@/lib/encrypt';
import { sendAffiliateWelcomeEmail } from '@/email';
import { notifyNewAffiliate } from '@/lib/services/admin-notifications';
import crypto from 'crypto';

function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      preferredCode,
      paymentMethod,
      paymentEmail,
      paymentPhone,
      bankRoutingNumber,
      bankAccountNumber,
      bankAccountType,
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists as affiliate
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingAffiliate) {
      return NextResponse.json(
        { error: 'An affiliate account with this email already exists' },
        { status: 400 }
      );
    }

    // Generate or validate referral code
    let code = preferredCode?.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (code) {
      // Check if preferred code is available
      const existingCode = await prisma.affiliate.findUnique({
        where: { code },
      });
      if (existingCode) {
        return NextResponse.json(
          { error: 'This referral code is already taken. Please choose another.' },
          { status: 400 }
        );
      }
    } else {
      // Generate unique code
      let attempts = 0;
      code = generateReferralCode();
      while (attempts < 10) {
        const exists = await prisma.affiliate.findUnique({ where: { code } });
        if (!exists) break;
        code = generateReferralCode();
        attempts++;
      }
    }

    // Hash password for user account (if we create one)
    const hashedPassword = await hash(password);

    // Create affiliate record
    const affiliate = await prisma.affiliate.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        code,
        status: 'active',
        paymentMethod: paymentMethod || null,
        paymentEmail: paymentEmail || null,
        paymentPhone: paymentPhone || null,
        bankAccountLast4: bankAccountNumber ? bankAccountNumber.slice(-4) : null,
        // Note: In production, encrypt bank details before storing
      },
    });

    // Also create a user account for the affiliate to log in
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'affiliate',
        },
      });
    }

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.propertyflowhq.com';
    const referralLink = `${baseUrl}?ref=${affiliate.code}`;

    // Send welcome email
    try {
      await sendAffiliateWelcomeEmail({
        email: affiliate.email,
        affiliateName: affiliate.name,
        referralCode: affiliate.code,
        referralLink,
        commissionPro: Number(affiliate.commissionBasic),
        commissionEnterprise: Number(affiliate.commissionPro),
      });
    } catch (emailError) {
      console.error('Failed to send affiliate welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    // Notify admin of new affiliate (non-blocking)
    notifyNewAffiliate({
      name: affiliate.name,
      email: affiliate.email,
      referralCode: affiliate.code,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        code: affiliate.code,
      },
      referralLink,
    });
  } catch (error) {
    console.error('Error registering affiliate:', error);
    return NextResponse.json(
      { error: 'Failed to create affiliate account. Please try again.' },
      { status: 500 }
    );
  }
}
