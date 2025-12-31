import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// GET - Get single affiliate with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        referrals: {
          include: {
            landlord: {
              select: {
                id: true,
                name: true,
                subdomain: true,
                subscriptionTier: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
        },
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    return NextResponse.json({
      affiliate: {
        ...affiliate,
        totalEarnings: Number(affiliate.totalEarnings),
        pendingEarnings: Number(affiliate.pendingEarnings),
        paidEarnings: Number(affiliate.paidEarnings),
        commissionBasic: Number(affiliate.commissionBasic),
        commissionPro: Number(affiliate.commissionPro),
        commissionEnterprise: Number(affiliate.commissionEnterprise),
        minimumPayout: Number(affiliate.minimumPayout),
        referrals: affiliate.referrals.map(r => ({
          ...r,
          subscriptionPrice: Number(r.subscriptionPrice),
          commissionAmount: Number(r.commissionAmount),
        })),
        payouts: affiliate.payouts.map(p => ({
          ...p,
          amount: Number(p.amount),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching affiliate:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliate' }, { status: 500 });
  }
}

// PATCH - Update affiliate
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      name,
      email,
      phone,
      code,
      status,
      commissionBasic,
      commissionPro,
      commissionEnterprise,
      paymentMethod,
      paymentEmail,
      paymentPhone,
      minimumPayout,
      tier,
      notes,
    } = body;

    // Check if code is being changed and if it's unique
    if (code) {
      const existingCode = await prisma.affiliate.findFirst({
        where: { code: code.toUpperCase(), NOT: { id } },
      });
      if (existingCode) {
        return NextResponse.json({ error: 'Referral code already exists' }, { status: 400 });
      }
    }

    const affiliate = await prisma.affiliate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(code && { code: code.toUpperCase() }),
        ...(status && { status }),
        ...(commissionBasic !== undefined && { commissionBasic }),
        ...(commissionPro !== undefined && { commissionPro }),
        ...(commissionEnterprise !== undefined && { commissionEnterprise }),
        ...(paymentMethod && { paymentMethod }),
        ...(paymentEmail !== undefined && { paymentEmail }),
        ...(paymentPhone !== undefined && { paymentPhone }),
        ...(minimumPayout !== undefined && { minimumPayout }),
        ...(tier && { tier }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ affiliate, success: true });
  } catch (error) {
    console.error('Error updating affiliate:', error);
    return NextResponse.json({ error: 'Failed to update affiliate' }, { status: 500 });
  }
}

// DELETE - Delete affiliate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.affiliate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting affiliate:', error);
    return NextResponse.json({ error: 'Failed to delete affiliate' }, { status: 500 });
  }
}
