'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { X, PenTool, Type, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface SignSession {
  leaseId: string;
  role: 'tenant' | 'landlord';
  recipientName: string;
  recipientEmail: string;
  leaseHtml: string;
}

interface LeaseSigningModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
}

type SignatureMode = 'draw' | 'type';
type TabType = 'initial' | 'signature';

interface SignatureTab {
  id: string;
  type: TabType;
  label: string;
  placeholder: string;
  value: string | null;
  completed: boolean;
}

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
  
  const slant = -0.1;
  ctx.setTransform(1, 0, slant, 1, 0, 0);
  ctx.fillText(name, canvas.width / 2, canvas.height / 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
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

export default function LeaseSigningModal({ open, onClose, token }: LeaseSigningModalProps) {
  const router = useRouter();
  const [session, setSession] = useState<SignSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [signatureMode, setSignatureMode] = useState<SignatureMode>('type');
  const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
  const [tabs, setTabs] = useState<SignatureTab[]>([]);
  const [currentSignature, setCurrentSignature] = useState<string>('');
  const [currentInitials, setCurrentInitials] = useState<string>('');
  const [signatureStyleIndex, setSignatureStyleIndex] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<HTMLDivElement>(null);

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
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    
    let canceled = false;
    setLoading(true);
    setError(null);
    
    const run = async () => {
      try {
        const res = await fetch(`/api/sign/${token}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load signing session');
        }
        const data = (await res.json()) as SignSession;
        if (canceled) return;
        setSession(data);
        setSignerName(data.recipientName || '');
        setSignerEmail(data.recipientEmail || '');
        
        const extractedTabs: SignatureTab[] = [];
        const role = data.role;
        
        if (role === 'tenant') {
          for (let i = 1; i <= 6; i++) {
            if (data.leaseHtml.includes(`/init${i}/`)) {
              extractedTabs.push({
                id: `init${i}`,
                type: 'initial',
                label: `Section ${i} Initial`,
                placeholder: `/init${i}/`,
                value: null,
                completed: false,
              });
            }
          }
          if (data.leaseHtml.includes('/sig_tenant/')) {
            extractedTabs.push({
              id: 'sig_tenant',
              type: 'signature',
              label: 'Tenant Signature',
              placeholder: '/sig_tenant/',
              value: null,
              completed: false,
            });
          }
        } else {
          if (data.leaseHtml.includes('/sig_landlord/')) {
            extractedTabs.push({
              id: 'sig_landlord',
              type: 'signature',
              label: 'Landlord Signature',
              placeholder: '/sig_landlord/',
              value: null,
              completed: false,
            });
          }
        }
        
        setTabs(extractedTabs);
        if (extractedTabs.length > 0) {
          setActiveTabIndex(0);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to load signing session');
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    run();
    return () => {
      canceled = true;
    };
  }, [token, open]);

  useEffect(() => {
    if (signerName && signatureMode === 'type') {
      setCurrentSignature(generateStampSignature(signerName, signatureStyleIndex));
      setCurrentInitials(generateInitialStamp(generateInitials(signerName)));
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
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (!open || signatureMode !== 'draw' || activeTabIndex === null) return;
    
    const timer = setTimeout(setupCanvas, 100);
    return () => clearTimeout(timer);
  }, [open, signatureMode, activeTabIndex, setupCanvas]);

  useEffect(() => {
    if (!open || signatureMode !== 'draw' || activeTabIndex === null) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let drawing = false;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top 
      };
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
    canvas.addEventListener('pointercancel', end);

    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointerleave', end);
      canvas.removeEventListener('pointercancel', end);
    };
  }, [open, signatureMode, activeTabIndex]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const applyCurrentTab = () => {
    if (activeTabIndex === null || !tabs[activeTabIndex]) return;
    
    const tab = tabs[activeTabIndex];
    let value: string | null = null;
    
    if (signatureMode === 'type') {
      value = tab.type === 'signature' ? currentSignature : currentInitials;
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        value = canvas.toDataURL('image/png');
      }
    }
    
    if (value) {
      setTabs(prev => prev.map((t, i) => 
        i === activeTabIndex ? { ...t, value, completed: true } : t
      ));
      
      if (activeTabIndex < tabs.length - 1) {
        setActiveTabIndex(activeTabIndex + 1);
        if (signatureMode === 'draw') {
          setTimeout(setupCanvas, 100);
        }
      } else {
        setActiveTabIndex(null);
      }
    }
  };

  const handleTabClick = (index: number) => {
    setActiveTabIndex(index);
    if (signatureMode === 'draw') {
      setTimeout(setupCanvas, 100);
    }
  };

  const allTabsCompleted = tabs.length > 0 && tabs.every(t => t.completed);

  const processedLeaseHtml = useMemo(() => {
    if (!session?.leaseHtml) return '';
    
    let html = session.leaseHtml;
    
    tabs.forEach((tab) => {
      if (tab.completed && tab.value) {
        const imgStyle = tab.type === 'signature' 
          ? 'height: 38px; display: block; margin: 0 auto; position: relative; bottom: 2px;'
          : 'height: 24px; display: block; margin: 0 auto; position: relative; bottom: 2px;';
        const imgTag = `<img src="${tab.value}" alt="${tab.type}" style="${imgStyle}" />`;
        html = html.replace(tab.placeholder, imgTag);
      } else {
        const isActive = tabs[activeTabIndex ?? -1]?.id === tab.id;
        const tabButton = `<span 
          data-tab-id="${tab.id}" 
          style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 16px;
            background: ${isActive ? '#8b5cf6' : '#fef3c7'};
            color: ${isActive ? '#ffffff' : '#92400e'};
            border: 2px solid ${isActive ? '#7c3aed' : '#f59e0b'};
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            pointer-events: auto;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          "
        >${tab.type === 'signature' ? 'Sign Here' : 'Initial'}</span>`;
        html = html.replace(tab.placeholder, tabButton);
      }
    });
    
    return html;
  }, [session?.leaseHtml, tabs, activeTabIndex]);

  const handleSubmit = async () => {
    if (!session) return;
    if (!allTabsCompleted) {
      toast({ title: 'Incomplete', description: 'Please complete all signature and initial fields.' });
      return;
    }
    if (!consent) {
      toast({ title: 'Consent required', description: 'Please agree to sign electronically.' });
      return;
    }
    
    const signatureTab = tabs.find(t => t.type === 'signature');
    if (!signatureTab?.value) {
      toast({ title: 'Missing signature', description: 'Please provide your signature.' });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl: signatureTab.value,
          signerName,
          signerEmail,
          consent: true,
          initialsData: tabs.filter(t => t.type === 'initial').map(t => ({
            id: t.id,
            value: t.value,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit signature');
      }
      toast({ title: 'Signed', description: 'Your signature was recorded.' });
      onClose();
      if (session.role === 'tenant') {
        router.push('/user/profile/rent-receipts');
      } else {
        // Redirect landlord to admin dashboard or properties page
        router.push('/admin/products');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to sign' });
    } finally {
      setSubmitting(false);
    }
  };

  const goToPreviousTab = () => {
    if (activeTabIndex !== null && activeTabIndex > 0) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  const goToNextTab = () => {
    if (activeTabIndex !== null && activeTabIndex < tabs.length - 1) {
      setActiveTabIndex(activeTabIndex + 1);
    }
  };

  const handleLeaseClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const elWithId = target.closest('[data-tab-id]') as HTMLElement | null;
    const tabId = elWithId?.getAttribute('data-tab-id');
    if (!tabId) return;

    const index = tabs.findIndex((t) => t.id === tabId);
    if (index !== -1) {
      handleTabClick(index);
    }
  };

  if (!open || !mounted) return null;

  const activeTab = activeTabIndex !== null ? tabs[activeTabIndex] : null;
  const previewSrc = activeTab?.type === 'signature' ? currentSignature : currentInitials;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 z-0 bg-black/30" onClick={onClose} />

      <div 
        className="pointer-events-auto relative z-10 w-full max-w-6xl h-[95dvh] sm:h-[90dvh] max-h-[900px] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: '#fafaf9' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b"
          style={{ borderColor: '#e5e5e5', background: '#ffffff' }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">Sign Lease</h2>
            {session && (
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                {session.role === 'tenant' ? 'Tenant' : 'Landlord'} • {session.recipientEmail}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-2 rounded-full p-2 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="outline" onClick={onClose}>Close</Button>
              </div>
            </div>
          )}

          {session && !loading && (
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              <div 
                className="flex-1 flex flex-col min-h-0 lg:border-r"
                style={{ borderColor: '#e5e5e5' }}
              >
                <div 
                  className="px-4 sm:px-6 py-3 border-b flex items-center justify-between flex-shrink-0"
                  style={{ borderColor: '#e5e5e5', background: '#ffffff' }}
                >
                  <h3 className="text-sm font-semibold text-gray-900">Lease Document</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{tabs.filter(t => t.completed).length}/{tabs.length} completed</span>
                  </div>
                </div>
                
                <div 
                  className="flex-1 overflow-auto min-h-0 p-4 sm:p-6" 
                  style={{ background: '#ffffff' }}
                  onClick={handleLeaseClick}
                >
                  <div
                    className="prose prose-sm max-w-none text-gray-800"
                    style={{ fontSize: '14px', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: processedLeaseHtml }}
                  />
                </div>

                <div 
                  className="px-4 sm:px-6 py-3 border-t flex-shrink-0 overflow-x-auto"
                  style={{ borderColor: '#e5e5e5', background: '#f5f5f4' }}
                >
                  <div className="flex gap-2 min-w-max">
                    {tabs.map((tab, index) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(index)}
                        className={
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ' +
                          (activeTabIndex === index
                            ? 'bg-violet-600 text-white shadow-md'
                            : tab.completed
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                              : 'bg-white text-gray-700 border border-gray-300 hover:border-violet-400')
                        }
                      >
                        {tab.completed && <Check className="h-4 w-4" />}
                        <span className="whitespace-nowrap">
                          {tab.type === 'initial' ? `Initial ${tab.id.replace('init', '')}` : tab.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div 
                className="w-full lg:w-96 flex flex-col flex-shrink-0 min-h-0 overflow-hidden"
                style={{ background: '#fafaf9' }}
              >
                {activeTab ? (
                  <>
                    <div 
                      className="px-4 sm:px-6 py-3 border-b flex items-center justify-between flex-shrink-0"
                      style={{ borderColor: '#e5e5e5', background: '#ffffff' }}
                    >
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={goToPreviousTab}
                          disabled={activeTabIndex === 0}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <span className="text-sm font-semibold text-gray-900">
                          {activeTab.type === 'signature' ? 'Sign Here' : 'Initial Here'}
                        </span>
                        <button 
                          onClick={goToNextTab}
                          disabled={activeTabIndex === tabs.length - 1}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-500">
                        {(activeTabIndex ?? 0) + 1} of {tabs.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 min-h-0">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">Your Name</label>
                        <Input 
                          value={signerName} 
                          onChange={(e) => setSignerName(e.target.value)}
                          placeholder="Enter your full name"
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>

                      <div 
                        className="flex rounded-lg p-1 gap-1"
                        style={{ background: '#e5e5e5' }}
                      >
                        <button
                          onClick={() => setSignatureMode('type')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                            signatureMode === 'type' 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Type className="h-4 w-4" />
                          <span>Auto Generate</span>
                        </button>
                        <button
                          onClick={() => {
                            setSignatureMode('draw');
                            setTimeout(setupCanvas, 100);
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                            signatureMode === 'draw' 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <PenTool className="h-4 w-4" />
                          <span>Draw</span>
                        </button>
                      </div>

                      {signatureMode === 'type' ? (
                        <div className="space-y-3">
                          <div 
                            className="rounded-xl border-2 p-4 flex items-center justify-center min-h-[120px]"
                            style={{ borderColor: '#d4d4d4', background: '#ffffff' }}
                          >
                            {signerName && previewSrc ? (
                              <img 
                                src={previewSrc} 
                                alt={activeTab.type === 'signature' ? 'Signature preview' : 'Initials preview'}
                                className="max-h-20 object-contain"
                              />
                            ) : (
                              <p className="text-gray-400 text-sm">Enter your name above</p>
                            )}
                          </div>
                          
                          {activeTab.type === 'signature' && signerName && (
                            <div className="flex justify-center gap-2">
                              {[0, 1, 2].map((styleIdx) => (
                                <button
                                  key={styleIdx}
                                  onClick={() => setSignatureStyleIndex(styleIdx)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    signatureStyleIndex === styleIdx
                                      ? 'bg-violet-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  Style {styleIdx + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div 
                            ref={signaturePadRef}
                            className="rounded-xl border-2 overflow-hidden"
                            style={{ borderColor: '#8b5cf6', background: '#ffffff' }}
                          >
                            <canvas 
                              ref={canvasRef} 
                              className="w-full cursor-crosshair"
                              style={{ 
                                height: activeTab.type === 'signature' ? '140px' : '100px',
                                touchAction: 'none' 
                              }}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                              Use your finger, stylus, or mouse
                            </p>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={clearCanvas}
                              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={applyCurrentTab}
                        disabled={!signerName}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-5"
                      >
                        {activeTab.completed ? 'Update' : 'Apply'} {activeTab.type === 'signature' ? 'Signature' : 'Initial'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 min-h-0">
                    <div 
                      className="flex-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center"
                      style={{ borderColor: '#d4d4d4', background: '#ffffff' }}
                    >
                      <Check className="h-12 w-12 text-emerald-500 mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">All Fields Complete</h3>
                      <p className="text-sm text-gray-500">Review and submit your signature below</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <Input 
                        value={signerEmail} 
                        onChange={(e) => setSignerEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-white border-gray-300 text-gray-900"
                      />
                    </div>
                  </div>
                )}

                <div 
                  className="px-4 sm:px-6 py-4 border-t space-y-4 flex-shrink-0 pb-[calc(env(safe-area-inset-bottom)+16px)]"
                  style={{ borderColor: '#e5e5e5', background: '#ffffff' }}
                >
                  <div 
                    className="flex items-start gap-3 rounded-lg border p-3"
                    style={{ borderColor: '#e5e5e5', background: '#fafaf9' }}
                  >
                    <Checkbox 
                      id="consent" 
                      checked={consent} 
                      onCheckedChange={(v) => setConsent(!!v)}
                      className="mt-0.5"
                    />
                    <label htmlFor="consent" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                      I agree that my electronic signature is legally binding and equivalent to my handwritten signature.
                    </label>
                  </div>

                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting || !allTabsCompleted || !consent}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-6 text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Complete and Sign'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );

  return createPortal(modalContent, document.body);
}
