'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSigningWizard, SignatureField } from '@/hooks/use-signing-wizard';
import SigningProgress from './signing-progress';
import ReviewStep from './steps/review-step';
import SignStep from './steps/sign-step';
import ConfirmStep from './steps/confirm-step';

interface SignSession {
  leaseId: string;
  role: 'tenant' | 'landlord';
  recipientName: string;
  recipientEmail: string;
  leaseHtml?: string;
  documentType?: 'html_template' | 'custom_pdf';
  documentName?: string;
  documentUrl?: string;
  signatureFields?: Array<{
    id: string;
    type: 'signature' | 'initial' | 'date' | 'text';
    role: 'tenant' | 'landlord';
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    required?: boolean;
    label?: string;
    sectionContext?: string;
  }>;
  leaseDetails?: {
    landlordName: string;
    tenantName: string;
    propertyLabel: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
  };
}

export interface LeaseSigningModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
}

function extractFieldsFromSession(session: SignSession): SignatureField[] {
  const fields: SignatureField[] = [];
  const role = session.role;

  if (session.documentType === 'custom_pdf' && session.signatureFields) {
    session.signatureFields.forEach((field) => {
      if (field.role === role && (field.type === 'signature' || field.type === 'initial')) {
        fields.push({
          id: field.id,
          type: field.type,
          label: field.label || (field.type === 'signature' ? 'Signature' : 'Initial'),
          sectionContext: field.sectionContext || 'Document',
          required: field.required !== false,
          value: null,
          completed: false,
        });
      }
    });
  } else if (session.leaseHtml) {
    if (role === 'tenant') {
      for (let i = 1; i <= 6; i++) {
        if (session.leaseHtml.includes(`/init${i}/`)) {
          fields.push({
            id: `init${i}`,
            type: 'initial',
            label: `Section ${i} Initial`,
            sectionContext: `Section ${i}`,
            required: true,
            value: null,
            completed: false,
          });
        }
      }
      if (session.leaseHtml.includes('/sig_tenant/')) {
        fields.push({
          id: 'sig_tenant',
          type: 'signature',
          label: 'Tenant Signature',
          sectionContext: 'Final Signature',
          required: true,
          value: null,
          completed: false,
        });
      }
    } else {
      if (session.leaseHtml.includes('/sig_landlord/')) {
        fields.push({
          id: 'sig_landlord',
          type: 'signature',
          label: 'Landlord Signature',
          sectionContext: 'Final Signature',
          required: true,
          value: null,
          completed: false,
        });
      }
    }
  }

  if (fields.length === 0) {
    fields.push({
      id: role === 'tenant' ? 'tenant_signature' : 'landlord_signature',
      type: 'signature',
      label: role === 'tenant' ? 'Tenant Signature' : 'Landlord Signature',
      sectionContext: 'Document',
      required: true,
      value: null,
      completed: false,
    });
  }

  return fields;
}

export default function LeaseSigningModal({ open, onClose, token }: LeaseSigningModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<SignSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signerEmail, setSignerEmail] = useState('');

  const wizard = useSigningWizard({
    token,
    onAllFieldsComplete: () => {
      // Auto-advance to confirm when all fields are done
    },
  });

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

    const loadSession = async () => {
      try {
        const res = await fetch(`/api/sign/${token}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load signing session');
        }
        const data = (await res.json()) as SignSession;
        if (canceled) return;

        setSession(data);
        setSignerEmail(data.recipientEmail || '');
        wizard.updateSignatureData({ signature: null, initials: null, signatureMode: 'type', signatureStyle: 0 });

        const fields = extractFieldsFromSession(data);
        wizard.initializeFields(fields);
      } catch (err: unknown) {
        if (!canceled) {
          setError(err instanceof Error ? err.message : 'Unable to load signing session');
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    loadSession();
    return () => { canceled = true; };
  }, [token, open]);

  const handleSubmit = useCallback(async () => {
    if (!session || !wizard.isAllFieldsComplete) return;

    const signatureField = wizard.fields.find(f => f.type === 'signature');
    if (!signatureField?.value) {
      toast({ title: 'Missing signature', description: 'Please provide your signature.' });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureDataUrl: signatureField.value,
          signerName: session.recipientName,
          signerEmail,
          consent: true,
          initialsData: wizard.fields
            .filter(f => f.type === 'initial')
            .map(f => ({ id: f.id, value: f.value })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit signature');
      }

      toast({ title: 'Signed', description: 'Your signature was recorded successfully.' });
      wizard.clearProgress();
      onClose();

      if (session.role === 'tenant') {
        router.push('/user/profile/rent-receipts');
      } else {
        router.push('/admin/products');
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to sign');
    } finally {
      setSubmitting(false);
    }
  }, [session, wizard, token, signerEmail, onClose, router]);

  if (!open || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 bg-white shadow-2xl overflow-hidden flex flex-col',
          // Mobile: full screen
          'w-full h-full',
          // Desktop: centered modal
          'sm:w-[95vw] sm:h-[90vh] sm:max-w-5xl sm:max-h-[800px] sm:rounded-2xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Sign Lease
            </h2>
            {session && (
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                {session.role === 'tenant' ? 'Tenant' : 'Landlord'} • {session.recipientEmail}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-2 rounded-full p-2 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress bar */}
        {session && !loading && (
          <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <SigningProgress
              currentStep={wizard.currentStep}
              completedCount={wizard.completedCount}
              totalFields={wizard.totalRequiredFields}
              variant="compact"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {session && !loading && !error && (
            <>
              {wizard.currentStep === 'review' && (
                <ReviewStep
                  leaseHtml={session.leaseHtml || ''}
                  documentName={session.documentName}
                  onContinue={() => wizard.goToSign()}
                  className="h-full"
                />
              )}

              {wizard.currentStep === 'sign' && (
                <SignStep
                  fields={wizard.fields}
                  currentFieldIndex={wizard.currentFieldIndex}
                  signerName={session.recipientName}
                  onSignerNameChange={() => {}}
                  onFieldComplete={wizard.completeField}
                  onFieldSelect={wizard.goToField}
                  onBack={() => wizard.goToReview()}
                  onContinue={() => wizard.goToConfirm()}
                  isAllComplete={wizard.isAllFieldsComplete}
                  className="h-full"
                />
              )}

              {wizard.currentStep === 'confirm' && (
                <ConfirmStep
                  fields={wizard.fields}
                  signerName={session.recipientName}
                  signerEmail={signerEmail}
                  onSignerEmailChange={setSignerEmail}
                  onBack={() => wizard.goToSign()}
                  onSubmit={handleSubmit}
                  isSubmitting={submitting}
                  error={submitError}
                  className="h-full"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
