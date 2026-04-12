'use client';

import { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createExpenseFromReceipt, EXPENSE_CATEGORIES } from '@/lib/actions/document.actions';

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
}

type Step = 'upload' | 'property' | 'details';

// Extract receipt data from OCR text
function extractReceiptDataFromText(text: string): {
  amount?: string;
  vendor?: string;
  date?: string;
  category?: string;
} {
  const result: { amount?: string; vendor?: string; date?: string; category?: string } = {};
  
  // Extract total/amount - look for patterns like "Total: $123.45" or "TOTAL $123.45"
  const amountPatterns = [
    /(?:total|amount|subtotal|grand total)[:\s]*\$?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)/i,
    /\$\s*(\d{1,3}(?:,?\d{3})*\.\d{2})/g,
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = match[1]?.replace(/,/g, '') || match[0]?.replace(/[$,\s]/g, '');
      if (amount && parseFloat(amount) > 0) {
        result.amount = amount;
        break;
      }
    }
  }
  
  // If no amount found with patterns, find the largest dollar amount (likely the total)
  if (!result.amount) {
    const allAmounts = text.match(/\$?\s*(\d{1,3}(?:,?\d{3})*\.\d{2})/g);
    if (allAmounts && allAmounts.length > 0) {
      const amounts = allAmounts.map(a => parseFloat(a.replace(/[$,\s]/g, ''))).filter(a => !isNaN(a));
      if (amounts.length > 0) {
        result.amount = Math.max(...amounts).toFixed(2);
      }
    }
  }
  
  // Extract date - various formats
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const parsed = new Date(match[1]);
        if (!isNaN(parsed.getTime())) {
          result.date = parsed.toISOString().split('T')[0];
          break;
        }
      } catch {
        // Try to parse MM/DD/YYYY format
        const parts = match[1].split(/[\/\-]/);
        if (parts.length === 3) {
          const [m, d, y] = parts;
          const year = y.length === 2 ? `20${y}` : y;
          result.date = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
      }
    }
  }
  
  // Extract vendor - usually first line or after store name patterns
  const lines = text.split('\n').filter(l => l.trim().length > 2);
  if (lines.length > 0) {
    // First non-empty line is often the store name
    const firstLine = lines[0].trim();
    if (firstLine.length > 2 && firstLine.length < 50 && !/^\d/.test(firstLine)) {
      result.vendor = firstLine.replace(/[^a-zA-Z0-9\s&'-]/g, '').trim();
    }
  }
  
  // Try to detect category based on keywords
  const lowerText = text.toLowerCase();
  if (lowerText.includes('home depot') || lowerText.includes('lowes') || lowerText.includes('hardware')) {
    result.category = 'maintenance';
    if (!result.vendor) result.vendor = lowerText.includes('home depot') ? 'Home Depot' : 'Lowes';
  } else if (lowerText.includes('electric') || lowerText.includes('gas') || lowerText.includes('water') || lowerText.includes('utility')) {
    result.category = 'utilities';
  } else if (lowerText.includes('insurance') || lowerText.includes('policy')) {
    result.category = 'insurance';
  } else if (lowerText.includes('landscap') || lowerText.includes('lawn') || lowerText.includes('garden')) {
    result.category = 'landscaping';
  } else if (lowerText.includes('clean') || lowerText.includes('janitorial')) {
    result.category = 'cleaning';
  } else if (lowerText.includes('office') || lowerText.includes('staples') || lowerText.includes('supply')) {
    result.category = 'supplies';
  }
  
  return result;
}

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
}

type Step = 'upload' | 'property' | 'details';

