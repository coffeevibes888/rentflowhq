import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
      select: {
        petDepositAmount: true,
        petDepositEnabled: true,
        petRentAmount: true,
        petRentEnabled: true,
        cleaningFeeAmount: true,
        cleaningFeeEnabled: true,
        applicationFeeAmount: true,
        applicationFeeEnabled: true,
        securityDepositMonths: true,
        lastMonthRentRequired: true,
        feeApplyToAll: true,
        feeSelectedProperties: true,
      },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: {
        petDeposit: landlord.petDepositAmount ?? 300,
        petDepositEnabled: landlord.petDepositEnabled ?? false,
        petRent: landlord.petRentAmount ?? 50,
        petRentEnabled: landlord.petRentEnabled ?? false,
        cleaningFee: landlord.cleaningFeeAmount ?? 150,
        cleaningFeeEnabled: landlord.cleaningFeeEnabled ?? false,
        applicationFee: landlord.applicationFeeAmount ?? 50,
        applicationFeeEnabled: landlord.applicationFeeEnabled ?? true,
        securityDepositMonths: landlord.securityDepositMonths ?? 1,
        lastMonthRentRequired: landlord.lastMonthRentRequired ?? true,
      },
      applyToAll: landlord.feeApplyToAll ?? true,
      selectedProperties: landlord.feeSelectedProperties ?? [],
    });
  } catch (error) {
    console.error('Error fetching fee settings:', error);
    return NextResponse.json({ message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    await prisma.landlord.update({
      where: { id: landlord.id },
      data: {
        petDepositAmount: body.petDeposit,
        petDepositEnabled: body.petDepositEnabled,
        petRentAmount: body.petRent,
        petRentEnabled: body.petRentEnabled,
        cleaningFeeAmount: body.cleaningFee,
        cleaningFeeEnabled: body.cleaningFeeEnabled,
        applicationFeeAmount: body.applicationFee,
        applicationFeeEnabled: body.applicationFeeEnabled,
        securityDepositMonths: body.securityDepositMonths,
        lastMonthRentRequired: body.lastMonthRentRequired,
        feeApplyToAll: body.applyToAll,
        feeSelectedProperties: body.selectedProperties ?? [],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating fee settings:', error);
    return NextResponse.json({ message: 'Failed to update settings' }, { status: 500 });
  }
}
