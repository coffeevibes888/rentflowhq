import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { randomUUID } from 'crypto';

function isAllowedCategory(category: string) {
  return (
    category === 'id_verification' ||
    category === 'income_verification' ||
    category === 'address_verification' ||
    category === 'other'
  );
}

function isAllowedDocType(docType: string) {
  return (
    docType === 'drivers_license' ||
    docType === 'passport' ||
    docType === 'state_id' ||
    docType === 'paystub' ||
    docType === 'w2' ||
    docType === 'tax_return' ||
    docType === 'bank_statement' ||
    docType === 'other'
  );
}

async function resolveLandlordIdForApplication(application: {
  unitId: string | null;
  propertySlug: string | null;
}) {
  if (application.unitId) {
    const unit = await prisma.unit.findUnique({
      where: { id: application.unitId },
      select: { property: { select: { landlordId: true } } },
    });
    return unit?.property?.landlordId || null;
  }

  if (application.propertySlug) {
    const property = await prisma.property.findUnique({
      where: { slug: application.propertySlug },
      select: { landlordId: true },
    });
    return property?.landlordId || null;
  }

  return null;
}

async function assertCanAccessApplication(params: {
  session: any;
  applicationId: string;
}) {
  const { session, applicationId } = params;

  const application = await prisma.rentalApplication.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      applicantId: true,
      unitId: true,
      propertySlug: true,
    },
  });

  if (!application) {
    return { ok: false as const, status: 404 as const, message: 'Application not found' };
  }

  const role = session?.user?.role;
  const userId = session?.user?.id as string | undefined;

  if (!userId) {
    return { ok: false as const, status: 401 as const, message: 'Not authenticated' };
  }

  if (role === 'tenant') {
    if (application.applicantId !== userId) {
      return { ok: false as const, status: 403 as const, message: 'Forbidden' };
    }

    const landlordId = await resolveLandlordIdForApplication({
      unitId: application.unitId,
      propertySlug: application.propertySlug,
    });

    if (!landlordId) {
      return { ok: false as const, status: 400 as const, message: 'Unable to determine landlord for application' };
    }

    return { ok: true as const, application, landlordId };
  }

  if (role === 'admin' || role === 'superAdmin' || role === 'landlord' || role === 'property_manager') {
    const landlordId = await resolveLandlordIdForApplication({
      unitId: application.unitId,
      propertySlug: application.propertySlug,
    });

    if (!landlordId) {
      return { ok: false as const, status: 400 as const, message: 'Unable to determine landlord for application' };
    }

    if (role === 'admin' || role === 'superAdmin') {
      return { ok: true as const, application, landlordId };
    }

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: userId },
      select: { id: true },
    });

    if (!landlord || landlord.id !== landlordId) {
      return { ok: false as const, status: 403 as const, message: 'Forbidden' };
    }

    return { ok: true as const, application, landlordId };
  }

  return { ok: false as const, status: 403 as const, message: 'Forbidden' };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ success: false, message: 'applicationId is required' }, { status: 400 });
    }

    const access = await assertCanAccessApplication({ session, applicationId });
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const prismaAny = prisma as any;
    const documents = await prismaAny.applicationDocument.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error('List application documents error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ success: false, message: 'Invalid form data' }, { status: 400 });
    }

    const applicationId = formData.get('applicationId');
    const category = formData.get('category');
    const docType = formData.get('docType');
    const file = formData.get('file');

    if (typeof applicationId !== 'string' || !applicationId) {
      return NextResponse.json({ success: false, message: 'applicationId is required' }, { status: 400 });
    }

    if (typeof category !== 'string' || !isAllowedCategory(category)) {
      return NextResponse.json({ success: false, message: 'Invalid category' }, { status: 400 });
    }

    if (typeof docType !== 'string' || !isAllowedDocType(docType)) {
      return NextResponse.json({ success: false, message: 'Invalid docType' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'file is required' }, { status: 400 });
    }

    const access = await assertCanAccessApplication({ session, applicationId });
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    const mimeType = typeof file.type === 'string' && file.type ? file.type : 'application/octet-stream';
    const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const publicId = `tenant-applications/${access.landlordId}/${applicationId}/${category}-${docType}-${randomUUID()}`;

    const uploaded = await uploadToCloudinary(fileBuffer, {
      resource_type: resourceType,
      type: 'authenticated',
      public_id: publicId,
      overwrite: false,
    });

    const prismaAny = prisma as any;
    const created = await prismaAny.applicationDocument.create({
      data: {
        applicationId,
        landlordId: access.landlordId,
        uploadedById: session.user.id,
        category,
        docType,
        originalFileName: file.name || 'upload',
        mimeType,
        fileSize: file.size,
        cloudinaryPublicId: uploaded.public_id,
        cloudinaryResourceType: resourceType,
        status: 'uploaded',
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Upload application document error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