export function ReceiptUploadDialog({
  open,
  onOpenChange,
  properties,
  onSuccess,
}: ReceiptUploadDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('upload');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  
  // Property selection
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  
  // OCR state
  const [ocrComplete, setOcrComplete] = useState(false);
  
  // Expense details (extracted or manual)
  const [expenseData, setExpenseData] = useState({
    amount: '',
    category: 'maintenance',
    vendor: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const resetForm = useCallback(() => {
    setStep('upload');
    setFile(null);
    setUploadedDocId(null);
    setUploadedFileUrl(null);
    setSelectedPropertyId('');
    setOcrComplete(false);
    setExpenseData({
      amount: '',
      category: 'maintenance',
      vendor: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOcrComplete(false);
    }
  };

  // OCR scan the receipt image
  const scanReceipt = async (imageFile: File): Promise<string> => {
    // Dynamically import Tesseract to avoid SSR issues
    const Tesseract = await import('tesseract.js');
    
    const result = await Tesseract.recognize(imageFile, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          // Could add progress indicator here
        }
      },
    });
    
    return result.data.text;
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // First, try to OCR scan the image if it's an image file
      const isImage = file.type.startsWith('image/');
      let ocrText = '';
      
      if (isImage) {
        setScanning(true);
        toast({ title: 'Scanning receipt...', description: 'Extracting text from image' });
        
        try {
          ocrText = await scanReceipt(file);
          const extracted = extractReceiptDataFromText(ocrText);
          
          // Pre-fill expense data with extracted values
          setExpenseData(prev => ({
            ...prev,
            amount: extracted.amount || prev.amount,
            vendor: extracted.vendor || prev.vendor,
            date: extracted.date || prev.date,
            category: extracted.category || prev.category,
          }));
          
          setOcrComplete(true);
          toast({ 
            title: 'Receipt scanned!', 
            description: extracted.amount ? `Found amount: $${extracted.amount}` : 'Review extracted data below'
          });
        } catch (ocrError) {
          console.error('OCR failed:', ocrError);
          toast({ title: 'OCR scan failed', description: 'You can enter details manually', variant: 'destructive' });
        }
        setScanning(false);
      }

      // Upload the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'receipt');

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const doc = data.documents?.[0];
        if (doc) {
          setUploadedDocId(doc.id);
          setUploadedFileUrl(doc.fileUrl);
          
          // If we have OCR text, save it to the document
          if (ocrText && doc.id) {
            try {
              await fetch(`/api/documents/${doc.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ocrText,
                  ocrConfidence: 85, // Tesseract typically has good confidence
                  extractedData: {
                    amount: expenseData.amount,
                    vendor: expenseData.vendor,
                    date: expenseData.date,
                    category: expenseData.category,
                  },
                }),
              });
            } catch (e) {
              console.error('Failed to save OCR data:', e);
            }
          }
          
          setStep('property');
          toast({ title: 'Receipt uploaded', description: 'Now select a property' });
        }
      } else {
        toast({ title: 'Upload failed', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      setScanning(false);
    }
  };

  const handlePropertySelect = () => {
    if (!selectedPropertyId) {
      toast({ title: 'Please select a property', variant: 'destructive' });
      return;
    }
    setStep('details');
  };

  const handleCreateExpense = async () => {
    if (!uploadedDocId || !selectedPropertyId) return;

    const amount = parseFloat(expenseData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const result = await createExpenseFromReceipt(uploadedDocId, {
        propertyId: selectedPropertyId,
        amount,
        category: expenseData.category,
        vendor: expenseData.vendor || undefined,
        description: expenseData.description || undefined,
        date: expenseData.date,
      });

      if (result.success) {
        toast({
          title: 'Expense created!',
          description: 'Receipt filed and expense recorded for this property.',
        });
        onSuccess();
        handleClose();
      } else {
        toast({ title: result.message || 'Failed to create expense', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Create expense failed:', error);
      toast({ title: 'Failed to create expense', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {(['upload', 'property', 'details'] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === s
                ? 'bg-emerald-500 text-white'
                : i < ['upload', 'property', 'details'].indexOf(step)
                ? 'bg-emerald-500/30 text-emerald-300'
                : 'bg-white/10 text-white/50'
            }`}
          >
            {i + 1}
          </div>
          {i < 2 && (
            <ArrowRight className={`h-4 w-4 mx-2 ${
              i < ['upload', 'property', 'details'].indexOf(step)
                ? 'text-emerald-400'
                : 'text-white/30'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 border-white/20 text-white max-w-lg mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-300" />
            {step === 'upload' && 'Upload Receipt'}
            {step === 'property' && 'Select Property'}
            {step === 'details' && 'Expense Details'}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {step === 'upload' && 'Upload a receipt to scan and file it to a property.'}
            {step === 'property' && 'Which property is this receipt for?'}
            {step === 'details' && 'Review and confirm the expense details.'}
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="space-y-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <>
              <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center hover:border-emerald-400/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ScanLine className="h-10 w-10 mx-auto text-white/50" />
                      <p className="text-sm text-white/70">Click or drag to upload receipt</p>
                      <p className="text-xs text-white/50">PDF, JPG, PNG (max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || uploading || scanning}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {scanning ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    Scanning Receipt...
                  </>
                ) : uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Scan Receipt
                  </>
                )}
              </Button>
            </>
          )}

          {/* Step 2: Property Selection */}
          {step === 'property' && (
            <>
              {uploadedFileUrl && (
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-white/60 mb-2">Uploaded receipt:</p>
                  <p className="text-sm text-white truncate">{file?.name}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-violet-300" />
                  Select Property
                </Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose a property..." />
                  </SelectTrigger>
                  <SelectContent className="bg-indigo-900 border-white/20 text-white">
                    {properties.map((prop) => (
                      <SelectItem
                        key={prop.id}
                        value={prop.id}
                        className="text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-white/70" />
                          <span>{prop.name}</span>
                          {prop.address?.city && (
                            <span className="text-white/50 text-xs">
                              ({prop.address.city})
                            </span>
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
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePropertySelect}
                  disabled={!selectedPropertyId}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Expense Details */}
          {step === 'details' && (
            <>
              <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-400/30">
                <p className="text-xs text-emerald-300 mb-1">Filing to:</p>
                <p className="text-sm text-white font-medium">
                  {properties.find(p => p.id === selectedPropertyId)?.name}
                </p>
              </div>

              {ocrComplete && (
                <div className="bg-violet-500/10 rounded-lg p-3 border border-violet-400/30 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-300" />
                  <p className="text-xs text-violet-300">
                    Data auto-extracted from receipt. Please verify and adjust if needed.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-300" />
                    Amount
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-300" />
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={expenseData.date}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-amber-300" />
                  Category
                </Label>
                <Select
                  value={expenseData.category}
                  onValueChange={(value) => setExpenseData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-indigo-900 border-white/20 text-white">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                        className="text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-blue-300" />
                  Vendor (Optional)
                </Label>
                <Input
                  placeholder="e.g., Home Depot, Lowe's"
                  value={expenseData.vendor}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, vendor: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="What was this expense for?"
                  value={expenseData.description}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[60px]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('property')}
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateExpense}
                  disabled={processing || !expenseData.amount}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Create Expense
                    </>
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
