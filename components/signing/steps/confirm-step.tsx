'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, Check, FileCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SignatureField } from '@/hooks/use-signing-wizard';

export interface ConfirmStepProps {
  fields: SignatureField[];
  signerName: string;
  signerEmail: string;
  onSignerEmailChange: (email: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string | null;
  className?: string;
}

export default function ConfirmStep({
  fields,
  signerName,
  signerEmail,
  onSignerEmailChange,
  onBack,
  onSubmit,
  isSubmitting,
  error,
  className,
}: ConfirmStepProps) {
  const [consent, setConsent] = useState(false);

  const signatureFields = fields.filter(f => f.type === 'signature');
  const initialFields = fields.filter(f => f.type === 'initial');

  const canSubmit = consent && !isSubmitting;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Success indicator */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <FileCheck className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Ready to Submit</h2>
            <p className="text-sm text-gray-500 mt-1">
              Review your signatures below and confirm to complete signing
            </p>
          </div>

          {/* Signature summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Signature Summary</h3>
            
            {/* Signer info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Signer</span>
              <span className="font-medium text-gray-900">{signerName}</span>
            </div>

            {/* Signatures applied */}
            {signatureFields.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Signatures ({signatureFields.length})
                </p>
                {signatureFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {field.label}
                      </p>
                      <p className="text-xs text-gray-500">{field.sectionContext}</p>
                    </div>
                    {field.value && (
                      <img
                        src={field.value}
                        alt="Signature"
                        className="h-8 object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Initials applied */}
            {initialFields.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Initials ({initialFields.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {initialFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200"
                    >
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs text-gray-600">{field.sectionContext}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Email confirmation */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Email for confirmation
            </label>
            <input
              type="email"
              value={signerEmail}
              onChange={(e) => onSignerEmailChange(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Legal consent */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(!!checked)}
                className="mt-1"
              />
              <label
                htmlFor="consent"
                className="text-sm text-gray-600 leading-relaxed cursor-pointer"
              >
                I agree that my electronic signature is legally binding and equivalent
                to my handwritten signature. I have reviewed the document and understand
                its contents.
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={isSubmitting}
            className="text-gray-600"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="flex-1 sm:flex-none bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-5 sm:py-2 sm:px-8 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Complete & Sign'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
