import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { SUBSCRIPTION_TIERS, normalizeTier } from '@/lib/config/subscription-tiers';
import { zillowService } from '@/lib/services/zillow.service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check subscription tier - Zillow features require Pro tier
    const landlordResult = await getOrCreateCurrentLandlord();
    if (!landlordResult.success) {
      return NextResponse.json(
        { error: 'Landlord account not found' },
        { status: 403 }
      );
    }

    const tier = normalizeTier(landlordResult.landlord.subscriptionTier);
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    
    if (!tierConfig.features.zillowComps) {
      return NextResponse.json(
        { 
          error: 'Zillow property data requires a Pro subscription',
          requiresUpgrade: true,
          currentTier: tier,
        },
        { status: 403 }
      );
    }

    // Get address from query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Search for property
    const result = await zillowService.getPropertyByAddress(address);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Zillow search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search property' },
      { status: 500 }
    );
  }
}
