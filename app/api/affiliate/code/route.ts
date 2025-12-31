import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET - Get affiliate code from cookie
export async function GET() {
  try {
    const cookieStore = await cookies();
    const affiliateCode = cookieStore.get('affiliate_code')?.value;

    return NextResponse.json({
      affiliateCode: affiliateCode || null,
    });
  } catch (error) {
    console.error('Error getting affiliate code:', error);
    return NextResponse.json({ affiliateCode: null });
  }
}
