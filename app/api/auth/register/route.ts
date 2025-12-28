import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { hash } from '@/lib/encrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, inviteToken } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password);

    // Determine role - team members get property_manager role
    const userRole = role || 'property_manager';

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: userRole,
        emailVerified: inviteToken ? new Date() : null, // Auto-verify if coming from invite
      },
    });

    // If there's an invite token, update the team member record with the new user ID
    if (inviteToken) {
      try {
        await (prisma as any).teamMember.updateMany({
          where: {
            inviteToken,
            status: 'pending',
          },
          data: {
            userId: user.id,
          },
        });
      } catch (error) {
        console.error('Failed to link user to team invite:', error);
        // Don't fail registration if this fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create account' },
      { status: 500 }
    );
  }
}
