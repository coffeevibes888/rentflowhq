import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

/**
 * Check if the current user is an affiliate
 * Used to show/hide affiliate dashboard link in navigation
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ isAffiliate: false });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        code: true, 
        status: true,
        totalEarnings: true,
        pendingEarnings: true,
      },
    });

    if (!affiliate) {
      return NextResponse.json({ isAffiliate: false });
    }

    return NextResponse.json({
      isAffiliate: true,
      affiliateCode: affiliate.code,
      status: affiliate.status,
      totalEarnings: Number(affiliate.totalEarnings),
      pendingEarnings: Number(affiliate.pendingEarnings),
    });
  } catch (error) {
    console.error('Error checking affiliate status:', error);
    return NextResponse.json({ isAffiliate: false });
  }
}
