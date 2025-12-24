'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { X, PenTool, Type, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SignatureField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'name' | 'text';
  role: 'tenant' | 'landlord';
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
}

interface CustomPDFSigningModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  documentUrl: string;
  documentName: string;
  signatureFields: SignatureField[];
  recipientName: string;
  recipientEmail: string;
  role: 'tenant' | 'landlord';
  leaseDetails: {
    landlordName: string;
    tenantName: string;
    propertyLabel: string;
  };
}

type SignatureMode = 'draw' | 'type';

const SIGNATURE_FONTS = [
  { name: 'Brush Script MT', style: 'brush' },
  { name: 'Lucida Handwriting', style: 'cursive' },
  { name: 'Segoe Script', style: 'elegant' },
];

function generateStampSignature(name: string, style: number = 0): string {
  if (!name) return '';
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a1a2e';
  ctx.font = `italic 48px ${SIGNATURE_FONTS[style % SIGNATURE_FONTS.length].name}, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, canvas.width / 2, canvas.height / 2);
  
  return canvas.toDataURL('image/png');
}

function generateInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function generateInitialStamp(initials: string): string {
  if (!initials) return '';
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'italic 32px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, canvas.width / 2, canvas.height / 2);
  
  return canvas.toDataURL('image/png');
}

export default function CustomPDFSigningModal({
  open,
  onClose,
  token,
  documentUrl,
  documentName,
  signatureFields,
  recipientName,
  recipientEmail,
  role,
  leaseDetails,
}: CustomPDFSigningModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [consent, setConsent] = useState(false);
  const [signerName, setSignerName] = useState(recipientName || '');
  const [signerEmail, setSignerEmail] = useState(recipientEmail || '');
  const [submitting, setSubmitting] = useState(false);
  
  const [signatureMode, setSignatureMode] = useState<SignatureMode>('type');
  const [signatureStyleIndex, setSignatureStyleIndex] = useState(0);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [initialsDataUrl, setInitialsDataUrl] = useState<string>('');
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Generate typed signature/initials when name changes
  useEffect(() => {
    if (signerName && signatureMode === 'type') {
      setSignatureDataUrl(generateStampSignature(signerName, signatureStyleIndex));
      setInitialsDataUrl(generateInitialStamp(generateInitials(signerName)));
    }
  }, [signerName, signatureMode, signatureStyleIndex]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineCap = 'round';
  }, []);

  useEffect(() => {
    if (signatureMode === 'draw' && activeFieldId) {
      setTimeout(setupCanvas, 100);
    }
  }, [signatureMode, activeFieldId, setupCanvas]);

  // Canvas drawing handlers
  useEffect(() => {
    if (signatureMode !== 'draw' || !activeFieldId) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let drawing = false;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      drawing = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const move = (e: PointerEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const end = (e: PointerEvent) => {
      if (drawing) {
        e.preventDefault();
        canvas.releasePointerCapture(e.pointerId);
        drawing = false;
        ctx.closePath();
      }
    };

    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointerleave', end);

    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointerleave', end);
    };
  }, [signatureMode, activeFieldId]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const applyDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeFieldId) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const field = signatureFields.find(f => f.id === activeFieldId);
    
    if (field?.type === 'signature') {
      setSignatureDataUrl(dataUrl);
    } else if (field?.type === 'initial') {
      setInitialsDataUrl(dataUrl);
    }
    
    setCompletedFields(prev => new Set([...prev, activeFieldId]));
    setActiveFieldId(null);
  };

  const applyTypedField = (fieldId: string) => {
    setCompletedFields(prev => new Set([...prev, fieldId]));
    setActiveFieldId(null);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const currentPageFields = signatureFields.filter(f => f.page === currentPage);
  const requiredFields = signatureFields.filter(f => f.required);
  const allRequiredCompleted = requiredFields.every(f => completedFields.has(f.id));

  const handleSubmit = async () => {
    if (!allRequiredCompleted) {
      toast({ title: 'Incomplete', description: 'Please complete all required signature fields.' });
      return;
    }
    if (!consent) {
      toast({ title: 'Consent required', description: 'Please agree to sign electronically.' });
      return;
    }
    if (!signatureDataUrl) {
      toast({ title: 'Missing signature', description: 'Please provide your signature.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl,
          initialsDataUrl,
          signerName,
          signerEmail,
          consent: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit signature');
      }

      toast({ title: 'Signed!', description: 'Your signature was recorded successfully.' });
      onClose();
      if (role === 'tenant') {
        router.push('/user/profile/rent-receipts');
      } else {
        router.refresh();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to sign' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !mounted) return null;

  const activeField = activeFieldId ? signatureFields.find(f => f.id === activeFieldId) : null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-6xl h-[95dvh] max-h-[900px] rounded-xl bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Sign Document</h2>
            <p className="text-xs text-slate-400">{documentName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* PDF Viewer */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-800/50">
            {/* Page Navigation */}
            <div className="flex items-center justify-center gap-4 py-2 border-b border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-300">
                Page {currentPage} of {numPages || '...'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* PDF with Field Overlays */}
            <div className="flex-1 overflow-auto p-4 flex justify-center">
              <div className="relative bg-white shadow-lg">
                <Document
                  file={documentUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center h-[700px] w-[540px]">
                      <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                    </div>
                  }
                >
                  <Page
                    pageNumber={currentPage}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={540}
                  />
                </Document>

                {/* Signature Field Overlays */}
                {currentPageFields.map(field => {
                  const isCompleted = completedFields.has(field.id);
                  const isActive = activeFieldId === field.id;
                  
                  return (
                    <div
                      key={field.id}
                      onClick={() => !isCompleted && setActiveFieldId(field.id)}
                      className={cn(
                        'absolute border-2 rounded cursor-pointer transition-all flex items-center justify-center',
                        isCompleted
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : isActive
                          ? 'border-violet-500 bg-violet-500/20'
                          : 'border-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                      )}
                      style={{
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        width: `${field.width}%`,
                        height: `${field.height}%`,
                      }}
                    >
                      {isCompleted ? (
                        field.type === 'signature' && signatureDataUrl ? (
                          <img src={signatureDataUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                        ) : field.type === 'initial' && initialsDataUrl ? (
                          <img src={initialsDataUrl} alt="Initials" className="max-h-full max-w-full object-contain" />
                        ) : field.type === 'date' ? (
                          <span className="text-xs text-slate-700">{new Date().toLocaleDateString()}</span>
                        ) : field.type === 'name' ? (
                          <span className="text-xs text-slate-700">{signerName}</span>
                        ) : (
                          <Check className="h-4 w-4 text-emerald-600" />
                        )
                      ) : (
                        <span className="text-xs font-medium text-amber-700">
                          {field.type === 'signature' ? 'Sign' : field.type === 'initial' ? 'Initial' : field.type}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Signing Panel */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-900 flex flex-col">
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Signer Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400">Your Name</label>
                  <Input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email</label>
                  <Input
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Active Field Signing */}
              {activeField && (
                <div className="p-4 rounded-lg border border-violet-500/30 bg-violet-500/10 space-y-3">
                  <h4 className="text-sm font-medium text-white">
                    {activeField.type === 'signature' ? 'Add Your Signature' : 
                     activeField.type === 'initial' ? 'Add Your Initials' :
                     activeField.type === 'date' ? 'Confirm Date' :
                     activeField.type === 'name' ? 'Confirm Name' : 'Complete Field'}
                  </h4>

                  {(activeField.type === 'signature' || activeField.type === 'initial') && (
                    <>
                      {/* Mode Toggle */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSignatureMode('type')}
                          className={cn(
                            'flex-1 py-2 px-3 rounded text-sm font-medium',
                            signatureMode === 'type' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300'
                          )}
                        >
                          <Type className="h-4 w-4 inline mr-1" />
                          Type
                        </button>
                        <button
                          onClick={() => {
                            setSignatureMode('draw');
                            setTimeout(setupCanvas, 100);
                          }}
                          className={cn(
                            'flex-1 py-2 px-3 rounded text-sm font-medium',
                            signatureMode === 'draw' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300'
                          )}
                        >
                          <PenTool className="h-4 w-4 inline mr-1" />
                          Draw
                        </button>
                      </div>

                      {signatureMode === 'type' ? (
                        <div className="space-y-2">
                          <div className="bg-white rounded p-3 min-h-[60px] flex items-center justify-center">
                            {signerName ? (
                              <img
                                src={activeField.type === 'signature' ? signatureDataUrl : initialsDataUrl}
                                alt="Preview"
                                className="max-h-12"
                              />
                            ) : (
                              <span className="text-slate-400 text-sm">Enter your name above</span>
                            )}
                          </div>
                          {activeField.type === 'signature' && (
                            <div className="flex gap-1 justify-center">
                              {[0, 1, 2].map(i => (
                                <button
                                  key={i}
                                  onClick={() => setSignatureStyleIndex(i)}
                                  className={cn(
                                    'px-2 py-1 rounded text-xs',
                                    signatureStyleIndex === i ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300'
                                  )}
                                >
                                  Style {i + 1}
                                </button>
                              ))}
                            </div>
                          )}
                          <Button
                            onClick={() => applyTypedField(activeField.id)}
                            disabled={!signerName}
                            className="w-full bg-violet-600 hover:bg-violet-700"
                          >
                            Apply
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-white rounded overflow-hidden">
                            <canvas
                              ref={canvasRef}
                              className="w-full cursor-crosshair"
                              style={{ height: activeField.type === 'signature' ? '100px' : '60px', touchAction: 'none' }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={clearCanvas} className="flex-1">
                              Clear
                            </Button>
                            <Button onClick={applyDrawnSignature} className="flex-1 bg-violet-600 hover:bg-violet-700">
                              Apply
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {activeField.type === 'date' && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-300">Today's date will be applied:</p>
                      <p className="text-lg font-medium text-white">{new Date().toLocaleDateString()}</p>
                      <Button
                        onClick={() => applyTypedField(activeField.id)}
                        className="w-full bg-violet-600 hover:bg-violet-700"
                      >
                        Apply Date
                      </Button>
                    </div>
                  )}

                  {activeField.type === 'name' && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-300">Your name will be applied:</p>
                      <p className="text-lg font-medium text-white">{signerName || 'Enter name above'}</p>
                      <Button
                        onClick={() => applyTypedField(activeField.id)}
                        disabled={!signerName}
                        className="w-full bg-violet-600 hover:bg-violet-700"
                      >
                        Apply Name
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progress</span>
                  <span>{completedFields.size} / {signatureFields.length} fields</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 transition-all"
                    style={{ width: `${(completedFields.size / signatureFields.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Field List */}
              <div className="space-y-1">
                <p className="text-xs text-slate-400 mb-2">Fields to complete:</p>
                {signatureFields.map(field => (
                  <button
                    key={field.id}
                    onClick={() => {
                      setCurrentPage(field.page);
                      if (!completedFields.has(field.id)) {
                        setActiveFieldId(field.id);
                      }
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded text-sm',
                      completedFields.has(field.id)
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    <span className="capitalize">{field.type} (p.{field.page})</span>
                    {completedFields.has(field.id) && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(v) => setConsent(!!v)}
                />
                <label htmlFor="consent" className="text-xs text-slate-400 cursor-pointer">
                  I agree that my electronic signature is legally binding.
                </label>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !allRequiredCompleted || !consent}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {submitting ? 'Submitting...' : 'Complete & Sign'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
