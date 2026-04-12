'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, 
  Zap, 
  Droplets, 
  Wind, 
  Paintbrush, 
  Hammer,
  Home,
  Building2,
  Clock,
  AlertTriangle,
  Camera,
  DollarSign,
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const PROJECT_TYPES = [
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'electrical', label: 'Electrical', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { id: 'hvac', label: 'HVAC', icon: Wind, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  { id: 'painting', label: 'Painting', icon: Paintbrush, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'carpentry', label: 'Carpentry', icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { id: 'roofing', label: 'Roofing', icon: Home, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  { id: 'general', label: 'General Repair', icon: Wrench, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { id: 'remodeling', label: 'Remodeling', icon: Building2, color: 'text-violet-400', bg: 'bg-violet-500/20' },
];

const TIMELINE_OPTIONS = [
  { id: 'asap', label: 'ASAP / Emergency', icon: AlertTriangle, urgency: 'emergency' },
  { id: 'this_week', label: 'This Week', icon: Clock, urgency: 'urgent' },
  { id: 'this_month', label: 'This Month', icon: Clock, urgency: 'normal' },
  { id: 'flexible', label: 'Flexible', icon: Clock, urgency: 'flexible' },
];

const BUDGET_RANGES = [
  { id: 'under_500', label: 'Under $500', min: 0, max: 500 },
  { id: '500_1000', label: '$500 - $1,000', min: 500, max: 1000 },
  { id: '1000_2500', label: '$1,000 - $2,500', min: 1000, max: 2500 },
  { id: '2500_5000', label: '$2,500 - $5,000', min: 2500, max: 5000 },
  { id: '5000_10000', label: '$5,000 - $10,000', min: 5000, max: 10000 },
  { id: 'over_10000', label: '$10,000+', min: 10000, max: null },
  { id: 'not_sure', label: 'Not Sure', min: null, max: null },
];

interface LeadSubmissionFormProps {
  onClose?: () => void;
  preselectedType?: string;
  preselectedContractorId?: string;
}

export function LeadSubmissionForm({ 
  onClose, 
  preselectedType,
  preselectedContractorId 
}: LeadSubmissionFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Project Type
    projectType: preselectedType || '',
    
    // Step 2: Project Details
    projectTitle: '',
    projectDescription: '',
    timeline: '',
    budgetRange: '',
    
    // Step 3: Location
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    propertyZip: '',
    propertyType: 'residential',
    
    // Step 4: Contact Info
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    
    // Optional
    photos: [] as string[],
    isExclusive: false,
  });

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!formData.projectType;
      case 2: return !!formData.projectDescription && !!formData.timeline;
      case 3: return !!formData.propertyZip;
      case 4: return !!formData.customerName && !!formData.customerEmail;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const budget = BUDGET_RANGES.find(b => b.id === formData.budgetRange);
      
      const response = await fetch('/api/contractor/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budgetMin: budget?.min,
          budgetMax: budget?.max,
          urgency: TIMELINE_OPTIONS.find(t => t.id === formData.timeline)?.urgency || 'normal',
          preselectedContractorId,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: 'Request Submitted!',
          description: 'Contractors will reach out to you shortly.',
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit request');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 px-6"
      >
        <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
        <p className="text-slate-300 mb-6 max-w-md mx-auto">
          We&apos;re matching you with the best contractors in your area. 
          Expect to hear back within a few hours.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-slate-400">What happens next:</p>
          <div className="flex flex-col gap-2 text-left max-w-sm mx-auto">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-400">1</div>
              <span>Contractors review your project</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-400">2</div>
              <span>You receive quotes via email</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-400">3</div>
              <span>Compare and choose the best fit</span>
            </div>
          </div>
        </div>
        {onClose && (
          <Button onClick={onClose} className="mt-8">
            Done
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s <= step
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    s < step ? 'bg-violet-600' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Service</span>
          <span>Details</span>
          <span>Location</span>
          <span>Contact</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Project Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">What do you need help with?</h2>
              <p className="text-slate-400 mt-1">Select the type of service you need</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PROJECT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => updateFormData({ projectType: type.id })}
                  className={`p-4 rounded-xl border transition-all text-center ${
                    formData.projectType === type.id
                      ? 'border-violet-500 bg-violet-500/20'
                      : 'border-white/10 bg-slate-800/50 hover:border-white/20'
                  }`}
                >
                  <div className={`h-10 w-10 mx-auto mb-2 rounded-lg ${type.bg} flex items-center justify-center`}>
                    <type.icon className={`h-5 w-5 ${type.color}`} />
                  </div>
                  <span className="text-sm text-white font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Project Details */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">Tell us about your project</h2>
              <p className="text-slate-400 mt-1">The more details, the better quotes you&apos;ll receive</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Project Title (optional)</Label>
                <Input
                  value={formData.projectTitle}
                  onChange={(e) => updateFormData({ projectTitle: e.target.value })}
                  placeholder="e.g., Fix leaky bathroom faucet"
                  className="mt-1 bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Describe your project *</Label>
                <Textarea
                  value={formData.projectDescription}
                  onChange={(e) => updateFormData({ projectDescription: e.target.value })}
                  placeholder="Describe what needs to be done, any issues you've noticed, and any relevant details..."
                  className="mt-1 bg-slate-800 border-slate-700 text-white min-h-[120px]"
                />
              </div>

              <div>
                <Label className="text-slate-300">When do you need this done? *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {TIMELINE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateFormData({ timeline: option.id })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.timeline === option.id
                          ? 'border-violet-500 bg-violet-500/20'
                          : 'border-white/10 bg-slate-800/50 hover:border-white/20'
                      }`}
                    >
                      <span className="text-sm text-white">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Budget Range</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {BUDGET_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => updateFormData({ budgetRange: range.id })}
                      className={`p-2 rounded-lg border text-center transition-all text-sm ${
                        formData.budgetRange === range.id
                          ? 'border-violet-500 bg-violet-500/20 text-white'
                          : 'border-white/10 bg-slate-800/50 hover:border-white/20 text-slate-300'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">Where is the project?</h2>
              <p className="text-slate-400 mt-1">We&apos;ll match you with local contractors</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Street Address (optional)</Label>
                <Input
                  value={formData.propertyAddress}
                  onChange={(e) => updateFormData({ propertyAddress: e.target.value })}
                  placeholder="123 Main Street"
                  className="mt-1 bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">City</Label>
                  <Input
                    value={formData.propertyCity}
                    onChange={(e) => updateFormData({ propertyCity: e.target.value })}
                    placeholder="Las Vegas"
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">State</Label>
                  <Input
                    value={formData.propertyState}
                    onChange={(e) => updateFormData({ propertyState: e.target.value })}
                    placeholder="NV"
                    className="mt-1 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">ZIP Code *</Label>
                <Input
                  value={formData.propertyZip}
                  onChange={(e) => updateFormData({ propertyZip: e.target.value })}
                  placeholder="89101"
                  className="mt-1 bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Property Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { id: 'residential', label: 'Residential', icon: Home },
                    { id: 'commercial', label: 'Commercial', icon: Building2 },
                    { id: 'multi_family', label: 'Multi-Family', icon: Building2 },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => updateFormData({ propertyType: type.id })}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        formData.propertyType === type.id
                          ? 'border-violet-500 bg-violet-500/20'
                          : 'border-white/10 bg-slate-800/50 hover:border-white/20'
                      }`}
                    >
                      <type.icon className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                      <span className="text-sm text-white">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Contact Info */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">How can contractors reach you?</h2>
              <p className="text-slate-400 mt-1">Your info is only shared with matched contractors</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Your Name *</Label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => updateFormData({ customerName: e.target.value })}
                  placeholder="John Smith"
                  className="mt-1 bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Email *</Label>
                <Input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => updateFormData({ customerEmail: e.target.value })}
                  placeholder="john@example.com"
                  className="mt-1 bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Phone (optional but recommended)</Label>
                <Input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => updateFormData({ customerPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="mt-1 bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Exclusive Lead Option */}
              <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/10">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isExclusive}
                    onChange={(e) => updateFormData({ isExclusive: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <span className="text-white font-medium">Send to only one contractor</span>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Get personalized attention instead of competing quotes. 
                      We&apos;ll match you with our top-rated contractor for your project.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={() => step > 1 ? setStep(step - 1) : onClose?.()}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step > 1 ? 'Back' : 'Cancel'}
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Request
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
