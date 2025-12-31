import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ valid: false, error: 'No code provided' });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true, status: true, name: true },
    });

    if (!affiliate) {
      return NextResponse.json({ valid: false });
    }

    if (affiliate.status !== 'active') {
      return NextResponse.json({ valid: false, error: 'Referral code is no longer active' });
    }

    return NextResponse.json({ 
      valid: true,
      affiliateName: affiliate.name.split(' ')[0], // First name only for privacy
    });
  } catch (error) {
    console.error('Error validating affiliate code:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate code' });
  }
}
