'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  WizardState,
  WizardContextValue,
  PropertyType,
  ListingType,
  PropertyFormData,
  StepConfig,
} from './types';

// Step configurations by property type
const SINGLE_PROPERTY_STEPS: StepConfig[] = [
  { id: 'type', title: 'Property Type', description: 'Select your property type' },
  { id: 'basic', title: 'Basic Info', description: 'Address and property name' },
  { id: 'details', title: 'Details', description: 'Bedrooms, bathrooms, amenities' },
  { id: 'photos', title: 'Photos', description: 'Upload property images' },
  { id: 'pricing', title: 'Pricing', description: 'Rent, deposit, and terms' },
  { id: 'review', title: 'Review', description: 'Review and submit' },
];

const ROOM_RENTAL_STEPS: StepConfig[] = [
  { id: 'type', title: 'Property Type', description: 'Select your property type' },
  { id: 'basic', title: 'Property Info', description: 'Address and property name' },
  { id: 'room_setup', title: 'Room Setup', description: 'Number of rooms available' },
  { id: 'room_details', title: 'Room Details', description: 'Details for each room' },
  { id: 'shared_spaces', title: 'Shared Spaces', description: 'Common areas and amenities' },
  { id: 'photos', title: 'Photos', description: 'Upload property images' },
  { id: 'pricing', title: 'Pricing', description: 'Room pricing and terms' },
  { id: 'review', title: 'Review', description: 'Review and submit' },
];

const APARTMENT_COMPLEX_STEPS: StepConfig[] = [
  { id: 'type', title: 'Property Type', description: 'Select your property type' },
  { id: 'basic', title: 'Complex Info', description: 'Address and complex name' },
  { id: 'building', title: 'Building Structure', description: 'Buildings, floors, and units' },
  { id: 'templates', title: 'Unit Templates', description: 'Define unit types' },
  { id: 'units', title: 'Generate Units', description: 'Create units from templates' },
  { id: 'amenities', title: 'Complex Amenities', description: 'Pool, gym, parking, etc.' },
  { id: 'photos', title: 'Photos', description: 'Upload property images' },
  { id: 'review', title: 'Review', description: 'Review and submit' },
];

const COMMERCIAL_STEPS: StepConfig[] = [
  { id: 'type', title: 'Property Type', description: 'Select your property type' },
  { id: 'basic', title: 'Basic Info', description: 'Address and property name' },
  { id: 'commercial', title: 'Commercial Details', description: 'Zoning, lease type, utilities' },
  { id: 'photos', title: 'Photos', description: 'Upload property images' },
  { id: 'pricing', title: 'Pricing', description: 'Lease terms and pricing' },
  { id: 'review', title: 'Review', description: 'Review and submit' },
];

const LAND_STEPS: StepConfig[] = [
  { id: 'type', title: 'Property Type', description: 'Select your property type' },
  { id: 'basic', title: 'Basic Info', description: 'Address and lot details' },
  { id: 'land_details', title: 'Land Details', description: 'Zoning, utilities, access' },
  { id: 'photos', title: 'Photos', description: 'Upload property images' },
  { id: 'pricing', title: 'Pricing', description: 'Sale price' },
  { id: 'review', title: 'Review', description: 'Review and submit' },
];

export function getStepsForPropertyType(propertyType: PropertyType | null): StepConfig[] {
  if (!propertyType) {
    return [{ id: 'type', title: 'Property Type', description: 'Select your property type' }];
  }

  switch (propertyType) {
    case 'room_rental':
      return ROOM_RENTAL_STEPS;
    case 'apartment_complex':
      return APARTMENT_COMPLEX_STEPS;
    case 'commercial':
      return COMMERCIAL_STEPS;
    case 'land':
      return LAND_STEPS;
    default:
      return SINGLE_PROPERTY_STEPS;
  }
}

const initialFormData: Partial<PropertyFormData> = {
  name: '',
  slug: '',
  description: '',
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  amenities: [],
  petPolicy: 'case_by_case',
  images: [],
  imageLabels: [],
};

const initialState: WizardState = {
  currentStep: 0,
  totalSteps: 1,
  propertyType: null,
  listingType: 'rent',
  formData: initialFormData,
  isDirty: false,
  draftId: null,
  validationErrors: {},
  completedSteps: new Set(),
};

