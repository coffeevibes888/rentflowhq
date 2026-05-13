'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  Loader2,
  CheckCircle2,
  Receipt,
  Building2,
  DollarSign,
  Calendar,
  Tag,
  Store,
  ScanLine,
  ArrowRight,
  Sparkles,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES } from '@/lib/actions/document.actions';

interface Property {
  id: string;
  name: string;
  address: { city?: string; state?: string; street?: string; zipCode?: string } | null;
}

interface ReceiptUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  onSuccess: () => void;
  /** When set, skip the upload step and go straight to property selection */
  existingDocumentId?: string;
}

type Step = 'upload' | 'property' | 'review';

// ─── Extracted data shape returned by the server ─────────────────────────────
interface ExtractedReceiptData {
  amount?: string | number | null;
  vendor?: string | null;
  date?: string | null;
  category?: string | null;
}

export function ReceiptUploadDialog({
  open,
  onOpenChange,
  properties,
  onSuccess,
  existingDocumentId,
}: ReceiptUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If an existing doc is passed, start at the property step
  const initialStep: Step = existingDocumentId ? 'property' : 'upload';

  const [step, setStep] = useState<Step>(initialStep);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(existingDocumentId ?? null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  // Property selection
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Extraction state
  const [extractionWarning, setExtractionWarning] = useState<string | null>(null);
  const [autoExtracted, setAutoExtracted] = useState(false);

  // Expense details (extracted or manual)
  const [expenseData, setExpenseData] = useState({
    amount: '',
    category: 'maintenance',
    vendor: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const resetForm = useCallback(() => {
    setStep(existingDocumentId ? 'property' : 'upload');
    setFile(null);
    setUploadedDocId(existingDocumentId ?? null);
    setUploadedFileUrl(null);
    setSelectedPropertyId('');
    setExtractionWarning(null);
    setAutoExtracted(false);
    setExpenseData({
      amount: '',
      category: 'maintenance',
      vendor: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  }, [existingDocumentId]);

  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = '';
  };

  // ── Step 1: Upload the file ────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'receipt');

      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      if (!res.ok) {
        toast({ title: 'Upload failed', variant: 'destructive' });
        return;
      }

      const data = await res.json();
      const doc = data.documents?.[0];
      if (!doc?.id) {
        toast({ title: 'Upload failed — no document returned', variant: 'destructive' });
        return;
      }

      setUploadedDocId(doc.id);
      setUploadedFileUrl(doc.fileUrl);
      setStep('property');
      toast({ title: 'Receipt uploaded', description: 'Now select a property' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // ── Step 2: Property selected → run server-side OCR + extraction ──────────
  const handlePropertySelect = async () => {
    if (!selectedPropertyId || !uploadedDocId) {
      toast({ title: 'Please select a property', variant: 'destructive' });
      return;
    }

    setExtracting(true);
    setExtractionWarning(null);

    try {
      // Run OCR on the uploaded file (server-side via Tesseract or Cloudinary)
      // then extract structured data from the OCR text
      const ocrRes = await fetch('/api/documents/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: uploadedDocId }),
      });

      if (ocrRes.ok) {
        const ocrData = await ocrRes.json();
        const extracted: ExtractedReceiptData = ocrData.extracted || {};

        // Pre-fill form with extracted values
        setExpenseData((prev) => ({
          amount: extracted.amount != null ? String(extracted.amount) : prev.amount,
          vendor: extracted.vendor || prev.vendor,
          date: extracted.date || prev.date,
          category: mapToExpenseCategory(extracted.category) || prev.category,
          description: prev.description,
        }));

        if (extracted.amount) {
          setAutoExtracted(true);
        } else {
          setExtractionWarning(
            'Could not automatically extract the amount. Please enter it manually.'
          );
        }
      } else {
        setExtractionWarning(
          'OCR extraction failed. Please fill in the details manually.'
        );
      }
    } catch {
      setExtractionWarning('Could not scan receipt. Please fill in the details manually.');
    } finally {
      setExtracting(false);
      setStep('review');
    }
  };

  // ── Step 3: Create the expense ─────────────────────────────────────────────
  const handleCreateExpense = async () => {
    if (!uploadedDocId || !selectedPropertyId) return;

    const amount = parseFloat(expenseData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      // Use the extract-receipt endpoint which creates the expense AND links the document
      const res = await fetch('/api/documents/extract-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: uploadedDocId,
          propertyId: selectedPropertyId,
          overrides: {
            amount,
            category: expenseData.category,
            vendor: expenseData.vendor || undefined,
            description: expenseData.description || undefined,
            date: expenseData.date,
          },
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const propName = properties.find((p) => p.id === selectedPropertyId)?.name;
        toast({
          title: 'Expense created!',
          description: `$${amount.toFixed(2)} filed to ${propName || 'property'}.`,
        });
        onSuccess();
        handleClose();
      } else {
        console.error('[ReceiptUploadDialog] extract-receipt failed:', result);
        toast({
          title: 'Failed to create expense',
          description: result.message || `Server returned ${res.status}. Check the amount and date fields.`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('[ReceiptUploadDialog] handleCreateExpense error:', err);
      toast({ title: 'Failed to create expense', description: 'Network error — please try again.', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  // ── Step indicator ─────────────────────────────────────────────────────────
  const STEPS: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'property', label: 'Property' },
    { key: 'review', label: 'Review' },
  ];
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg mx-4 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Receipt className="h-5 w-5 text-emerald-500" />
            {step === 'upload' && 'Upload Receipt'}
            {step === 'property' && 'Select Property'}
            {step === 'review' && 'Review & Create Expense'}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {step === 'upload' && 'Upload a photo or PDF of your receipt.'}
            {step === 'property' && 'Which property is this expense for?'}
            {step === 'review' && 'Verify the extracted data and create the expense.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-1">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  i < stepIndex
                    ? 'bg-emerald-500 text-white'
                    : i === stepIndex
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-200'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < stepIndex ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-1">
          {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
          {step === 'upload' && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  file
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
                    <p className="text-sm font-semibold text-gray-800 truncate px-4">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 mx-auto"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ScanLine className="h-10 w-10 mx-auto text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">
                      Click or drag to upload receipt
                    </p>
                    <p className="text-xs text-gray-400">PDF, JPG, PNG, WEBP — max 10 MB</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
                <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Our AI will scan the receipt and automatically extract the vendor, amount, date, and category.
                </p>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Upload Receipt</>
                )}
              </Button>
            </>
          )}

          {/* ── Step 2: Property ───────────────────────────────────────────── */}
          {step === 'property' && (
            <>
              {uploadedFileUrl && (
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-700 truncate">{file?.name}</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 ml-auto" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700">
                  <Building2 className="h-4 w-4 text-cyan-500" />
                  Which property is this for?
                </Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger className="bg-white border-gray-200 text-gray-800">
                    <SelectValue placeholder="Select a property…" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          <span>{prop.name}</span>
                          {prop.address?.city && (
                            <span className="text-gray-400 text-xs">({prop.address.city})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('upload')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePropertySelect}
                  disabled={!selectedPropertyId || extracting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  {extracting ? (
                    <><Sparkles className="h-4 w-4 mr-2 animate-pulse" /> Scanning…</>
                  ) : (
                    <>Continue <ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* ── Step 3: Review ─────────────────────────────────────────────── */}
          {step === 'review' && (
            <>
              {/* Property badge */}
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                <Building2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-medium text-emerald-800">
                  {properties.find((p) => p.id === selectedPropertyId)?.name}
                </p>
              </div>

              {/* Auto-extracted notice */}
              {autoExtracted && (
                <div className="flex items-start gap-2 rounded-lg bg-violet-50 border border-violet-200 px-3 py-2.5">
                  <Sparkles className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-violet-700">
                    Data auto-extracted from receipt. Please verify before saving.
                  </p>
                </div>
              )}

              {/* Warning if extraction failed */}
              {extractionWarning && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{extractionWarning}</p>
                </div>
              )}

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    Amount *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={expenseData.amount}
                    onChange={(e) =>
                      setExpenseData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className={`bg-white border-gray-200 text-gray-900 ${
                      autoExtracted && expenseData.amount ? 'border-emerald-300 bg-emerald-50/30' : ''
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Calendar className="h-3.5 w-3.5 text-violet-500" />
                    Date *
                  </Label>
                  <Input
                    type="date"
                    value={expenseData.date}
                    onChange={(e) =>
                      setExpenseData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className={`bg-white border-gray-200 text-gray-900 ${
                      autoExtracted && expenseData.date ? 'border-emerald-300 bg-emerald-50/30' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Tag className="h-3.5 w-3.5 text-amber-500" />
                  Category *
                </Label>
                <Select
                  value={expenseData.category}
                  onValueChange={(v) =>
                    setExpenseData((prev) => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger className={`bg-white border-gray-200 text-gray-800 ${
                    autoExtracted && expenseData.category ? 'border-emerald-300 bg-emerald-50/30' : ''
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vendor */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Store className="h-3.5 w-3.5 text-blue-500" />
                  Vendor
                </Label>
                <Input
                  placeholder="e.g., Home Depot, Lowe's"
                  value={expenseData.vendor}
                  onChange={(e) =>
                    setExpenseData((prev) => ({ ...prev, vendor: e.target.value }))
                  }
                  className={`bg-white border-gray-200 text-gray-900 ${
                    autoExtracted && expenseData.vendor ? 'border-emerald-300 bg-emerald-50/30' : ''
                  }`}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">Notes (optional)</Label>
                <Textarea
                  placeholder="What was this expense for?"
                  value={expenseData.description}
                  onChange={(e) =>
                    setExpenseData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="bg-white border-gray-200 text-gray-900 min-h-[60px] resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setStep('property')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateExpense}
                  disabled={processing || !expenseData.amount}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
                >
                  {processing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Create Expense</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Map API category names → EXPENSE_CATEGORIES values ──────────────────────
function mapToExpenseCategory(raw?: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  // Direct matches
  const direct: Record<string, string> = {
    maintenance: 'maintenance',
    utilities: 'utilities',
    owner_paid_utilities: 'utilities',
    insurance: 'insurance',
    taxes: 'taxes',
    supplies: 'supplies',
    landscaping: 'landscaping',
    cleaning: 'cleaning',
    legal: 'legal',
    advertising: 'advertising',
    management: 'management',
    one_time_repairs: 'maintenance',
    recurring_expenses: 'management',
    platform_fees: 'management',
    other: 'other',
  };
  return direct[lower] ?? 'other';
}
