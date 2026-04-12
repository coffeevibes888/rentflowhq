'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

export type WizardStep = 'review' | 'sign' | 'confirm';

export interface SignatureField {
  id: string;
  type: 'signature' | 'initial';
  label: string;
  sectionContext: string;
  required: boolean;
  value: string | null;
  completed: boolean;
}

export interface SignatureData {
  signature: string | null;
  initials: string | null;
  signatureMode: 'draw' | 'type';
  signatureStyle: number;
}

export interface SessionProgress {
  token: string;
  completedFieldIds: string[];
  signatureData: string | null;
  initialsData: string | null;
  lastUpdated: Date;
}

export interface SigningWizardState {
  currentStep: WizardStep;
  currentFieldIndex: number;
  fields: SignatureField[];
  completedFields: Set<string>;
  signatureData: SignatureData;
  documentScrollPosition: number;
  sessionProgress: SessionProgress | null;
}

interface UseSigningWizardOptions {
  token: string;
  initialFields?: SignatureField[];
  onStepChange?: (step: WizardStep) => void;
  onFieldComplete?: (fieldId: string) => void;
  onAllFieldsComplete?: () => void;
}

const STORAGE_KEY_PREFIX = 'lease-signing-progress-';

function getStorageKey(token: string): string {
  return `${STORAGE_KEY_PREFIX}${token}`;
}

