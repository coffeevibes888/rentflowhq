import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { generateLeaseHtml, buildLeaseDataFromRecords, LeaseBuilderData, LEASE_DEFAULTS } from '@/lib/services/lease-builder';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });

    if (!landlord) {
      return NextResponse.json({ message: 'Landlord not found' }, { status: 404 });
    }

    const body = await req.json();
    const { propertyId, unitId, tenantId, leaseTerms, customizations } = body;

    // Fetch property
    const property = await prisma.property.findFirst({
      where: { id: propertyId, landlordId: landlord.id },
    });

    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    // Fetch unit
    const unit = await prisma.unit.findFirst({
      where: { id: unitId, propertyId },
    });

    if (!unit) {
      return NextResponse.json({ message: 'Unit not found' }, { status: 404 });
    }

    // Fetch tenant if provided
    let tenant = null;
    if (tenantId) {
      tenant = await prisma.user.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, email: true },
      });
    }

    // Build lease data
    const leaseData = buildLeaseDataFromRecords({
      landlord: {
        name: landlord.name,
        companyName: landlord.companyName,
        companyAddress: landlord.companyAddress,
        companyEmail: landlord.companyEmail,
        companyPhone: landlord.companyPhone,
        securityDepositMonths: Number(landlord.securityDepositMonths),
        petDepositEnabled: landlord.petDepositEnabled,
        petDepositAmount: landlord.petDepositAmount ? Number(landlord.petDepositAmount) : null,
        petRentEnabled: landlord.petRentEnabled,
        petRentAmount: landlord.petRentAmount ? Number(landlord.petRentAmount) : null,
      },
      property: {
        name: property.name,
        address: property.address as any,
        amenities: property.amenities,
      },
      unit: {
        name: unit.name,
        type: unit.type,
        rentAmount: Number(unit.rentAmount),
      },
      tenant: tenant ? {
        name: tenant.name,
        email: tenant.email,
      } : {
        name: '[TENANT NAME]',
        email: '[TENANT EMAIL]',
      },
      leaseTerms: {
        startDate: leaseTerms?.startDate ? new Date(leaseTerms.startDate) : new Date(),
        endDate: leaseTerms?.endDate ? new Date(leaseTerms.endDate) : null,
        isMonthToMonth: leaseTerms?.isMonthToMonth ?? true,
        billingDayOfMonth: leaseTerms?.billingDayOfMonth ?? 1,
      },
      customizations,
    });

    // Generate HTML preview
    const html = generateLeaseHtml(leaseData);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Failed to preview lease:', error);
    return NextResponse.json({ message: 'Failed to preview lease' }, { status: 500 });
  }
}
