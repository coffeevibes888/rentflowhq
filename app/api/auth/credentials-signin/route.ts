import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/auth';
import { prisma } from '@/db/prisma';
import { getSubdomainRedirectUrl } from '@/lib/utils/subdomain-redirect';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const callbackUrl = formData.get('callbackUrl') as string;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    }

    // Attempt sign in
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    // Get the authenticated user to determine redirect
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Determine redirect URL
    const hasSpecificCallback = callbackUrl && callbackUrl.trim().startsWith('/') && callbackUrl.trim() !== '/';
    const redirectUrl = hasSpecificCallback 
      ? callbackUrl.trim()
      : await getSubdomainRedirectUrl(user.role, user.id);

    return NextResponse.json({ 
      success: true, 
      redirectUrl,
    });
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
  }
}
