import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

// GET /api/contractor/subcontractors/[id] - Get single subcontractor
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    const subcontractors = await prisma.$queryRaw`
      SELECT * FROM "ContractorSubcontractor"
      WHERE id = ${id} AND "contractorId" = ${contractorProfile.id}
      LIMIT 1
    `;

    const subcontractor = Array.isArray(subcontractors) ? subcontractors[0] : null;

    if (!subcontractor) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    // Fetch assignments
    const assignments = await prisma.$queryRaw`
      SELECT sa.*, j.title as jobTitle, j."jobNumber"
      FROM "ContractorSubcontractorAssignment" sa
      JOIN "ContractorJob" j ON sa."jobId" = j.id
      WHERE sa."subcontractorId" = ${id}
      ORDER BY sa."createdAt" DESC
    `;

    return NextResponse.json({ 
      success: true, 
      subcontractor,
      assignments: Array.isArray(assignments) ? assignments : []
    });
  } catch (error) {
    console.error('Error fetching subcontractor:', error);
    return NextResponse.json({ error: 'Failed to fetch subcontractor' }, { status: 500 });
  }
}

// PUT /api/contractor/subcontractors/[id] - Update subcontractor
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    const data = await req.json();

    await prisma.$executeRaw`
      UPDATE "ContractorSubcontractor"
      SET 
        "companyName" = ${data.companyName},
        "contactName" = ${data.contactName},
        email = ${data.email},
        phone = ${data.phone || null},
        "licenseNumber" = ${data.licenseNumber || null},
        "licenseState" = ${data.licenseState || null},
        "insuranceExpiry" = ${data.insuranceExpiry ? new Date(data.insuranceExpiry) : null},
        "taxId" = ${data.taxId || null},
        specialties = ${data.specialties || []},
        status = ${data.status || 'active'},
        "paymentTerms" = ${data.paymentTerms || 'net_30'},
        "preferredPayment" = ${data.preferredPayment || 'check'},
        notes = ${data.notes || null},
        "updatedAt" = ${new Date()}
      WHERE id = ${id} AND "contractorId" = ${contractorProfile.id}
    `;

    return NextResponse.json({ success: true, message: 'Subcontractor updated' });
  } catch (error) {
    console.error('Error updating subcontractor:', error);
    return NextResponse.json({ error: 'Failed to update subcontractor' }, { status: 500 });
  }
}

// DELETE /api/contractor/subcontractors/[id] - Delete subcontractor
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractorProfile = await prisma.contractorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!contractorProfile) {
      return NextResponse.json({ error: 'Contractor profile not found' }, { status: 404 });
    }

    await prisma.$executeRaw`
      DELETE FROM "ContractorSubcontractor"
      WHERE id = ${id} AND "contractorId" = ${contractorProfile.id}
    `;

    return NextResponse.json({ success: true, message: 'Subcontractor deleted' });
  } catch (error) {
    console.error('Error deleting subcontractor:', error);
    return NextResponse.json({ error: 'Failed to delete subcontractor' }, { status: 500 });
  }
}
