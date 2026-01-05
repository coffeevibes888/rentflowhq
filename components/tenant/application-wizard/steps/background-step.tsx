'use client';

import { useEffect, useState } from 'react';
import { Shield, Users, Car, UserPlus, PawPrint, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApplicationWizard } from '../wizard-context';

interface BackgroundStepProps {
  setValidate: (fn: (() => boolean) | null) => void;
}

export function BackgroundStep({ setValidate }: BackgroundStepProps) {
  const { state, updateFormData } = useApplicationWizard();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValidate(() => {
      const newErrors: Record<string, string> = {};
      
      if (!state.formData.hasBeenEvicted) {
        newErrors.hasBeenEvicted = 'Please answer this question';
      }
      if (!state.formData.hasBrokenLease) {
        newErrors.hasBrokenLease = 'Please answer this question';
      }
      if (!state.formData.hasConvictions) {
        newErrors.hasConvictions = 'Please answer this question';
      }
      if (state.formData.hasConvictions === 'yes' && !state.formData.convictionExplanation?.trim()) {
        newErrors.convictionExplanation = 'Please provide an explanation';
      }
      if (!state.formData.hasPets) {
        newErrors.hasPets = 'Please answer this question';
      }
      if (!state.formData.numberOfOccupants?.trim()) {
        newErrors.numberOfOccupants = 'Number of occupants is required';
      }
      if (!state.formData.emergencyContactName?.trim()) {
        newErrors.emergencyContactName = 'Emergency contact is required';
      }
      if (!state.formData.emergencyContactPhone?.trim()) {
        newErrors.emergencyContactPhone = 'Emergency contact phone is required';
      }
      if (!state.formData.desiredMoveInDate) {
        newErrors.desiredMoveInDate = 'Move-in date is required';
      }
      if (!state.formData.desiredLeaseTerm) {
        newErrors.desiredLeaseTerm = 'Lease term is required';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    });
    return () => setValidate(null);
  }, [setValidate, state.formData]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/20 mb-4">
          <Shield className="h-8 w-8 text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Background & Details</h2>
        <p className="text-slate-300 mt-2">
          A few more questions to complete your application
        </p>
      </div>

      {/* Background Questions */}
      <div className="space-y-4 p-5 rounded-xl bg-slate-800/30 border border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-violet-400" />
          Background Questions
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Have you ever been evicted? *</Label>
            <Select
              value={state.formData.hasBeenEvicted || ''}
              onValueChange={(value) => updateFormData({ hasBeenEvicted: value })}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-12">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
            {errors.hasBeenEvicted && (
              <p className="text-sm text-red-400">{errors.hasBeenEvicted}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Have you ever broken a lease? *</Label>
            <Select
              value={state.formData.hasBrokenLease || ''}
              onValueChange={(value) => updateFormData({ hasBrokenLease: value })}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-12">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
            {errors.hasBrokenLease && (
              <p className="text-sm text-red-400">{errors.hasBrokenLease}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Have you ever been convicted of a felony? *</Label>
            <Select
              value={state.formData.hasConvictions || ''}
              onValueChange={(value) => updateFormData({ hasConvictions: value })}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-12">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
            {errors.hasConvictions && (
              <p className="text-sm text-red-400">{errors.hasConvictions}</p>
            )}
          </div>

          {state.formData.hasConvictions === 'yes' && (
            <div className="space-y-2">
              <Label className="text-slate-200">Please explain *</Label>
              <Textarea
                value={state.formData.convictionExplanation || ''}
                onChange={(e) => updateFormData({ convictionExplanation: e.target.value })}
                placeholder="Provide details about the conviction"
                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[80px]"
              />
              {errors.convictionExplanation && (
                <p className="text-sm text-red-400">{errors.convictionExplanation}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pets */}
      <div className="space-y-4 p-5 rounded-xl bg-slate-800/30 border border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-violet-400" />
          Pets
        </h3>

        <div className="space-y-2">
          <Label className="text-slate-200">Do you have any pets? *</Label>
          <Select
            value={state.formData.hasPets || ''}
            onValueChange={(value) => updateFormData({ hasPets: value })}
          >
            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-12">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
            </SelectContent>
          </Select>
          {errors.hasPets && (
            <p className="text-sm text-red-400">{errors.hasPets}</p>
          )}
        </div>

        {state.formData.hasPets === 'yes' && (
          <div className="space-y-2">
            <Label className="text-slate-200">Pet Details</Label>
            <Textarea
              value={state.formData.petDetails || ''}
              onChange={(e) => updateFormData({ petDetails: e.target.value })}
              placeholder="Type, breed, weight, number of pets"
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[80px]"
            />
            <p className="text-xs text-amber-400">Note: Pet-friendly units may include an additional pet deposit.</p>
          </div>
        )}
      </div>

      {/* Occupants & Vehicles */}
      <div className="space-y-4 p-5 rounded-xl bg-slate-800/30 border border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-400" />
          Occupants & Vehicles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Number of Occupants *</Label>
            <Input
              value={state.formData.numberOfOccupants || ''}
              onChange={(e) => updateFormData({ numberOfOccupants: e.target.value })}
              placeholder="Including yourself"
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 h-12"
            />
            {errors.numberOfOccupants && (
              <p className="text-sm text-red-400">{errors.numberOfOccupants}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Number of Vehicles</Label>
            <Input
              value={state.formData.numberOfVehicles || ''}
              onChange={(e) => updateFormData({ numberOfVehicles: e.target.value })}
              placeholder="0"
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-200">Names of All Occupants</Label>
          <Textarea
            value={state.formData.occupantNames || ''}
            onChange={(e) => updateFormData({ occupantNames: e.target.value })}
            placeholder="List all people who will live in the unit"
            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[60px]"
          />
        </div>

        {state.formData.numberOfVehicles && parseInt(state.formData.numberOfVehicles) > 0 && (
          <div className="space-y-2">
            <Label className="text-slate-200">Vehicle Details</Label>
            <Textarea
              value={state.formData.vehicleDetails || ''}
              onChange={(e) => updateFormData({ vehicleDetails: e.target.value })}
              placeholder="Make, model, year, license plate for each vehicle"
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[60px]"
            />
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4 p-5 rounded-xl bg-slate-800/30 border border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-violet-400" />
          Emergency Contact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Name *</Label>
            <Input
              value={state.formData.emergencyContactName || ''}
              onChange={(e) => updateFormData({ emergencyContactName: e.target.value })}
              placeholder="Contact name"
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 h-12"
            />
            {errors.emergencyContactName && (
              <p className="text-sm text-red-400">{errors.emergencyContactName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Phone *</Label>
            <Input
              value={state.formData.emergencyContactPhone || ''}
              onChange={(e) => updateFormData({ emergencyContactPhone: e.target.value })}
              placeholder="(555) 123-4567"
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 h-12"
            />
            {errors.emergencyContactPhone && (
              <p className="text-sm text-red-400">{errors.emergencyContactPhone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Relationship</Label>
            <Input
              value={state.formData.emergencyContactRelation || ''}
              onChange={(e) => updateFormData({ emergencyContactRelation: e.target.value })}
              placeholder="e.g., Parent, Spouse"
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 h-12"
            />
          </div>
        </div>
      </div>

      {/* Move-in Details */}
      <div className="space-y-4 p-5 rounded-xl bg-slate-800/30 border border-slate-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-violet-400" />
          Move-in Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Desired Move-in Date *</Label>
            <Input
              type="date"
              value={state.formData.desiredMoveInDate || ''}
              onChange={(e) => updateFormData({ desiredMoveInDate: e.target.value })}
              className="bg-slate-800/50 border-slate-600 text-white h-12"
            />
            {errors.desiredMoveInDate && (
              <p className="text-sm text-red-400">{errors.desiredMoveInDate}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Desired Lease Term *</Label>
            <Select
              value={state.formData.desiredLeaseTerm || ''}
              onValueChange={(value) => updateFormData({ desiredLeaseTerm: value })}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-12">
                <SelectValue placeholder="Select lease term" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
                <SelectItem value="18">18 Months</SelectItem>
                <SelectItem value="24">24 Months</SelectItem>
                <SelectItem value="month-to-month">Month-to-Month</SelectItem>
              </SelectContent>
            </Select>
            {errors.desiredLeaseTerm && (
              <p className="text-sm text-red-400">{errors.desiredLeaseTerm}</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label className="text-slate-200">Additional Notes (Optional)</Label>
        <Textarea
          value={state.formData.additionalNotes || ''}
          onChange={(e) => updateFormData({ additionalNotes: e.target.value })}
          placeholder="Anything else you'd like the landlord to know?"
          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
        />
      </div>
    </div>
  );
}
