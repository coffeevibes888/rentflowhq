import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { NextResponse } from 'next/server';
import { eventBus } from '@/lib/event-system';

// GET - List all customers
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

    const customers = await prisma.contractorCustomer.findMany({
      where: {
        contractorId: contractorProfile.id,
        ...(status && { status }),
      },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// POST - Create new customer
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

    // Check for duplicate email
    const existing = await prisma.contractorCustomer.findFirst({
      where: {
        contractorId: contractorProfile.id,
        email: body.email,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Customer with this email already exists' }, { status: 400 });
    }

    const customer = await prisma.contractorCustomer.create({
      data: {
        contractorId: contractorProfile.id,
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        status: body.status || 'lead',
        source: body.source,
        tags: body.tags || [],
        notes: body.notes || [],
      },
    });

    await eventBus.emit('contractor.customer.created', {
      customerId: customer.id,
      contractorId: contractorProfile.id,
      customerName: customer.name,
      status: customer.status,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
