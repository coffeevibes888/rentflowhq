'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bed, Bath, Square, Calendar, Dog, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWizard } from '../wizard-context';

const detailsSchema = z.object({
  bedrooms: z.number().min(0, 'Bedrooms must be 0 or more').max(20),
  bathrooms: z.number().min(0.5, 'At least 0.5 bathrooms required').max(10),
  sizeSqFt: z.number().min(100, 'Size must be at least 100 sq ft').optional().nullable(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()).optional().nullable(),
  lotSize: z.number().min(0).optional().nullable(),
  petPolicy: z.enum(['allowed', 'not_allowed', 'case_by_case']),
  amenities: z.array(z.string()),
});

type DetailsFormData = z.infer<typeof detailsSchema>;

interface DetailsStepProps {
  setValidate: (fn: (() => boolean) | null) => void;
}

const COMMON_AMENITIES = [
  'Air Conditioning', 'Heating', 'Washer/Dryer', 'Dishwasher', 'Parking',
  'Garage', 'Pool', 'Gym', 'Balcony', 'Patio', 'Fireplace', 'Storage',
  'Hardwood Floors', 'Carpet', 'Stainless Steel Appliances', 'Granite Counters',
  'Walk-in Closet', 'High Ceilings', 'Natural Light', 'City View',
];

export function DetailsStep({ setValidate }: DetailsStepProps) {
  const { state, updateFormData } = useWizard();
  const [customAmenity, setCustomAmenity] = useState('');

  const form = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      bedrooms: state.formData.bedrooms ?? 1,
      bathrooms: state.formData.bathrooms ?? 1,
      sizeSqFt: state.formData.sizeSqFt ?? null,
      yearBuilt: state.formData.yearBuilt ?? null,
      lotSize: state.formData.lotSize ?? null,
      petPolicy: state.formData.petPolicy ?? 'case_by_case',
      amenities: state.formData.amenities ?? [],
    },
  });

  const { register, watch, setValue, formState: { errors }, trigger } = form;
  const watchedValues = watch();

  // Update wizard state when form values change
  useEffect(() => {
    updateFormData({
      bedrooms: watchedValues.bedrooms,
      bathrooms: watchedValues.bathrooms,
      sizeSqFt: watchedValues.sizeSqFt ?? undefined,
      yearBuilt: watchedValues.yearBuilt ?? undefined,
      lotSize: watchedValues.lotSize ?? undefined,
      petPolicy: watchedValues.petPolicy,
      amenities: watchedValues.amenities,
    });
  }, [watchedValues, updateFormData]);

  useEffect(() => {
    const validateFn = () => {
      const formState = form.getValues();
      const hasRequiredFields = formState.bedrooms !== undefined && formState.bathrooms !== undefined;
      trigger(); // Trigger async validation for UI feedback
      return hasRequiredFields;
    };
    setValidate(validateFn);
    return () => setValidate(null);
  }, [setValidate, trigger, form]);

  const toggleAmenity = (amenity: string) => {
    const current = watchedValues.amenities || [];
    if (current.includes(amenity)) {
      setValue('amenities', current.filter(a => a !== amenity));
    } else {
      setValue('amenities', [...current, amenity]);
    }
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim() && !watchedValues.amenities?.includes(customAmenity.trim())) {
      setValue('amenities', [...(watchedValues.amenities || []), customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Property Details</h2>
        <p className="text-indigo-200 mt-2">
          Tell us more about the property features
        </p>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label className="text-indigo-100 flex items-center gap-2">
            <Bed className="h-4 w-4 text-violet-400" />
            Bedrooms
          </Label>
          <Input
            type="number"
            min={0}
            max={20}
            className="bg-indigo-800/50 border-indigo-600 text-white"
            {...register('bedrooms', { valueAsNumber: true })}
          />
          {errors.bedrooms && (
            <p className="text-sm text-red-400">{errors.bedrooms.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-indigo-100 flex items-center gap-2">
            <Bath className="h-4 w-4 text-violet-400" />
            Bathrooms
          </Label>
          <Input
            type="number"
            min={0.5}
            max={10}
            step={0.5}
            className="bg-indigo-800/50 border-indigo-600 text-white"
            {...register('bathrooms', { valueAsNumber: true })}
          />
          {errors.bathrooms && (
            <p className="text-sm text-red-400">{errors.bathrooms.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-indigo-100 flex items-center gap-2">
            <Square className="h-4 w-4 text-violet-400" />
            Size (sq ft)
          </Label>
          <Input
            type="number"
            min={100}
            placeholder="Optional"
            className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400"
            {...register('sizeSqFt', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-indigo-100 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-400" />
            Year Built
          </Label>
          <Input
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            placeholder="Optional"
            className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400"
            {...register('yearBuilt', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Pet Policy */}
      <div className="space-y-3">
        <Label className="text-indigo-100 flex items-center gap-2">
          <Dog className="h-4 w-4 text-violet-400" />
          Pet Policy
        </Label>
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'allowed', label: 'Pets Allowed', icon: '🐾' },
            { value: 'not_allowed', label: 'No Pets', icon: '🚫' },
            { value: 'case_by_case', label: 'Case by Case', icon: '🤔' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue('petPolicy', option.value as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all',
                watchedValues.petPolicy === option.value
                  ? 'border-violet-500 bg-violet-500/20 text-white'
                  : 'border-indigo-600/50 bg-indigo-800/30 text-indigo-200 hover:border-indigo-500'
              )}
            >
              <span>{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <Label className="text-indigo-100">Amenities</Label>
        
        {/* Selected amenities */}
        {watchedValues.amenities && watchedValues.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-indigo-800/30 rounded-xl border border-indigo-600/50">
            {watchedValues.amenities.map((amenity) => (
              <Badge
                key={amenity}
                variant="secondary"
                className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className="ml-2 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Common amenities grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {COMMON_AMENITIES.map((amenity) => {
            const isSelected = watchedValues.amenities?.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm transition-all text-left',
                  isSelected
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'bg-indigo-800/30 text-indigo-300 border border-indigo-600/50 hover:border-indigo-500 hover:text-indigo-200'
                )}
              >
                {amenity}
              </button>
            );
          })}
        </div>

        {/* Custom amenity input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add custom amenity..."
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
            className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400"
          />
          <Button
            type="button"
            variant="outline"
            onClick={addCustomAmenity}
            className="border-indigo-600 text-white hover:bg-indigo-700/50"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
