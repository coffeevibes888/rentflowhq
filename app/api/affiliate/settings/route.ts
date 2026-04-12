import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// GET - Get affiliate settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        code: true,
        status: true,
        paymentMethod: true,
        paymentEmail: true,
        paymentPhone: true,
        bankAccountLast4: true,
        minimumPayout: true,
        tier: true,
        commissionBasic: true,
        commissionPro: true,
        commissionEnterprise: true,
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    return NextResponse.json({
      affiliate: {
        ...affiliate,
        minimumPayout: Number(affiliate.minimumPayout),
        commissionBasic: Number(affiliate.commissionBasic),
        commissionPro: Number(affiliate.commissionPro),
        commissionEnterprise: Number(affiliate.commissionEnterprise),
      },
    });
  } catch (error) {
    console.error('Error fetching affiliate settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH - Update affiliate settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { email: session.user.email },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      paymentMethod,
      paymentEmail,
      paymentPhone,
      bankRoutingNumber,
      bankAccountNumber,
      bankAccountType,
    } = body;

    // Build update data
    const updateData: any = {};

    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
      
      // Clear other payment fields when changing method
      updateData.paymentEmail = null;
      updateData.paymentPhone = null;
      updateData.bankAccountLast4 = null;

      if (paymentMethod === 'paypal' && paymentEmail) {
        updateData.paymentEmail = paymentEmail;
      } else if (paymentMethod === 'venmo' && paymentPhone) {
        updateData.paymentPhone = paymentPhone;
      } else if (paymentMethod === 'bank' && bankAccountNumber) {
        updateData.bankAccountLast4 = bankAccountNumber.slice(-4);
        // Note: In production, encrypt and store full bank details securely
      }
    }

    const updatedAffiliate = await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        paymentMethod: true,
        paymentEmail: true,
        paymentPhone: true,
        bankAccountLast4: true,
      },
    });

    return NextResponse.json({
      success: true,
      affiliate: updatedAffiliate,
    });
  } catch (error) {
    console.error('Error updating affiliate settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
