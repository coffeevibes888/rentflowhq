import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { NextResponse } from 'next/server';
import { eventBus } from '@/lib/event-system';

// GET - List all employees
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'contractor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const employees = await prisma.contractorEmployee.findMany({
      where: {
        contractorId: contractorProfile.id,
        ...(status && { status }),
      },
      include: {
        _count: {
          select: {
            timeEntries: true,
            assignments: true,
          },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

// POST - Create new employee
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'contractor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    const body = await request.json();

    const employee = await prisma.contractorEmployee.create({
      data: {
        contractorId: contractorProfile.id,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        role: body.role,
        employeeType: body.employeeType || 'w2',
        status: body.status || 'active',
        hireDate: body.hireDate ? new Date(body.hireDate) : new Date(),
        payRate: body.payRate,
        payType: body.payType || 'hourly',
        paySchedule: body.paySchedule,
        skills: body.skills || [],
        certifications: body.certifications || [],
        licenseNumber: body.licenseNumber,
        licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
        canViewFinancials: body.canViewFinancials || false,
        canManageJobs: body.canManageJobs || false,
        canManageCustomers: body.canManageCustomers || false,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
      },
    });

    await eventBus.emit('contractor.employee.created', {
      employeeId: employee.id,
      contractorId: contractorProfile.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      role: employee.role,
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
