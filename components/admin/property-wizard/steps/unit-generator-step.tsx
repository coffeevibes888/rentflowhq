'use client';

import { useEffect, useState, useRef } from 'react';
import { Building2, Layers, DoorOpen, Sparkles, FileSpreadsheet, AlertTriangle, DollarSign, Bed, Bath, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useWizard } from '../wizard-context';
import { useToast } from '@/hooks/use-toast';

interface UnitGeneratorStepProps {
  setValidate: (fn: (() => boolean) | null) => void;
}

interface GeneratedUnit {
  building: string;
  floor: number;
  unitNumber: string;
  templateId: string;
  templateName: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
}

interface FloorPlanDistribution {
  templateId: string;
  count: number;
}

export function UnitGeneratorStep({ setValidate }: UnitGeneratorStepProps) {
  const { state, updateFormData } = useWizard();
  const { toast } = useToast();
  const [generatedUnits, setGeneratedUnits] = useState<GeneratedUnit[]>([]);
  const [namingPattern, setNamingPattern] = useState<'sequential' | 'floor_unit'>('floor_unit');
  const [generationMode, setGenerationMode] = useState<'single' | 'distribution'>('distribution');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [distribution, setDistribution] = useState<FloorPlanDistribution[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isInitialMount = useRef(true);

  const { totalBuildings = 1, floorsPerBuilding = 1, unitsPerFloor = 1, unitTemplates = [] } = state.formData;

  const totalUnits = totalBuildings * floorsPerBuilding * unitsPerFloor;

  // Initialize distribution when templates change
  useEffect(() => {
    if (isInitialMount.current && unitTemplates.length > 0) {
      isInitialMount.current = false;
      // Auto-distribute evenly across templates
      const perTemplate = Math.floor(totalUnits / unitTemplates.length);
      const remainder = totalUnits % unitTemplates.length;
      const initialDistribution = unitTemplates.map((t, i) => ({
        templateId: t.id,
        count: perTemplate + (i < remainder ? 1 : 0),
      }));
      setDistribution(initialDistribution);
    }
  }, [unitTemplates, totalUnits]);

  // Set validation function
  useEffect(() => {
    const validateFn = (): boolean => {
      return true; // Allow progression even without generating units
    };
    setValidate(validateFn);
    return () => setValidate(null);
  }, [setValidate]);

  const distributionTotal = distribution.reduce((sum, d) => sum + d.count, 0);
  const distributionValid = distributionTotal === totalUnits;

  const updateDistribution = (templateId: string, count: number) => {
    setDistribution(prev => 
      prev.map(d => d.templateId === templateId ? { ...d, count: Math.max(0, count) } : d)
    );
  };

  const autoDistribute = () => {
    const perTemplate = Math.floor(totalUnits / unitTemplates.length);
    const remainder = totalUnits % unitTemplates.length;
    setDistribution(unitTemplates.map((t, i) => ({
      templateId: t.id,
      count: perTemplate + (i < remainder ? 1 : 0),
    })));
  };

  const generateUnits = () => {
    if (generationMode === 'single') {
      if (!selectedTemplate) {
        toast({ variant: 'destructive', title: 'Select a floor plan', description: 'Please select a floor plan first' });
        return;
      }
      const template = unitTemplates.find(t => t.id === selectedTemplate);
      if (!template) return;

      const units: GeneratedUnit[] = [];
      let unitCounter = 1;

      for (let b = 0; b < totalBuildings; b++) {
        const buildingLetter = String.fromCharCode(65 + b);
        for (let f = 1; f <= floorsPerBuilding; f++) {
          for (let u = 1; u <= unitsPerFloor; u++) {
            const unitNumber = namingPattern === 'floor_unit'
              ? `${f}${String(u).padStart(2, '0')}`
              : String(unitCounter++).padStart(3, '0');

            units.push({
              building: totalBuildings > 1 ? buildingLetter : '',
              floor: f,
              unitNumber,
              templateId: template.id,
              templateName: template.name,
              rent: template.baseRent || 0,
              bedrooms: template.bedrooms,
              bathrooms: template.bathrooms,
            });
          }
        }
      }
      setGeneratedUnits(units);
      toast({ title: 'Units generated', description: `${units.length} units created using ${template.name}` });
    } else {
      // Distribution mode
      if (!distributionValid) {
        toast({ variant: 'destructive', title: 'Invalid distribution', description: `Distribution total (${distributionTotal}) must equal total units (${totalUnits})` });
        return;
      }

      const units: GeneratedUnit[] = [];
      let unitCounter = 1;
      
      // Create a pool of templates based on distribution
      const templatePool: string[] = [];
      distribution.forEach(d => {
        for (let i = 0; i < d.count; i++) {
          templatePool.push(d.templateId);
        }
      });

      // Shuffle for variety (optional - can be removed for sequential assignment)
      for (let i = templatePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [templatePool[i], templatePool[j]] = [templatePool[j], templatePool[i]];
      }

      let poolIndex = 0;
      for (let b = 0; b < totalBuildings; b++) {
        const buildingLetter = String.fromCharCode(65 + b);
        for (let f = 1; f <= floorsPerBuilding; f++) {
          for (let u = 1; u <= unitsPerFloor; u++) {
            const templateId = templatePool[poolIndex++];
            const template = unitTemplates.find(t => t.id === templateId);
            if (!template) continue;

            const unitNumber = namingPattern === 'floor_unit'
              ? `${f}${String(u).padStart(2, '0')}`
              : String(unitCounter++).padStart(3, '0');

            units.push({
              building: totalBuildings > 1 ? buildingLetter : '',
              floor: f,
              unitNumber,
              templateId: template.id,
              templateName: template.name,
              rent: template.baseRent || 0,
              bedrooms: template.bedrooms,
              bathrooms: template.bathrooms,
            });
          }
        }
      }
      setGeneratedUnits(units);
      
      const totalRent = units.reduce((sum, u) => sum + u.rent, 0);
      toast({ 
        title: 'Units generated', 
        description: `${units.length} units created. Est. monthly revenue: $${totalRent.toLocaleString()}` 
      });
    }
  };

  const getUnitDisplayName = (unit: GeneratedUnit) => {
    if (unit.building) {
      return `${unit.building}-${unit.unitNumber}`;
    }
    return unit.unitNumber;
  };

  const totalEstimatedRent = generatedUnits.reduce((sum, u) => sum + u.rent, 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Generate Units</h2>
        <p className="text-indigo-200 mt-2">
          Assign floor plans and pricing to your units
        </p>
      </div>

      {/* Structure Summary */}
      <div className="bg-gradient-to-r from-indigo-700/30 to-indigo-900/30 rounded-xl p-4 border border-indigo-500/30">
        <h3 className="font-medium text-white mb-3">Building Structure</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-2 text-indigo-300 mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Buildings</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalBuildings}</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 text-indigo-300 mb-1">
              <Layers className="h-4 w-4" />
              <span className="text-sm">Floors</span>
            </div>
            <p className="text-2xl font-bold text-white">{floorsPerBuilding}</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 text-indigo-300 mb-1">
              <DoorOpen className="h-4 w-4" />
              <span className="text-sm">Units/Floor</span>
            </div>
            <p className="text-2xl font-bold text-white">{unitsPerFloor}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-indigo-600/50 text-center">
          <p className="text-indigo-300">Total Units to Generate</p>
          <p className="text-3xl font-bold text-indigo-300">{totalUnits}</p>
        </div>
      </div>

      {/* Generation Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={generationMode === 'distribution' ? 'default' : 'outline'}
          onClick={() => setGenerationMode('distribution')}
          className={generationMode === 'distribution' 
            ? 'bg-indigo-600 hover:bg-indigo-700 flex-1' 
            : 'border-indigo-600 text-indigo-200 hover:bg-indigo-800 flex-1'}
        >
          Mix Floor Plans
        </Button>
        <Button
          variant={generationMode === 'single' ? 'default' : 'outline'}
          onClick={() => setGenerationMode('single')}
          className={generationMode === 'single' 
            ? 'bg-indigo-600 hover:bg-indigo-700 flex-1' 
            : 'border-indigo-600 text-indigo-200 hover:bg-indigo-800 flex-1'}
        >
          Single Floor Plan
        </Button>
      </div>

      {/* Distribution Mode */}
      {generationMode === 'distribution' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-indigo-100">Floor Plan Distribution</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={autoDistribute}
              className="text-indigo-300 hover:text-white hover:bg-indigo-700/50"
            >
              Auto-distribute
            </Button>
          </div>
          
          <div className="space-y-3">
            {unitTemplates.map((template) => {
              const dist = distribution.find(d => d.templateId === template.id);
              const count = dist?.count || 0;
              return (
                <div 
                  key={template.id}
                  className="bg-indigo-800/30 rounded-lg p-3 border border-indigo-600/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{template.name}</p>
                      <div className="flex items-center gap-3 text-xs text-indigo-300">
                        <span className="flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          {template.bedrooms === 0 ? 'Studio' : `${template.bedrooms}BR`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="h-3 w-3" />
                          {template.bathrooms}BA
                        </span>
                        {template.baseRent && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <DollarSign className="h-3 w-3" />
                            {template.baseRent}/mo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateDistribution(template.id, count - 1)}
                        className="h-8 w-8 border-indigo-600 text-indigo-200 hover:bg-indigo-700"
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={count}
                        onChange={(e) => updateDistribution(template.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center bg-indigo-800/50 border-indigo-600 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateDistribution(template.id, count + 1)}
                        className="h-8 w-8 border-indigo-600 text-indigo-200 hover:bg-indigo-700"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Distribution Summary */}
          <div className={`rounded-lg p-3 border ${distributionValid 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-amber-500/10 border-amber-500/30'}`}
          >
            <div className="flex items-center justify-between">
              <span className={distributionValid ? 'text-emerald-300' : 'text-amber-300'}>
                Assigned: {distributionTotal} / {totalUnits} units
              </span>
              {!distributionValid && (
                <span className="text-amber-400 text-sm">
                  {distributionTotal < totalUnits 
                    ? `Need ${totalUnits - distributionTotal} more` 
                    : `Remove ${distributionTotal - totalUnits}`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Single Template Mode */}
      {generationMode === 'single' && (
        <div className="space-y-2">
          <Label className="text-indigo-100">Apply to All Units</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="bg-indigo-800/50 border-indigo-600 text-white">
              <SelectValue placeholder="Select floor plan..." />
            </SelectTrigger>
            <SelectContent className="bg-indigo-900 border-indigo-700">
              {unitTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id} className="text-white focus:bg-indigo-700">
                  {template.name} - ${template.baseRent}/mo ({template.bedrooms}BR/{template.bathrooms}BA)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Advanced Options */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-indigo-300 hover:text-white text-sm"
      >
        <Settings2 className="h-4 w-4" />
        Advanced Options
        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showAdvanced && (
        <div className="space-y-2">
          <Label className="text-indigo-100">Unit Naming Pattern</Label>
          <Select value={namingPattern} onValueChange={(v: 'sequential' | 'floor_unit') => setNamingPattern(v)}>
            <SelectTrigger className="bg-indigo-800/50 border-indigo-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-indigo-900 border-indigo-700">
              <SelectItem value="floor_unit" className="text-white focus:bg-indigo-700">Floor-Unit (101, 102, 201...)</SelectItem>
              <SelectItem value="sequential" className="text-white focus:bg-indigo-700">Sequential (001, 002, 003...)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={generateUnits}
        disabled={generationMode === 'single' ? !selectedTemplate : !distributionValid}
        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
      >
        <Sparkles className="h-5 w-5 mr-2" />
        Generate {totalUnits} Units
      </Button>

      {/* Generated Units Preview */}
      {generatedUnits.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">Generated Units Preview</h3>
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {generatedUnits.length} units
              </Badge>
              <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <DollarSign className="h-3 w-3 mr-1" />
                {totalEstimatedRent.toLocaleString()}/mo
              </Badge>
            </div>
          </div>

          <div className="bg-indigo-800/30 rounded-xl border border-indigo-600/50 max-h-[300px] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-4">
              {generatedUnits.slice(0, 40).map((unit, index) => (
                <div
                  key={index}
                  className="bg-indigo-900/50 rounded-lg p-2 text-center border border-indigo-700/50"
                >
                  <p className="font-medium text-white text-sm">{getUnitDisplayName(unit)}</p>
                  <p className="text-xs text-indigo-300">{unit.templateName}</p>
                  <p className="text-xs text-emerald-400 mt-1">${unit.rent}/mo</p>
                </div>
              ))}
              {generatedUnits.length > 40 && (
                <div className="bg-indigo-900/50 rounded-lg p-2 text-center flex items-center justify-center border border-indigo-700/50">
                  <p className="text-sm text-indigo-300">+{generatedUnits.length - 40} more</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="bg-gradient-to-r from-emerald-700/20 to-emerald-900/20 rounded-xl p-4 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm">Estimated Monthly Revenue</p>
                <p className="text-2xl font-bold text-emerald-400">${totalEstimatedRent.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-300 text-sm">Annual Potential</p>
                <p className="text-xl font-semibold text-emerald-400">${(totalEstimatedRent * 12).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Option */}
      <div className="bg-indigo-800/20 rounded-xl p-4 border border-dashed border-indigo-600/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-800/50 flex items-center justify-center">
            <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">Import from CSV</p>
            <p className="text-sm text-indigo-300">Upload a spreadsheet with unit details</p>
          </div>
          <Button variant="outline" className="border-indigo-600 text-indigo-200" disabled>
            Coming Soon
          </Button>
        </div>
      </div>

      {/* Enterprise Note */}
      {totalUnits > 24 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-200">Enterprise Feature</p>
            <p className="text-sm text-indigo-300">
              Managing more than 24 units requires an enterprise subscription. 
              You can still create the property, but some features may be limited.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
