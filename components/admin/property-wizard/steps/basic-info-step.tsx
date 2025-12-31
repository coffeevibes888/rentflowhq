'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import slugify from 'slugify';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useWizard } from '../wizard-context';
import { ZillowPropertyLookup } from '../../zillow-property-lookup';

const basicInfoSchema = z.object({
  name: z.string().min(3, 'Min 3 characters'),
  slug: z.string().min(3, 'Min 3 characters').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  streetAddress: z.string().min(5, 'Enter a valid address'),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  zipCode: z.string().min(5, 'Enter a valid ZIP'),
  unitNumber: z.string().optional(),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

interface BasicInfoStepProps {
  setValidate: (fn: (() => boolean) | null) => void;
}

export function BasicInfoStep({ setValidate }: BasicInfoStepProps) {
  const { state, updateFormData } = useWizard();
  const isInitialMount = useRef(true);

  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: state.formData.name || '',
      slug: state.formData.slug || '',
      description: state.formData.description || '',
      streetAddress: state.formData.streetAddress || '',
      city: state.formData.city || '',
      state: state.formData.state || '',
      zipCode: state.formData.zipCode || '',
      unitNumber: state.formData.unitNumber || '',
    },
  });

  const { register, watch, setValue, getValues } = form;

  // Watch individual fields to avoid infinite loop
  const name = watch('name');
  const slug = watch('slug');
  const description = watch('description');
  const streetAddress = watch('streetAddress');
  const city = watch('city');
  const stateValue = watch('state');
  const zipCode = watch('zipCode');
  const unitNumber = watch('unitNumber');

  // Update wizard state when values change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateFormData({ name, slug, description, streetAddress, city, state: stateValue, zipCode, unitNumber });
  }, [name, slug, description, streetAddress, city, stateValue, zipCode, unitNumber, updateFormData]);

  // Set validation function
  useEffect(() => {
    const validateFn = (): boolean => {
      const values = getValues();
      return !!(values.name && values.streetAddress && values.city && values.state && values.zipCode);
    };
    setValidate(validateFn);
    return () => setValidate(null);
  }, [setValidate, getValues]);

  // Generate slug from name
  const generateSlug = () => {
    const name = watch('name');
    if (name) {
      const sanitized = name.replace(/[^a-zA-Z0-9\s-]/g, '');
      setValue('slug', slugify(sanitized, { lower: true, strict: true }));
    }
  };

  // Handle Zillow property data auto-fill
  const handleZillowPropertyFound = (data: {
    address: { street: string; city: string; state: string; zipCode: string };
    bedrooms: number;
    bathrooms: number;
    sizeSqFt: number;
    yearBuilt: number;
    propertyType: string;
    description: string;
    images: string[];
    zestimate: number;
    rentZestimate: number;
    zpid: string;
  }) => {
    setValue('streetAddress', data.address.street);
    setValue('city', data.address.city);
    setValue('state', data.address.state);
    setValue('zipCode', data.address.zipCode);
    
    if (data.description && !watch('description')) {
      setValue('description', data.description);
    }

    // Generate slug from address
    const slugBase = data.address.street.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    setValue('slug', slugify(slugBase, { lower: true, strict: true }));

    // Update wizard state with additional Zillow data
    updateFormData({
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sizeSqFt: data.sizeSqFt,
      yearBuilt: data.yearBuilt,
      images: data.images?.slice(0, 5) || [],
      imageLabels: data.images?.slice(0, 5).map((_, i) => i === 0 ? 'Exterior' : `Photo ${i + 1}`) || [],
      rentAmount: data.rentZestimate || undefined,
      salePrice: data.zestimate || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Basic Information</h2>
        <p className="text-indigo-200 mt-2">
          Enter the property address and basic details
        </p>
      </div>

      {/* Zillow Auto-Fill */}
      <div className="mb-8">
        <ZillowPropertyLookup
          onPropertyFound={handleZillowPropertyFound}
          disabled={false}
          isPro={true}
        />
      </div>

      <div className="grid gap-6">
        {/* Property Name & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-indigo-100">
              Property Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Sunset View Apartments"
              className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400"
              {...register('name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-indigo-100">
              URL Slug <span className="text-red-400">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                placeholder="sunset-view-apartments"
                className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400"
                {...register('slug')}
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateSlug}
                className="border-indigo-600 text-white hover:bg-indigo-700/50 shrink-0"
              >
                Generate
              </Button>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="streetAddress" className="text-indigo-100">
            Street Address <span className="text-red-400">*</span>
          </Label>
          <Input
            id="streetAddress"
            placeholder="123 Main Street"
            className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400"
            {...register('streetAddress')}
          />
        </div>

        {/* City, State, ZIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2 col-span-2 md:col-span-2">
            <Label htmlFor="city" className="text-indigo-100">
              City <span className="text-red-400">*</span>
            </Label>
            <Input
              id="city"
              placeholder="Las Vegas"
              className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400"
              {...register('city')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" className="text-indigo-100">
              State <span className="text-red-400">*</span>
            </Label>
            <Input
              id="state"
              placeholder="NV"
              className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400"
              {...register('state')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode" className="text-indigo-100">
              ZIP Code <span className="text-red-400">*</span>
            </Label>
            <Input
              id="zipCode"
              placeholder="89101"
              className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400"
              {...register('zipCode')}
            />
          </div>
        </div>

        {/* Unit Number (optional) */}
        <div className="space-y-2">
          <Label htmlFor="unitNumber" className="text-indigo-100">
            Unit / Apt Number <span className="text-indigo-400">(optional)</span>
          </Label>
          <Input
            id="unitNumber"
            placeholder="e.g., Apt 4B"
            className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400 max-w-xs"
            {...register('unitNumber')}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-indigo-100">
            Description <span className="text-indigo-400">(optional)</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe the property, neighborhood, and any special features..."
            className="bg-indigo-800/50 border-indigo-600 text-white placeholder:text-indigo-400 min-h-[120px]"
            {...register('description')}
          />
        </div>
      </div>
    </div>
  );
}
