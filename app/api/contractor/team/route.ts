import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// GET - List all employees
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!contractorProfile) {
      return NextResponse.json(
        { error: 'Contractor profile not found' },
        { status: 404 }
      );
    }

    const employees = await prisma.contractorEmployee.findMany({
      where: { contractorId: contractorProfile.id },
      include: {
        assignedRole: {
          select: {
            name: true,
            permissions: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            timeEntries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST - Add new employee
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!contractorProfile) {
      return NextResponse.json(
        { error: 'Contractor profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      hourlyRate,
      hireDate,
      roleId,
      emergencyContact,
      emergencyPhone,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !role || !hourlyRate || !hireDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const employee = await prisma.contractorEmployee.create({
      data: {
        contractorId: contractorProfile.id,
        firstName,
        lastName,
        email,
        phone,
        role,
        payRate: parseFloat(hourlyRate),
        hireDate: new Date(hireDate),
        status: 'active',
        roleId: roleId || null,
        emergencyContactName: emergencyContact || null,
        emergencyContactPhone: emergencyPhone || null,
      },
      include: {
        assignedRole: {
          select: {
            name: true,
            permissions: true,
          },
        },
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