export function useSigningWizard(options: UseSigningWizardOptions) {
  const { token, initialFields = [], onStepChange, onFieldComplete, onAllFieldsComplete } = options;

  const [currentStep, setCurrentStep] = useState<WizardStep>('review');
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [fields, setFields] = useState<SignatureField[]>(initialFields);
  const [signatureData, setSignatureData] = useState<SignatureData>({
    signature: null,
    initials: null,
    signatureMode: 'type',
    signatureStyle: 0,
  });
  const [documentScrollPosition, setDocumentScrollPosition] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Computed values
  const completedFields = useMemo(() => {
    return new Set(fields.filter(f => f.completed).map(f => f.id));
  }, [fields]);

  const completedCount = useMemo(() => completedFields.size, [completedFields]);
  const totalRequiredFields = useMemo(() => fields.filter(f => f.required).length, [fields]);
  const isAllFieldsComplete = useMemo(() => {
    return fields.filter(f => f.required).every(f => f.completed);
  }, [fields]);

  const progressPercentage = useMemo(() => {
    if (totalRequiredFields === 0) return 0;
    return Math.round((completedCount / totalRequiredFields) * 100);
  }, [completedCount, totalRequiredFields]);

  const currentField = useMemo(() => {
    return fields[currentFieldIndex] || null;
  }, [fields, currentFieldIndex]);

  // Load progress from localStorage on mount
  useEffect(() => {
    if (!token || isInitialized) return;

    try {
      const stored = localStorage.getItem(getStorageKey(token));
      if (stored) {
        const progress: SessionProgress = JSON.parse(stored);
        
        // Restore completed fields
        if (progress.completedFieldIds && progress.completedFieldIds.length > 0) {
          setFields(prev => prev.map(field => ({
            ...field,
            completed: progress.completedFieldIds.includes(field.id),
          })));
        }

        // Restore signature data
        if (progress.signatureData || progress.initialsData) {
          setSignatureData(prev => ({
            ...prev,
            signature: progress.signatureData || prev.signature,
            initials: progress.initialsData || prev.initials,
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to load signing progress:', error);
    }

    setIsInitialized(true);
  }, [token, isInitialized]);

  // Save progress to localStorage when fields change
  const saveProgress = useCallback(() => {
    if (!token) return;

    try {
      const progress: SessionProgress = {
        token,
        completedFieldIds: Array.from(completedFields),
        signatureData: signatureData.signature,
        initialsData: signatureData.initials,
        lastUpdated: new Date(),
      };
      localStorage.setItem(getStorageKey(token), JSON.stringify(progress));
    } catch (error) {
      console.warn('Failed to save signing progress:', error);
    }
  }, [token, completedFields, signatureData]);

  // Auto-save on changes
  useEffect(() => {
    if (isInitialized && completedFields.size > 0) {
      saveProgress();
    }
  }, [isInitialized, completedFields, saveProgress]);

  // Load progress (manual trigger)
  const loadProgress = useCallback((): SessionProgress | null => {
    if (!token) return null;

    try {
      const stored = localStorage.getItem(getStorageKey(token));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load signing progress:', error);
    }
    return null;
  }, [token]);

  // Clear progress
  const clearProgress = useCallback(() => {
    if (!token) return;
    try {
      localStorage.removeItem(getStorageKey(token));
    } catch (error) {
      console.warn('Failed to clear signing progress:', error);
    }
  }, [token]);

  // Step navigation
  const goToStep = useCallback((step: WizardStep) => {
    // Validate step transitions
    if (step === 'confirm' && !isAllFieldsComplete) {
      console.warn('Cannot go to confirm step: not all fields are complete');
      return false;
    }

    setCurrentStep(step);
    onStepChange?.(step);
    return true;
  }, [isAllFieldsComplete, onStepChange]);

  const goToReview = useCallback(() => goToStep('review'), [goToStep]);
  
  const goToSign = useCallback(() => goToStep('sign'), [goToStep]);
  
  const goToConfirm = useCallback(() => {
    if (!isAllFieldsComplete) {
      console.warn('Cannot proceed to confirm: complete all required fields first');
      return false;
    }
    return goToStep('confirm');
  }, [goToStep, isAllFieldsComplete]);

  // Field navigation
  const nextField = useCallback(() => {
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentFieldIndex, fields.length]);

  const prevField = useCallback(() => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentFieldIndex]);

  const goToField = useCallback((index: number) => {
    if (index >= 0 && index < fields.length) {
      setCurrentFieldIndex(index);
      return true;
    }
    return false;
  }, [fields.length]);

  const goToFieldById = useCallback((fieldId: string) => {
    const index = fields.findIndex(f => f.id === fieldId);
    if (index !== -1) {
      setCurrentFieldIndex(index);
      return true;
    }
    return false;
  }, [fields]);

  // Field completion
  const completeField = useCallback((fieldId: string, value: string) => {
    setFields(prev => {
      const updated = prev.map(field => 
        field.id === fieldId 
          ? { ...field, value, completed: true }
          : field
      );
      
      // Check if all fields are now complete
      const allComplete = updated.filter(f => f.required).every(f => f.completed);
      if (allComplete) {
        onAllFieldsComplete?.();
      }
      
      return updated;
    });

    onFieldComplete?.(fieldId);

    // Auto-advance to next incomplete field
    const nextIncompleteIndex = fields.findIndex((f, i) => i > currentFieldIndex && !f.completed);
    if (nextIncompleteIndex !== -1) {
      setCurrentFieldIndex(nextIncompleteIndex);
    } else if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
    }
  }, [fields, currentFieldIndex, onFieldComplete, onAllFieldsComplete]);

  const uncompleteField = useCallback((fieldId: string) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId 
        ? { ...field, value: null, completed: false }
        : field
    ));
  }, []);

  // Update signature data
  const updateSignatureData = useCallback((updates: Partial<SignatureData>) => {
    setSignatureData(prev => ({ ...prev, ...updates }));
  }, []);

  // Set fields (for initialization)
  const initializeFields = useCallback((newFields: SignatureField[]) => {
    setFields(newFields);
    setCurrentFieldIndex(0);
  }, []);

  // Reset wizard
  const reset = useCallback(() => {
    setCurrentStep('review');
    setCurrentFieldIndex(0);
    setFields(prev => prev.map(f => ({ ...f, value: null, completed: false })));
    setSignatureData({
      signature: null,
      initials: null,
      signatureMode: 'type',
      signatureStyle: 0,
    });
    setDocumentScrollPosition(0);
    clearProgress();
  }, [clearProgress]);

  return {
    // State
    currentStep,
    currentFieldIndex,
    currentField,
    fields,
    completedFields,
    completedCount,
    totalRequiredFields,
    isAllFieldsComplete,
    progressPercentage,
    signatureData,
    documentScrollPosition,
    isInitialized,

    // Step navigation
    goToStep,
    goToReview,
    goToSign,
    goToConfirm,

    // Field navigation
    nextField,
    prevField,
    goToField,
    goToFieldById,

    // Field completion
    completeField,
    uncompleteField,

    // Signature data
    updateSignatureData,

    // Document scroll
    setDocumentScrollPosition,

    // Initialization
    initializeFields,

    // Progress persistence
    saveProgress,
    loadProgress,
    clearProgress,

    // Reset
    reset,
  };
}

export type UseSigningWizardReturn = ReturnType<typeof useSigningWizard>;
