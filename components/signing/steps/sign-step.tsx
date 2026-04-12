'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, PenTool, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import SignatureCanvas, { SignatureCanvasRef } from '../signature-canvas';
import TypedSignature, { generateInitials, generateSignatureImage, generateInitialsImage, SIGNATURE_STYLES } from '../typed-signature';
import FieldChecklist from '../field-checklist';
import type { SignatureField } from '@/hooks/use-signing-wizard';
import { useRef } from 'react';

export interface SignStepProps {
  fields: SignatureField[];
  currentFieldIndex: number;
  signerName: string;
  onSignerNameChange: (name: string) => void;
  onFieldComplete: (fieldId: string, value: string) => void;
  onFieldSelect: (index: number) => void;
  onBack: () => void;
  onContinue: () => void;
  isAllComplete: boolean;
  className?: string;
}

type SignatureMode = 'draw' | 'type';

export default function SignStep({
  fields,
  currentFieldIndex,
  signerName,
  onSignerNameChange,
  onFieldComplete,
  onFieldSelect,
  onBack,
  onContinue,
  isAllComplete,
  className,
}: SignStepProps) {
  const [signatureMode, setSignatureMode] = useState<SignatureMode>('type');
  const [signatureStyleIndex, setSignatureStyleIndex] = useState(0);
  const canvasRef = useRef<SignatureCanvasRef>(null);

  const currentField = fields[currentFieldIndex] || null;
  const completedCount = fields.filter(f => f.completed).length;

  const handleApply = useCallback(() => {
    if (!currentField || !signerName) return;

    let value: string;
    
    if (signatureMode === 'type') {
      if (currentField.type === 'signature') {
        value = generateSignatureImage(signerName, SIGNATURE_STYLES[signatureStyleIndex]);
      } else {
        value = generateInitialsImage(generateInitials(signerName));
      }
    } else {
      if (canvasRef.current && !canvasRef.current.isEmpty()) {
        value = canvasRef.current.toDataURL();
      } else {
        return; // No signature drawn
      }
    }

    if (value) {
      onFieldComplete(currentField.id, value);
    }
  }, [currentField, signerName, signatureMode, signatureStyleIndex, onFieldComplete]);

  const handlePrevField = () => {
    if (currentFieldIndex > 0) {
      onFieldSelect(currentFieldIndex - 1);
    }
  };

  const handleNextField = () => {
    if (currentFieldIndex < fields.length - 1) {
      onFieldSelect(currentFieldIndex + 1);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Mobile: Stacked layout, Desktop: Side by side */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Field checklist - collapsible on mobile */}
        <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <FieldChecklist
              fields={fields}
              currentFieldIndex={currentFieldIndex}
              onFieldClick={onFieldSelect}
              variant="default"
            />
          </div>
        </div>

        {/* Signature input area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {currentField ? (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Field context */}
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  {currentField.sectionContext}
                </p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentField.type === 'signature' ? 'Sign Here' : 'Initial Here'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Field {currentFieldIndex + 1} of {fields.length}
                </p>
              </div>

              {/* Name input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Name</label>
                <Input
                  value={signerName}
                  onChange={(e) => onSignerNameChange(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-white border-gray-300"
                />
              </div>

              {/* Mode toggle */}
              <div className="flex rounded-lg p-1 gap-1 bg-gray-200">
                <button
                  onClick={() => setSignatureMode('type')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all',
                    signatureMode === 'type'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Type className="h-4 w-4" />
                  <span>Auto Generate</span>
                </button>
                <button
                  onClick={() => setSignatureMode('draw')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all',
                    signatureMode === 'draw'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <PenTool className="h-4 w-4" />
                  <span>Draw</span>
                </button>
              </div>

              {/* Signature input */}
              {signatureMode === 'type' ? (
                <TypedSignature
                  name={signerName}
                  type={currentField.type}
                  styleIndex={signatureStyleIndex}
                  onStyleChange={setSignatureStyleIndex}
                  showStyleSelector={currentField.type === 'signature'}
                />
              ) : (
                <SignatureCanvas
                  ref={canvasRef}
                  height={currentField.type === 'signature' ? 150 : 100}
                  disabled={!signerName}
                />
              )}

              {/* Apply button */}
              <Button
                onClick={handleApply}
                disabled={!signerName}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-5"
              >
                {currentField.completed ? 'Update' : 'Apply'}{' '}
                {currentField.type === 'signature' ? 'Signature' : 'Initial'}
              </Button>

              {/* Field navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  onClick={handlePrevField}
                  disabled={currentFieldIndex === 0}
                  className="text-gray-600"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleNextField}
                  disabled={currentFieldIndex === fields.length - 1}
                  className="text-gray-600"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-gray-500">No fields to sign</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="text-gray-600">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Review
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              {completedCount}/{fields.length} fields complete
            </span>
            <Button
              onClick={onContinue}
              disabled={!isAllComplete}
              className="bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
