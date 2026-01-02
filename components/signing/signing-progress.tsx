'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, FileText, PenTool, CheckCircle } from 'lucide-react';
import type { WizardStep } from '@/hooks/use-signing-wizard';

export interface SigningProgressProps {
  currentStep: WizardStep;
  completedCount: number;
  totalFields: number;
  className?: string;
  variant?: 'default' | 'compact';
}

interface StepConfig {
  id: WizardStep;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepConfig[] = [
  { id: 'review', label: 'Review Document', shortLabel: 'Review', icon: FileText },
  { id: 'sign', label: 'Sign Fields', shortLabel: 'Sign', icon: PenTool },
  { id: 'confirm', label: 'Confirm & Submit', shortLabel: 'Confirm', icon: CheckCircle },
];

export default function SigningProgress({
  currentStep,
  completedCount,
  totalFields,
  className,
  variant = 'default',
}: SigningProgressProps) {
  const currentStepIndex = useMemo(() => {
    return STEPS.findIndex((s) => s.id === currentStep);
  }, [currentStep]);

  const progressPercentage = useMemo(() => {
    if (totalFields === 0) return 0;
    return Math.round((completedCount / totalFields) * 100);
  }, [completedCount, totalFields]);

  const overallProgress = useMemo(() => {
    // Calculate overall progress based on step and field completion
    const stepWeight = 33.33;
    const baseProgress = currentStepIndex * stepWeight;
    
    if (currentStep === 'sign' && totalFields > 0) {
      const fieldProgress = (completedCount / totalFields) * stepWeight;
      return Math.round(baseProgress + fieldProgress);
    }
    
    if (currentStep === 'confirm') {
      return 100;
    }
    
    return Math.round(baseProgress);
  }, [currentStep, currentStepIndex, completedCount, totalFields]);

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        
        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 font-medium">
            Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex]?.shortLabel}
          </span>
          {currentStep === 'sign' && totalFields > 0 && (
            <span className="text-gray-500">
              {completedCount}/{totalFields} fields
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1">
          <span className="text-xs font-medium text-gray-600">{overallProgress}%</span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted && 'bg-emerald-500 text-white',
                    isCurrent && 'bg-violet-600 text-white ring-4 ring-violet-100',
                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium hidden sm:block',
                    isCurrent && 'text-violet-600',
                    isCompleted && 'text-emerald-600',
                    !isCompleted && !isCurrent && 'text-gray-400'
                  )}
                >
                  {step.shortLabel}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 sm:mx-4 transition-colors duration-300',
                    index < currentStepIndex ? 'bg-emerald-500' : 'bg-gray-200'
                  )}
                  style={{ minWidth: '2rem' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step description */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {currentStep === 'review' && 'Review the lease document before signing'}
          {currentStep === 'sign' && (
            <>
              Complete all signature fields ({completedCount} of {totalFields} done)
            </>
          )}
          {currentStep === 'confirm' && 'Review and submit your signature'}
        </p>
      </div>
    </div>
  );
}
