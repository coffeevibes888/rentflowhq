'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Save, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWizard } from './wizard-context';
import { getStepsForPropertyType } from './use-wizard-state';
import { useToast } from '@/hooks/use-toast';

interface WizardNavigationProps {
  onValidate?: () => boolean;
  isSubmitting?: boolean;
}

export function WizardNavigation({ onValidate, isSubmitting = false }: WizardNavigationProps) {
  const { state, nextStep, prevStep, saveDraft, submitProperty } = useWizard();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingProperty, setIsSubmittingProperty] = useState(false);

  const steps = getStepsForPropertyType(state.propertyType);
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === steps.length - 1;
  const currentStepId = steps[state.currentStep]?.id;

  const handleNext = () => {
    // Run validation if provided and it's a function
    if (onValidate && typeof onValidate === 'function') {
      if (!onValidate()) {
        return;
      }
    }
    nextStep();
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveDraft();
      toast({
        title: 'Draft saved',
        description: 'Your progress has been saved. You can continue later.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to save',
        description: 'Could not save your draft. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Run validation if provided and it's a function
    if (onValidate && typeof onValidate === 'function') {
      if (!onValidate()) {
        return;
      }
    }

    setIsSubmittingProperty(true);
    try {
      const result = await submitProperty();
      if (result.success) {
        toast({
          title: 'Property created!',
          description: result.message || 'Your property has been successfully created.',
        });
        // Navigation will be handled by parent component
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to create property',
          description: result.message || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmittingProperty(false);
    }
  };

  const isLoading = isSaving || isSubmittingProperty || isSubmitting;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-indigo-700/30">
      {/* Left side - Back button */}
      <div className="w-full sm:w-auto">
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={isLoading}
            className="w-full sm:w-auto border-indigo-600 text-white hover:bg-indigo-700/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Right side - Save Draft and Next/Submit */}
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {/* Save Draft - only show after property type is selected */}
        {state.propertyType && state.isDirty && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="w-full sm:w-auto border-indigo-600 text-white hover:bg-indigo-700/50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
        )}

        {/* Next or Submit button */}
        {isLastStep ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmittingProperty ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Create Property
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isLoading || (currentStepId === 'type' && !state.propertyType)}
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
