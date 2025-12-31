'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WizardProvider, useWizard } from './wizard-context';
import { WizardProgress } from './wizard-progress';
import { WizardNavigation } from './wizard-navigation';
import { getStepsForPropertyType } from './use-wizard-state';

// Step components
import {
  PropertyTypeSelector,
  BasicInfoStep,
  DetailsStep,
  PhotosStep,
  PricingStep,
  ReviewStep,
  RoomSetupStep,
  RoomDetailsStep,
  SharedSpacesStep,
  BuildingStructureStep,
  UnitTemplatesStep,
  UnitGeneratorStep,
  ComplexAmenitiesStep,
  CommercialDetailsStep,
  LandDetailsStep,
} from './steps';

interface PropertyWizardProps {
  draftId?: string;
  onComplete?: (propertyId: string) => void;
  onCancel?: () => void;
}

function WizardContent({ draftId, onComplete, onCancel }: PropertyWizardProps) {
  const router = useRouter();
  const { state, loadDraft, resetWizard } = useWizard();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [validateFn, setValidateFn] = useState<(() => boolean) | null>(null);

  const steps = getStepsForPropertyType(state.propertyType);
  const currentStepId = steps[state.currentStep]?.id;

  // Load draft if provided
  useEffect(() => {
    if (draftId) {
      loadDraft(draftId);
    }
  }, [draftId, loadDraft]);

  const handleCancel = () => {
    if (state.isDirty) {
      setShowExitDialog(true);
    } else {
      handleConfirmExit();
    }
  };

  const handleConfirmExit = () => {
    resetWizard();
    setShowExitDialog(false);
    if (onCancel) {
      onCancel();
    } else {
      router.push('/admin/products');
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStepId) {
      case 'type':
        return <PropertyTypeSelector />;
      case 'basic':
        return <BasicInfoStep setValidate={setValidateFn} />;
      case 'details':
        return <DetailsStep setValidate={setValidateFn} />;
      case 'photos':
        return <PhotosStep setValidate={setValidateFn} />;
      case 'pricing':
        return <PricingStep setValidate={setValidateFn} />;
      case 'review':
        return <ReviewStep onComplete={onComplete} />;
      // Room rental steps
      case 'room_setup':
        return <RoomSetupStep setValidate={setValidateFn} />;
      case 'room_details':
        return <RoomDetailsStep setValidate={setValidateFn} />;
      case 'shared_spaces':
        return <SharedSpacesStep setValidate={setValidateFn} />;
      // Apartment complex steps
      case 'building':
        return <BuildingStructureStep setValidate={setValidateFn} />;
      case 'templates':
        return <UnitTemplatesStep setValidate={setValidateFn} />;
      case 'units':
        return <UnitGeneratorStep setValidate={setValidateFn} />;
      case 'amenities':
        return <ComplexAmenitiesStep setValidate={setValidateFn} />;
      // Commercial steps
      case 'commercial':
        return <CommercialDetailsStep setValidate={setValidateFn} />;
      // Land steps
      case 'land_details':
        return <LandDetailsStep setValidate={setValidateFn} />;
      default:
        return <PropertyTypeSelector />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-indigo-800/95 to-indigo-900/95 backdrop-blur-sm border-b border-indigo-700/50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {state.draftId ? 'Continue Property Listing' : 'Create New Property'}
              </h1>
              <p className="text-sm text-indigo-200 mt-1">
                {state.listingType === 'rent' ? 'For Rent' : 'For Sale'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="text-indigo-200 hover:text-white hover:bg-indigo-700/50"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <WizardProgress />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <div className="bg-gradient-to-r from-indigo-800/40 to-indigo-900/40 rounded-2xl border border-indigo-700/30 p-4 md:p-8 backdrop-blur-sm">
          {renderStep()}
          <WizardNavigation onValidate={validateFn || undefined} />
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="bg-gradient-to-r from-indigo-800 to-indigo-900 border-indigo-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription className="text-indigo-200">
              You have unsaved changes. Would you like to save your progress as a draft before leaving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExitDialog(false)}
              className="border-indigo-600 text-white hover:bg-indigo-700"
            >
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmExit}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PropertyWizard(props: PropertyWizardProps) {
  return (
    <WizardProvider>
      <WizardContent {...props} />
    </WizardProvider>
  );
}

export default PropertyWizard;
