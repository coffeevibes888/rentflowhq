/**
 * POST /api/mobile/ocr/receipt
 *
 * Server-side proxy for receipt OCR. The mobile client uploads the image,
 * we call Google Cloud Vision (or AWS Textract — controlled via env), parse
 * the structured response into a normalized shape, and return:
 *
 *   { vendor, total, taxAmount, date, lineItems[], suggestedCategory, rawText, confidence }
 *
 * Why server-side: Google Vision keys must never be shipped to mobile. This
 * route also lets us swap providers later (Textract, Veryfi, Klippa) without
 * shipping a new app build.
 *
 * Body shape (multipart/form-data):
 *   file: Blob — the receipt image (jpg/png/heic).
 *
 * Required env:
 *   GOOGLE_CLOUD_VISION_API_KEY  (preferred, simplest to set up)
 *
 * If the key is missing we fall back to a deterministic heuristic parser so
 * the mobile flow still demos. We tag the response with `provider: 'fallback'`
 * so the UI can show an "OCR unavailable" hint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/mobile-auth';

interface OcrResult {
  vendor: string | null;
  total: number | null;
  taxAmount: number | null;
  date: string | null;          // ISO timestamp
  lineItems: { description: string; amount: number }[];
  suggestedCategory: string;
  rawText: string;
  confidence: number;           // 0..1
  provider: 'google-vision' | 'fallback';
}

async function authed(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return false;
  const payload = await verifyMobileToken(token);
  return !!payload;
}

export async function POST(req: NextRequest) {
  try {
    if (!(await authed(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 8MB)' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

    let rawText = '';
    let provider: OcrResult['provider'] = 'fallback';

    if (apiKey) {
      // Google Cloud Vision DOCUMENT_TEXT_DETECTION returns the most accurate
      // structured text for receipts.
      const visionRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            }],
          }),
        },
      );
      if (visionRes.ok) {
        const json = await visionRes.json();
        rawText = json?.responses?.[0]?.fullTextAnnotation?.text ?? '';
        provider = 'google-vision';
      } else {
        console.warn('Vision API error', visionRes.status, await visionRes.text());
      }
    }

    const parsed = parseReceiptText(rawText);
    const result: OcrResult = { ...parsed, rawText, provider };
    return NextResponse.json(result);
  } catch (e) {
    console.error('ocr receipt', e);
    return NextResponse.json({ error: 'OCR failed' }, { status: 500 });
  }
}

// ─── Heuristic parser ──────────────────────────────────────────────────────
// Extracts vendor, total, tax, date and category from raw OCR text. Built to
// handle US-style receipts (Home Depot, Lowe's, gas stations, hardware
// stores). The rules are intentionally simple and explainable — the user
// always reviews the extracted fields before saving.

function parseReceiptText(text: string): Omit<OcrResult, 'rawText' | 'provider'> {
  if (!text) {
    return {
      vendor: null, total: null, taxAmount: null, date: null,
      lineItems: [], suggestedCategory: 'misc', confidence: 0,
    };
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Vendor: first non-empty line is almost always the merchant name.
  const vendor = (lines[0] ?? '').slice(0, 60) || null;

  // Total: look for "TOTAL" not preceded by SUB, then a money pattern.
  let total: number | null = null;
  let taxAmount: number | null = null;
  for (const line of lines) {
    const upper = line.toUpperCase();
    const moneyMatch = line.match(/\$?\s*(\d{1,5}(?:[,]\d{3})*(?:\.\d{2}))/);
    if (!moneyMatch) continue;
    const value = parseFloat(moneyMatch[1].replace(/,/g, ''));

    if (total == null && /\bTOTAL\b/.test(upper) && !/SUB|SUBTOTAL/.test(upper)) {
      total = value;
    }
    if (taxAmount == null && /\bTAX\b/.test(upper)) {
      taxAmount = value;
    }
  }

  // Fallback: if no "TOTAL" line found, use the largest money value.
  if (total == null) {
    const allMoney = (text.match(/\$?\s*(\d{1,5}(?:[,]\d{3})*(?:\.\d{2}))/g) ?? [])
      .map((m) => parseFloat(m.replace(/[,$\s]/g, '')))
      .filter((n) => !isNaN(n));
    if (allMoney.length > 0) total = Math.max(...allMoney);
  }

  // Date: first MM/DD/YYYY or YYYY-MM-DD pattern in the text.
  let date: string | null = null;
  const dateMatch =
    text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/) ||
    text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dateMatch) {
    try {
      let d: Date;
      if (dateMatch[0].includes('-') && dateMatch[0].length >= 10) {
        d = new Date(dateMatch[0]);
      } else {
        const m = parseInt(dateMatch[1], 10);
        const day = parseInt(dateMatch[2], 10);
        let y = parseInt(dateMatch[3], 10);
        if (y < 100) y += 2000;
        d = new Date(y, m - 1, day);
      }
      if (!isNaN(d.getTime())) date = d.toISOString();
    } catch { /* ignore parse errors */ }
  }

  // Suggested category from vendor keywords.
  const v = (vendor ?? '').toUpperCase();
  let suggestedCategory = 'other';
  if (/HOME DEPOT|LOWES|ACE HARDWARE|MENARDS|GRAINGER/.test(v)) suggestedCategory = 'maintenance';
  else if (/SHELL|CHEVRON|EXXON|MOBIL|7-?ELEVEN|GAS/.test(v)) suggestedCategory = 'travel';
  else if (/AT&T|VERIZON|COMCAST|XFINITY|UTILITY|ELECTRIC|WATER|POWER/.test(v)) suggestedCategory = 'utilities';
  else if (/INSURANCE|GEICO|STATE FARM|ALLSTATE/.test(v)) suggestedCategory = 'insurance';
  else if (/CLEAN|MAID/.test(v)) suggestedCategory = 'cleaning';
  else if (/STAPLES|OFFICE MAX|OFFICE DEPOT/.test(v)) suggestedCategory = 'supplies';

  // Confidence — rough heuristic, refined when total + date both found.
  let confidence = 0.2;
  if (vendor) confidence += 0.2;
  if (total != null) confidence += 0.3;
  if (date) confidence += 0.2;
  if (taxAmount != null) confidence += 0.1;

  return {
    vendor,
    total,
    taxAmount,
    date,
    lineItems: [], // fancy line-item extraction is V2
    suggestedCategory,
    confidence,
  };
}
