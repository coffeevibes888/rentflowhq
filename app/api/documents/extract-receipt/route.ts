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

    // Merge: overrides > existing extractedData > fresh extraction from OCR text
    const existingData = (doc.extractedData as any) || {};
    const ocrText = doc.ocrText || '';

    const extracted = {
      amount: overrides?.amount ?? existingData.amount ?? extractAmount(ocrText),
      vendor: overrides?.vendor ?? existingData.vendor ?? extractVendor(ocrText),
      date: overrides?.date ?? existingData.date ?? extractDate(ocrText),
      category: overrides?.category ?? existingData.category ?? detectCategory(ocrText),
      description: overrides?.description ?? existingData.description ?? null,
    };

    const amount = parseFloat(String(extracted.amount ?? '').replace(/[$,]/g, ''));
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

    // Build a human-readable description
    const expenseDescription =
      extracted.description ||
      (extracted.vendor
        ? `${extracted.vendor} — scanned from receipt`
        : `Scanned receipt — ${doc.originalFileName}`);

    // Map any legacy category names to the canonical set
    const canonicalCategory = mapCategory(String(extracted.category || 'other'));

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        landlordId: landlord.id,
        propertyId,
        amount,
        category: canonicalCategory,
        description: expenseDescription,
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
    maintenance: ['home depot', 'lowes', 'lowe\'s', 'hardware', 'plumbing', 'electrical', 'repair', 'fix', 'tool', 'paint', 'lumber', 'hvac', 'furnace', 'appliance', 'water heater'],
    utilities: ['electric', 'utility', 'water', 'gas', 'sewer', 'trash', 'waste', 'power', 'energy', 'comcast', 'spectrum', 'at&t', 'verizon', 'internet', 'cable'],
    insurance: ['insurance', 'policy', 'premium', 'coverage', 'state farm', 'allstate'],
    taxes: ['property tax', 'county tax', 'tax bill', 'tax assessment'],
    landscaping: ['lawn', 'landscap', 'mow', 'mulch', 'tree', 'shrub', 'garden', 'irrigation', 'snow removal'],
    cleaning: ['clean', 'janitorial', 'maid', 'housekeep', 'carpet clean', 'pressure wash'],
    legal: ['attorney', 'lawyer', 'legal', 'court', 'filing fee', 'notary', 'accountant', 'cpa'],
    advertising: ['advertis', 'listing', 'zillow', 'craigslist', 'marketing', 'photography'],
    management: ['management fee', 'hoa', 'association fee', 'platform fee', 'stripe', 'processing fee'],
    supplies: ['office supply', 'staples', 'office depot', 'paper', 'printer', 'postage', 'shipping'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return 'other';
}

// Map legacy / alternate category names to the canonical EXPENSE_CATEGORIES values
function mapCategory(raw: string): string {
  const map: Record<string, string> = {
    maintenance: 'maintenance',
    one_time_repairs: 'maintenance',
    owner_paid_utilities: 'utilities',
    utilities: 'utilities',
    insurance: 'insurance',
    taxes: 'taxes',
    landscaping: 'landscaping',
    cleaning: 'cleaning',
    legal: 'legal',
    advertising: 'advertising',
    management: 'management',
    platform_fees: 'management',
    recurring_expenses: 'management',
    supplies: 'supplies',
    other: 'other',
  };
  return map[raw.toLowerCase()] ?? 'other';
}
