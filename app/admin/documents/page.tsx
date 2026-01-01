import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { getOrCreateCurrentLandlord } from '@/lib/actions/landlord.actions';
import { prisma } from '@/db/prisma';
import DocumentsClient from './documents-client';

export const metadata: Metadata = {
  title: 'Document Center',
};

const AdminDocumentsPage = async () => {
  await requireAdmin();

  const landlordResult = await getOrCreateCurrentLandlord();
  if (!landlordResult.success) {
    return (
      <main className="px-4 py-10">
        <div className="max-w-3xl mx-auto text-sm text-red-600">
          {landlordResult.message || 'Unable to load landlord context.'}
        </div>
      </main>
    );
  }

  const landlordId = landlordResult.landlord.id;

  // Fetch all data in parallel
  const [legalDocuments, scannedDocuments, properties] = await Promise.all([
    prisma.legalDocument.findMany({
      where: { landlordId, isActive: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.scannedDocument.findMany({
      where: { landlordId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.findMany({
      where: { landlordId },
      select: {
        id: true,
        name: true,
        address: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <DocumentsClient
      legalDocuments={legalDocuments.map((doc) => ({
        ...doc,
        fileSize: doc.fileSize ?? undefined,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      }))}
      scannedDocuments={scannedDocuments.map((doc) => ({
        ...doc,
        fileSize: doc.fileSize ?? undefined,
        ocrConfidence: doc.ocrConfidence ? Number(doc.ocrConfidence) : undefined,
        ocrProcessedAt: doc.ocrProcessedAt?.toISOString(),
        classifiedAt: doc.classifiedAt?.toISOString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      }))}
      properties={properties.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address as { city?: string; state?: string } | null,
      }))}
    />
  );
};

export default AdminDocumentsPage;
