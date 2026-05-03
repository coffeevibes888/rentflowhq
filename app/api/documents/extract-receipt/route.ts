import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';

/**
 * POST /api/documents/extract-receipt
 * 
 * Takes a scanned document ID, reads its OCR text, and extracts
 * receipt data (amount, vendor, date, category) using pattern matching.
 * Then creates an expense record for the selected property.
 * 
 * Body: { documentId, propertyId, overrides?: { amount?, category?, description?, date? } }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const landlord = await prisma.landlord.findFirst({
      where: { ownerUserId: session.user.id },
    });
    if (!landlord) {
      return NextResponse.json({ success: false, message: 'Landlord not found' }, { status: 404 });
    }

    const body = await req.json();
    const { documentId, propertyId, overrides } = body;

    if (!documentId) {
      return NextResponse.json({ success: false, message: 'Document ID required' }, { status: 400 });
    }
    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID required' }, { status: 400 });
    }

    // Fetch the scanned document
    const doc = await prisma.scannedDocument.findFirst({
      where: { id: documentId, landlordId: landlord.id },
    });
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    // Verify property belongs to this landlord
    const property = await prisma.property.findFirst({
      where: { id: propertyId, landlordId: landlord.id },
    });
    if (!property) {
      return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
    }

    // Extract data from OCR text or existing extractedData
    const existingData = (doc.extractedData as any) || {};
    const ocrText = doc.ocrText || '';

    const extracted = {
      amount: overrides?.amount || existingData.amount || extractAmount(ocrText),
      vendor: overrides?.vendor || existingData.vendor || extractVendor(ocrText),
      date: overrides?.date || existingData.date || extractDate(ocrText),
      category: overrides?.category || existingData.category || detectCategory(ocrText),
    };

    const amount = parseFloat(String(extracted.amount).replace(/[$,]/g, ''));
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Could not extract a valid amount. Please enter it manually.',
        extracted,
      }, { status: 400 });
    }

    const incurredAt = extracted.date ? new Date(extracted.date) : new Date();
    if (isNaN(incurredAt.getTime())) {
      return NextResponse.json({
        success: false,
        message: 'Could not parse date. Please enter it manually.',
        extracted,
      }, { status: 400 });
    }

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        landlordId: landlord.id,
        propertyId,
        amount,
        category: extracted.category || 'other',
        description: extracted.vendor
          ? `${extracted.vendor} — scanned from receipt`
          : `Scanned receipt — ${doc.originalFileName}`,
        incurredAt,
        isRecurring: false,
      },
    });

    // Update the scanned document to link it to the expense
    await prisma.scannedDocument.update({
      where: { id: documentId },
      data: {
        propertyId,
        convertedToExpenseId: expense.id,
        conversionStatus: 'completed',
        classificationStatus: 'classified',
        documentType: 'receipt',
        extractedData: {
          ...existingData,
          ...extracted,
          expenseId: expense.id,
          autoCreated: true,
        },
      },
    });

    return NextResponse.json({
      success: true,
      expense: {
        id: expense.id,
        amount: Number(expense.amount),
        category: expense.category,
        description: expense.description,
        date: expense.incurredAt.toISOString(),
        propertyId,
        propertyName: property.name,
      },
      extracted,
    });
  } catch (error) {
    console.error('Extract receipt error:', error);
    return NextResponse.json({ success: false, message: 'Failed to process receipt' }, { status: 500 });
  }
}

// --- Extraction helpers ---

function extractAmount(text: string): string | null {
  // Look for "Total", "Amount Due", "Grand Total" patterns
  const totalPatterns = [
    /(?:total|amount\s*due|grand\s*total|balance\s*due|amount|subtotal)[:\s]*\$?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)/i,
  ];
  for (const p of totalPatterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].replace(/,/g, '');
  }

  // Find the largest dollar amount (likely the total)
  const allAmounts = text.match(/\$\s*(\d{1,3}(?:,?\d{3})*\.\d{2})/g);
  if (allAmounts && allAmounts.length > 0) {
    const nums = allAmounts.map(a => parseFloat(a.replace(/[$,\s]/g, ''))).filter(a => !isNaN(a));
    if (nums.length > 0) return Math.max(...nums).toFixed(2);
  }

  // Try without dollar sign
  const plainAmounts = text.match(/(\d{1,3}(?:,\d{3})*\.\d{2})/g);
  if (plainAmounts && plainAmounts.length > 0) {
    const nums = plainAmounts.map(a => parseFloat(a.replace(/,/g, ''))).filter(a => !isNaN(a) && a > 1);
    if (nums.length > 0) return Math.max(...nums).toFixed(2);
  }

  return null;
}

function extractVendor(text: string): string | null {
  if (!text) return null;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 60);
  // First non-numeric, non-date line is usually the vendor
  for (const line of lines.slice(0, 5)) {
    if (!/^\d/.test(line) && !/^\$/.test(line) && !/^(total|subtotal|tax|date|receipt)/i.test(line)) {
      return line.replace(/[^a-zA-Z0-9\s&'-]/g, '').trim().slice(0, 50);
    }
  }
  return null;
}

function extractDate(text: string): string | null {
  const patterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{1,2}-\d{1,2}-\d{4})/,
    /(\d{4}-\d{1,2}-\d{1,2})/,
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{2})\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      const d = new Date(m[1]);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
  }
  return null;
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  const categoryKeywords: Record<string, string[]> = {
    maintenance: ['home depot', 'lowes', 'lowe\'s', 'hardware', 'plumbing', 'electrical', 'repair', 'fix', 'tool', 'paint', 'lumber'],
    owner_paid_utilities: ['electric', 'utility', 'water', 'gas', 'sewer', 'trash', 'waste', 'power', 'energy', 'comcast', 'spectrum', 'at&t', 'verizon'],
    one_time_repairs: ['hvac', 'furnace', 'air condition', 'roof', 'appliance', 'washer', 'dryer', 'dishwasher', 'refrigerator', 'water heater'],
    platform_fees: ['stripe', 'payment processing', 'transaction fee', 'platform'],
    recurring_expenses: ['insurance', 'hoa', 'association', 'lawn', 'landscap', 'pest control', 'cleaning', 'janitorial'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return 'other';
}
