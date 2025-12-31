'use client';

import { Home, DoorOpen, Building2, Building, Warehouse, TreePine, Castle, Hotel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from '../wizard-context';
import {
  PropertyType,
  ListingType,
  RENTAL_PROPERTY_TYPES,
  SALE_PROPERTY_TYPES,
  PROPERTY_TYPE_INFO,
} from '../types';

const PROPERTY_TYPE_ICONS: Record<PropertyType, React.ElementType> = {
  single_family: Home,
  room_rental: DoorOpen,
  apartment_unit: Building2,
  apartment_complex: Hotel,
  commercial: Warehouse,
  condo: Building,
  townhouse: Castle,
  multi_family: Building2,
  land: TreePine,
};

export function PropertyTypeSelector() {
  const { state, setPropertyType, setListingType } = useWizard();

  const propertyTypes = state.listingType === 'rent' ? RENTAL_PROPERTY_TYPES : SALE_PROPERTY_TYPES;

  return (
    <div className="space-y-8">
      {/* Listing Type Toggle */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          What type of property are you listing?
        </h2>
        <p className="text-indigo-200">
          Select whether you're listing a property for rent or sale
        </p>

        <div className="inline-flex rounded-xl bg-indigo-800/50 p-1.5">
          <button
            onClick={() => setListingType('rent')}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
              state.listingType === 'rent'
                ? 'bg-violet-600 text-white shadow-lg'
                : 'text-indigo-300 hover:text-white'
            )}
          >
            For Rent
          </button>
          <button
            onClick={() => setListingType('sale')}
            className={cn(
              'px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
              state.listingType === 'sale'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-indigo-300 hover:text-white'
            )}
          >
            For Sale
          </button>
        </div>
      </div>

      {/* Property Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {propertyTypes.map((type) => {
          const info = PROPERTY_TYPE_INFO[type];
          const Icon = PROPERTY_TYPE_ICONS[type];
          const isSelected = state.propertyType === type;

          return (
            <button
              key={type}
              onClick={() => setPropertyType(type)}
              className={cn(
                'group relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-xl',
                isSelected
                  ? 'border-violet-500 bg-gradient-to-br from-violet-600/30 to-indigo-600/30 shadow-lg shadow-violet-500/20'
                  : 'border-indigo-600/50 bg-indigo-800/30 hover:border-indigo-500 hover:bg-indigo-800/50'
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors',
                  isSelected
                    ? 'bg-violet-500/30'
                    : 'bg-indigo-700/50 group-hover:bg-indigo-700'
                )}
              >
                <Icon
                  className={cn(
                    'w-8 h-8 transition-colors',
                    isSelected ? 'text-violet-400' : 'text-indigo-300 group-hover:text-indigo-200'
                  )}
                />
              </div>

              {/* Label */}
              <h3
                className={cn(
                  'text-sm md:text-base font-semibold text-center mb-1 transition-colors',
                  isSelected ? 'text-white' : 'text-indigo-100'
                )}
              >
                {info.label}
              </h3>

              {/* Description - hidden on mobile */}
              <p className="hidden md:block text-xs text-indigo-300 text-center">
                {info.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Enterprise hint for apartment complex */}
      {state.propertyType === 'apartment_complex' && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-200">Enterprise Features Available</h4>
              <p className="text-sm text-indigo-300 mt-1">
                Apartment complex management includes bulk unit creation, CSV import, and unit templates.
                Some features may require an enterprise subscription.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected type summary */}
      {state.propertyType && (
        <div className="text-center text-indigo-300 text-sm">
          You selected:{' '}
          <span className="text-white font-medium">
            {PROPERTY_TYPE_INFO[state.propertyType].label}
          </span>{' '}
          for{' '}
          <span className={state.listingType === 'rent' ? 'text-violet-400' : 'text-emerald-400'}>
            {state.listingType === 'rent' ? 'Rent' : 'Sale'}
          </span>
        </div>
      )}
    </div>
  );
}
