/**
 * POST /api/documents/scan-receipt
 *
 * Runs OCR on an already-uploaded ScannedDocument and extracts structured
 * receipt data (amount, vendor, date, category).  The result is saved back
 * to the document's extractedData field so it can be reused later.
 *
 * Body: { documentId: string }
 * Returns: { success, extracted: { amount, vendor, date, category }, ocrText }
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });
    if (!landlord) {
      return NextResponse.json({ error: 'Landlord not found' }, { status: 404 });
    }

    const body = await req.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'documentId required' }, { status: 400 });
    }

    const doc = await prisma.scannedDocument.findFirst({
      where: { id: documentId, landlordId: landlord.id },
    });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ── If we already have OCR text, skip re-scanning ─────────────────────
    let ocrText = doc.ocrText || '';

    if (!ocrText && doc.fileUrl) {
      // Fetch the image from Cloudinary and run Tesseract server-side
      try {
        const imageRes = await fetch(doc.fileUrl);
        if (imageRes.ok) {
          const arrayBuffer = await imageRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Dynamically import Tesseract (avoids edge-runtime issues)
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('eng');
          const { data } = await worker.recognize(buffer);
          await worker.terminate();

          ocrText = data.text || '';
          const confidence = data.confidence ?? 0;

          // Persist OCR result
          await prisma.scannedDocument.update({
            where: { id: documentId },
            data: {
              ocrText,
              ocrConfidence: confidence,
              ocrProcessedAt: new Date(),
            },
          });
        }
      } catch (ocrErr) {
        console.error('[scan-receipt] OCR failed:', ocrErr);
        // Continue — we'll return empty extracted data and let the user fill in manually
      }
    }

    // ── Extract structured data from OCR text ─────────────────────────────
    const extracted = extractReceiptData(ocrText);

    // Save extracted data back to the document
    await prisma.scannedDocument.update({
      where: { id: documentId },
      data: {
        documentType: 'receipt',
        classificationStatus: 'classified',
        classifiedAt: new Date(),
        extractedData: {
          ...((doc.extractedData as object) || {}),
          ...extracted,
          scannedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, extracted, ocrText });
  } catch (error) {
    console.error('[scan-receipt] error:', error);
    return NextResponse.json(
      { error: 'Failed to scan receipt' },
      { status: 500 }
    );
  }
}

// ─── Extraction helpers ───────────────────────────────────────────────────────

function extractReceiptData(text: string): {
  amount: string | null;
  vendor: string | null;
  date: string | null;
  category: string;
} {
  return {
    amount: extractAmount(text),
    vendor: extractVendor(text),
    date: extractDate(text),
    category: detectCategory(text),
  };
}

function extractAmount(text: string): string | null {
  if (!text) return null;

  // Priority 1: explicit "Total" / "Amount Due" / "Grand Total" labels
  const labelPatterns = [
    /(?:grand\s*total|total\s*due|amount\s*due|balance\s*due|total\s*amount)[:\s]*\$?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)/i,
    /(?:^|\n)\s*total[:\s]*\$?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)/im,
    /(?:subtotal|sub-total)[:\s]*\$?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)/i,
  ];
  for (const p of labelPatterns) {
    const m = text.match(p);
    if (m?.[1]) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) return val.toFixed(2);
    }
  }

  // Priority 2: largest dollar amount on the page (usually the total)
  const withSign = [...text.matchAll(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g)];
  if (withSign.length > 0) {
    const nums = withSign
      .map((m) => parseFloat(m[1].replace(/,/g, '')))
      .filter((n) => !isNaN(n) && n > 0);
    if (nums.length > 0) return Math.max(...nums).toFixed(2);
  }

  // Priority 3: any decimal number that looks like a price
  const plain = [...text.matchAll(/\b(\d{1,3}(?:,\d{3})*\.\d{2})\b/g)];
  if (plain.length > 0) {
    const nums = plain
      .map((m) => parseFloat(m[1].replace(/,/g, '')))
      .filter((n) => !isNaN(n) && n > 1 && n < 100000);
    if (nums.length > 0) return Math.max(...nums).toFixed(2);
  }

  return null;
}

function extractVendor(text: string): string | null {
  if (!text) return null;

  // Known vendor name patterns
  const knownVendors = [
    'Home Depot', 'Lowe\'s', 'Lowes', 'Menards', 'Ace Hardware',
    'Walmart', 'Target', 'Costco', 'Amazon',
    'Sherwin-Williams', 'Benjamin Moore',
    'Grainger', 'Fastenal', 'Ferguson',
    'Comcast', 'Spectrum', 'AT&T', 'Verizon', 'T-Mobile',
    'PG&E', 'Con Edison', 'Duke Energy', 'Xcel Energy',
    'State Farm', 'Allstate', 'Farmers', 'Liberty Mutual',
    'ServiceMaster', 'Stanley Steemer', 'Terminix', 'Orkin',
  ];
  const lowerText = text.toLowerCase();
  for (const v of knownVendors) {
    if (lowerText.includes(v.toLowerCase())) return v;
  }

  // Fallback: first non-numeric, non-date line (usually the store name)
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 60);

  for (const line of lines.slice(0, 6)) {
    if (
      !/^\d/.test(line) &&
      !/^\$/.test(line) &&
      !/^(total|subtotal|tax|date|receipt|invoice|thank|visit|www\.|http)/i.test(line) &&
      /[a-zA-Z]{3,}/.test(line) // must have at least 3 letters
    ) {
      return line.replace(/[^a-zA-Z0-9\s&'.,\-]/g, '').trim().slice(0, 60);
    }
  }

  return null;
}

function extractDate(text: string): string | null {
  if (!text) return null;

  const patterns = [
    // ISO: 2025-01-15
    /\b(\d{4}-\d{1,2}-\d{1,2})\b/,
    // US: 01/15/2025 or 1/15/25
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
    // Dashes: 01-15-2025
    /\b(\d{1,2}-\d{1,2}-\d{4})\b/,
    // Written: Jan 15, 2025 / January 15 2025
    /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/i,
    // Written reversed: 15 Jan 2025
    /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4})\b/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      try {
        const d = new Date(m[1]);
        if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() <= new Date().getFullYear() + 1) {
          return d.toISOString().split('T')[0];
        }
      } catch {
        // try next pattern
      }
    }
  }

  return null;
}

function detectCategory(text: string): string {
  if (!text) return 'other';
  const lower = text.toLowerCase();

  const rules: [string[], string][] = [
    [['home depot', 'lowe\'s', 'lowes', 'menards', 'ace hardware', 'hardware', 'plumbing supply',
      'electrical supply', 'lumber', 'paint', 'drywall', 'tile', 'flooring', 'roofing',
      'repair', 'fix', 'replace', 'install', 'hvac', 'furnace', 'water heater',
      'appliance', 'washer', 'dryer', 'refrigerator', 'dishwasher'], 'maintenance'],

    [['electric', 'electricity', 'gas bill', 'natural gas', 'water bill', 'sewer',
      'trash', 'waste management', 'utility', 'utilities', 'power bill',
      'comcast', 'spectrum', 'at&t', 'verizon', 'internet', 'cable',
      'pg&e', 'con edison', 'duke energy', 'xcel'], 'utilities'],

    [['insurance', 'policy', 'premium', 'coverage', 'state farm', 'allstate',
      'farmers', 'liberty mutual', 'nationwide'], 'insurance'],

    [['property tax', 'county tax', 'tax bill', 'tax assessment', 'irs', 'tax payment'], 'taxes'],

    [['lawn', 'landscap', 'mow', 'mulch', 'tree', 'shrub', 'garden', 'irrigation',
      'sprinkler', 'snow removal', 'snow plow'], 'landscaping'],

    [['clean', 'janitorial', 'maid', 'housekeep', 'carpet clean', 'pressure wash',
      'window clean', 'stanley steemer'], 'cleaning'],

    [['attorney', 'lawyer', 'legal', 'court', 'filing fee', 'notary', 'accountant',
      'cpa', 'bookkeeping', 'tax prep'], 'legal'],

    [['advertis', 'listing', 'zillow', 'craigslist', 'facebook ad', 'marketing',
      'sign', 'flyer', 'photography'], 'advertising'],

    [['management fee', 'property management', 'hoa', 'association fee',
      'platform fee', 'stripe', 'processing fee'], 'management'],

    [['office supply', 'staples', 'office depot', 'paper', 'printer', 'ink',
      'postage', 'shipping', 'fedex', 'ups', 'usps'], 'supplies'],
  ];

  for (const [keywords, category] of rules) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }

  return 'other';
}
