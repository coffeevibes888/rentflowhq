import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// GET - Employee details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const employee = await prisma.contractorEmployee.findUnique({
      where: {
        id: params.id,
        contractorId: contractorProfile.id,
      },
      include: {
        assignedRole: true,
        assignments: true,
        timeEntries: {
          orderBy: { clockIn: 'desc' },
          take: 50,
        },
        employeeCertifications: true,
        timeOffRequests: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify employee belongs to contractor
    const existingEmployee = await prisma.contractorEmployee.findUnique({
      where: {
        id: params.id,
        contractorId: contractorProfile.id,
      },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      hourlyRate,
      status,
      roleId,
      emergencyContact,
      emergencyPhone,
      photo,
    } = body;

    const employee = await prisma.contractorEmployee.update({
      where: { id: params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(role && { role }),
        ...(hourlyRate && { payRate: parseFloat(hourlyRate) }),
        ...(status && { status }),
        ...(roleId !== undefined && { roleId }),
        ...(emergencyContact !== undefined && { emergencyContactName: emergencyContact }),
        ...(emergencyPhone !== undefined && { emergencyContactPhone: emergencyPhone }),
        ...(photo !== undefined && { photo }),
      },
      include: {
        assignedRole: true,
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE - Remove employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify employee belongs to contractor
    const existingEmployee = await prisma.contractorEmployee.findUnique({
      where: {
        id: params.id,
        contractorId: contractorProfile.id,
      },
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Soft delete by setting status to terminated
    await prisma.contractorEmployee.update({
      where: { id: params.id },
      data: {
        status: 'terminated',
        terminationDate: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
