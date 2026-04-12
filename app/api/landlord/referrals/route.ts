import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getReferralStats, getReferralLink } from '@/lib/actions/referral.actions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const landlordId = searchParams.get('landlordId');

    if (!landlordId) {
      return NextResponse.json(
        { message: 'Landlord ID is required' },
        { status: 400 }
      );
    }

    const [stats, referralLink] = await Promise.all([
      getReferralStats(landlordId),
      getReferralLink(landlordId),
    ]);

    return NextResponse.json({
      stats,
      referralLink,
    });
  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}
