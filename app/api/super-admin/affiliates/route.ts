import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// GET - List all affiliates with stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const affiliates = await prisma.affiliate.findMany({
      where,
      include: {
        _count: {
          select: {
            referrals: true,
            payouts: true,
            clicks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get summary stats
    const totalAffiliates = await prisma.affiliate.count();
    const activeAffiliates = await prisma.affiliate.count({ where: { status: 'active' } });
    const totalReferrals = await prisma.affiliateReferral.count();
    const pendingCommissions = await prisma.affiliateReferral.aggregate({
      where: { commissionStatus: 'pending' },
      _sum: { commissionAmount: true },
    });
    const totalPaid = await prisma.affiliatePayout.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true },
    });

    return NextResponse.json({
      affiliates: affiliates.map(a => ({
        ...a,
        totalEarnings: Number(a.totalEarnings),
        pendingEarnings: Number(a.pendingEarnings),
        paidEarnings: Number(a.paidEarnings),
        commissionBasic: Number(a.commissionBasic),
        commissionPro: Number(a.commissionPro),
        commissionEnterprise: Number(a.commissionEnterprise),
        minimumPayout: Number(a.minimumPayout),
      })),
      stats: {
        totalAffiliates,
        activeAffiliates,
        totalReferrals,
        pendingCommissions: Number(pendingCommissions._sum.commissionAmount || 0),
        totalPaid: Number(totalPaid._sum?.amount || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
  }
}

// POST - Create new affiliate
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, code, paymentMethod, paymentEmail, paymentPhone, notes, commissionBasic, commissionPro, commissionEnterprise } = body;

    if (!name || !email || !code) {
      return NextResponse.json({ error: 'Name, email, and code are required' }, { status: 400 });
    }

    // Check if code already exists
    const existingCode = await prisma.affiliate.findUnique({ where: { code: code.toUpperCase() } });
    if (existingCode) {
      return NextResponse.json({ error: 'Referral code already exists' }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await prisma.affiliate.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered as affiliate' }, { status: 400 });
    }

    const affiliate = await prisma.affiliate.create({
      data: {
        name,
        email,
        phone,
        code: code.toUpperCase(),
        paymentMethod,
        paymentEmail,
        paymentPhone,
        notes,
        commissionBasic: commissionBasic || 5,
        commissionPro: commissionPro || 10,
        commissionEnterprise: commissionEnterprise || 25,
      },
    });

    return NextResponse.json({ affiliate, success: true });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    return NextResponse.json({ error: 'Failed to create affiliate' }, { status: 500 });
  }
}