export function useWizardState(): WizardContextValue {
  const [state, setState] = useState<WizardState>(initialState);

  // Get current steps based on property type
  const steps = useMemo(() => getStepsForPropertyType(state.propertyType), [state.propertyType]);

  // Navigation
  const goToStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, Math.min(step, steps.length - 1)),
    }));
  }, [steps.length]);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const newStep = Math.min(prev.currentStep + 1, steps.length - 1);
      const newCompletedSteps = new Set(prev.completedSteps);
      newCompletedSteps.add(prev.currentStep);
      return {
        ...prev,
        currentStep: newStep,
        completedSteps: newCompletedSteps,
      };
    });
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  // Data management
  const updateFormData = useCallback((data: Partial<PropertyFormData>) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...data },
      isDirty: true,
    }));
  }, []);

  const setPropertyType = useCallback((type: PropertyType) => {
    setState((prev) => {
      const newSteps = getStepsForPropertyType(type);
      return {
        ...prev,
        propertyType: type,
        totalSteps: newSteps.length,
        isDirty: true,
      };
    });
  }, []);

  const setListingType = useCallback((type: ListingType) => {
    setState((prev) => ({
      ...prev,
      listingType: type,
      isDirty: true,
    }));
  }, []);

  // Validation
  const setValidationErrors = useCallback((errors: Record<string, string[]>) => {
    setState((prev) => ({
      ...prev,
      validationErrors: errors,
    }));
  }, []);

  const clearValidationErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      validationErrors: {},
    }));
  }, []);

  const markStepComplete = useCallback((step: number) => {
    setState((prev) => {
      const newCompletedSteps = new Set(prev.completedSteps);
      newCompletedSteps.add(step);
      return {
        ...prev,
        completedSteps: newCompletedSteps,
      };
    });
  }, []);

  // Draft management
  const saveDraft = useCallback(async () => {
    try {
      const response = await fetch('/api/properties/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: state.propertyType,
          listingType: state.listingType,
          formData: state.formData,
          currentStep: state.currentStep,
          draftId: state.draftId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          draftId: data.draftId,
          isDirty: false,
        }));
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [state.propertyType, state.listingType, state.formData, state.currentStep, state.draftId]);

  const loadDraft = useCallback(async (draftId: string) => {
    try {
      const response = await fetch(`/api/properties/draft/${draftId}`);
      if (response.ok) {
        const data = await response.json();
        const newSteps = getStepsForPropertyType(data.propertyType);
        setState({
          currentStep: data.currentStep || 0,
          totalSteps: newSteps.length,
          propertyType: data.propertyType,
          listingType: data.listingType || 'rent',
          formData: data.formData || initialFormData,
          isDirty: false,
          draftId: draftId,
          validationErrors: {},
          completedSteps: new Set(data.completedSteps || []),
        });
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);

  const deleteDraft = useCallback(async () => {
    if (!state.draftId) return;

    try {
      await fetch(`/api/properties/draft/${state.draftId}`, {
        method: 'DELETE',
      });
      setState((prev) => ({
        ...prev,
        draftId: null,
      }));
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }, [state.draftId]);

  // Submission
  const submitProperty = useCallback(async () => {
    try {
      console.log('Submitting property:', {
        propertyType: state.propertyType,
        listingType: state.listingType,
        formData: state.formData,
      });
      
      const response = await fetch('/api/properties/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: state.propertyType,
          listingType: state.listingType,
          formData: state.formData,
          draftId: state.draftId,
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        // Delete draft after successful submission
        if (state.draftId) {
          await deleteDraft();
        }
        return { success: true, propertyId: data.propertyId, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to create property' };
      }
    } catch (error) {
      console.error('Failed to submit property:', error);
      return { success: false, message: 'An error occurred while creating the property' };
    }
  }, [state.propertyType, state.listingType, state.formData, state.draftId, deleteDraft]);

  // Reset
  const resetWizard = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state: {
      ...state,
      totalSteps: steps.length,
    },
    goToStep,
    nextStep,
    prevStep,
    updateFormData,
    setPropertyType,
    setListingType,
    setValidationErrors,
    clearValidationErrors,
    markStepComplete,
    saveDraft,
    loadDraft,
    deleteDraft,
    submitProperty,
    resetWizard,
  };
}
