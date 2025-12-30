import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, companyName, companyEmail, companyPhone, companyAddress, aboutPhoto } = body;

    // Find landlord by user ID
    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    // Update landlord profile
    const updated = await prisma.landlord.update({
      where: { id: landlord.id },
      data: {
        name: name || landlord.name,
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        aboutPhoto,
      },
    });

    return NextResponse.json({ success: true, landlord: updated });
  } catch (error) {
    console.error('Error updating landlord profile:', error);
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}
