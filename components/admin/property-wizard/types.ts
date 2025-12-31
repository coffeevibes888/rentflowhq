'use client';

// Property types for the wizard
export type PropertyType =
  | 'single_family'
  | 'room_rental'
  | 'apartment_unit'
  | 'apartment_complex'
  | 'commercial'
  | 'condo'
  | 'townhouse'
  | 'multi_family'
  | 'land';

export type ListingType = 'rent' | 'sale';

export type PropertyCategory = 'residential' | 'commercial' | 'land';

// Step configuration
export interface StepConfig {
  id: string;
  title: string;
  description?: string;
}

// Form data structure
export interface PropertyFormData {
  // Basic info
  name: string;
  slug: string;
  description: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  unitNumber?: string;
  
  // Property details
  bedrooms?: number;
  bathrooms?: number;
  sizeSqFt?: number;
  yearBuilt?: number;
  lotSize?: number;
  amenities: string[];
  petPolicy: 'allowed' | 'not_allowed' | 'case_by_case';
  
  // Images
  images: string[];
  imageLabels: string[];
  
  // Pricing (rental)
  rentAmount?: number;
  depositAmount?: number;
  leaseTerm?: number; // months
  availableFrom?: string;
  
  // Pricing (sale)
  salePrice?: number;
  
  // Room rental specific
  totalRooms?: number;
  rooms?: RoomData[];
  sharedSpaces?: SharedSpaceData;
  roommateFriendly?: boolean;
  
  // Apartment complex specific
  totalBuildings?: number;
  floorsPerBuilding?: number;
  unitsPerFloor?: number;
  unitTemplates?: UnitTemplateData[];
  complexAmenities?: string[];
  
  // Commercial specific
  zoningType?: string;
  permittedUses?: string[];
  leaseType?: 'nnn' | 'gross' | 'modified_gross';
  camCharges?: number;
  tenantImprovement?: number;
  electricalCapacity?: string;
  hvacType?: string;
  loadingDock?: boolean;
  parkingSpaces?: number;
  
  // Video/Tour
  videoUrl?: string;
  virtualTourUrl?: string;
}

export interface RoomData {
  id: string;
  name: string;
  sizeSqFt?: number;
  isFurnished: boolean;
  hasPrivateBath: boolean;
  rentAmount?: number;
  images: string[];
  amenities: string[];
}

export interface SharedSpaceData {
  hasKitchen: boolean;
  hasLivingRoom: boolean;
  hasLaundry: boolean;
  hasParking: boolean;
  parkingSpaces?: number;
  additionalSpaces: string[];
}

export interface UnitTemplateData {
  id: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqFt?: number;
  baseRent?: number;
  amenities: string[];
  images: string[];
}

// Wizard state
export interface WizardState {
  currentStep: number;
  totalSteps: number;
  propertyType: PropertyType | null;
  listingType: ListingType;
  formData: Partial<PropertyFormData>;
  isDirty: boolean;
  draftId: string | null;
  validationErrors: Record<string, string[]>;
  completedSteps: Set<number>;
}

// Wizard context value
export interface WizardContextValue {
  state: WizardState;
  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  // Data management
  updateFormData: (data: Partial<PropertyFormData>) => void;
  setPropertyType: (type: PropertyType) => void;
  setListingType: (type: ListingType) => void;
  // Validation
  setValidationErrors: (errors: Record<string, string[]>) => void;
  clearValidationErrors: () => void;
  markStepComplete: (step: number) => void;
  // Draft management
  saveDraft: () => Promise<void>;
  loadDraft: (draftId: string) => Promise<void>;
  deleteDraft: () => Promise<void>;
  // Submission
  submitProperty: () => Promise<{ success: boolean; propertyId?: string; message?: string }>;
  // Reset
  resetWizard: () => void;
}

// Step definitions by property type
export const RENTAL_PROPERTY_TYPES: PropertyType[] = [
  'single_family',
  'room_rental',
  'apartment_unit',
  'apartment_complex',
  'commercial',
];

export const SALE_PROPERTY_TYPES: PropertyType[] = [
  'single_family',
  'condo',
  'townhouse',
  'multi_family',
  'commercial',
  'land',
];

// Property type display info
export const PROPERTY_TYPE_INFO: Record<PropertyType, { label: string; description: string; icon: string }> = {
  single_family: {
    label: 'Single Family Home',
    description: 'A standalone house for one family',
    icon: '🏠',
  },
  room_rental: {
    label: 'Room Rental',
    description: 'Individual rooms within a shared property',
    icon: '🚪',
  },
  apartment_unit: {
    label: 'Apartment / Condo Unit',
    description: 'A single unit in a multi-unit building',
    icon: '🏢',
  },
  apartment_complex: {
    label: 'Apartment Complex',
    description: 'Multiple units in one or more buildings',
    icon: '🏘️',
  },
  commercial: {
    label: 'Commercial Space',
    description: 'Office, retail, or industrial space',
    icon: '🏬',
  },
  condo: {
    label: 'Condo',
    description: 'An individually owned unit in a complex',
    icon: '🏙️',
  },
  townhouse: {
    label: 'Townhouse',
    description: 'A multi-floor home sharing walls with neighbors',
    icon: '🏘️',
  },
  multi_family: {
    label: 'Multi-Family',
    description: 'Duplex, triplex, or fourplex',
    icon: '🏠',
  },
  land: {
    label: 'Land',
    description: 'Vacant land or lot for sale',
    icon: '🌳',
  },
};
