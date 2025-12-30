'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

interface SpotlightTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  storageKey: string;
}

export function SpotlightTour({ steps, isOpen, onComplete, onSkip, storageKey }: SpotlightTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowDirection, setArrowDirection] = useState<'up' | 'down' | 'left' | 'right'>('up');
  const [isNavigating, setIsNavigating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const findTarget = useCallback(() => {
    if (!step) return;

    const target = document.querySelector(step.targetSelector);
    if (target) {
      // Scroll into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        positionTooltip(rect, step.position);
      }, 350);
    } else {
      setTargetRect(null);
    }
  }, [step]);

  const positionTooltip = (rect: DOMRect, preferred?: string) => {
    const tooltipWidth = 300;
    const tooltipHeight = 160;
    const gap = 16;
    const arrowSize = 10;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let pos = preferred || 'auto';
    
    // Auto-detect best position
    if (pos === 'auto') {
      const spaceBelow = vh - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = vw - rect.right;
      const spaceLeft = rect.left;

      if (spaceBelow >= tooltipHeight + gap) pos = 'bottom';
      else if (spaceAbove >= tooltipHeight + gap) pos = 'top';
      else if (spaceRight >= tooltipWidth + gap) pos = 'right';
      else pos = 'left';
    }

    let top = 0, left = 0;

    switch (pos) {
      case 'bottom':
        top = rect.bottom + gap + arrowSize;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowDirection('up');
        break;
      case 'top':
        top = rect.top - tooltipHeight - gap - arrowSize;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        setArrowDirection('down');
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap + arrowSize;
        setArrowDirection('left');
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap - arrowSize;
        setArrowDirection('right');
        break;
    }

    // Keep in viewport
    left = Math.max(12, Math.min(left, vw - tooltipWidth - 12));
    top = Math.max(12, Math.min(top, vh - tooltipHeight - 12));

    setTooltipStyle({ top, left, width: tooltipWidth });
  };

  // Navigate to route if needed
  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.route && pathname !== step.route) {
      setIsNavigating(true);
      router.push(step.route);
    } else {
      setIsNavigating(false);
      const timer = setTimeout(findTarget, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step, pathname, router, findTarget]);

  // Re-position on resize
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => findTarget();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, findTarget]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setTargetRect(null);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setTargetRect(null);
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  // Arrow styles based on direction
  const arrowStyles: Record<string, string> = {
    up: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-900',
    down: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-900',
    left: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-900',
    right: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-900',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && targetRect && (
        <>
          {/* Pulsing ring around target element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[9998] pointer-events-none rounded-xl"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              border: '2px solid rgb(139, 92, 246)',
              boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.25), 0 0 15px rgba(139, 92, 246, 0.3)',
            }}
          />
          
          {/* Animated pulse ring */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.6, 0, 0.6],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="fixed z-[9997] pointer-events-none rounded-xl"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              border: '2px solid rgba(139, 92, 246, 0.5)',
            }}
          />

          {/* Tooltip with pointer */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed z-[9999]"
            style={tooltipStyle}
          >
            {/* Arrow pointer */}
            <div 
              className={`absolute w-0 h-0 border-[10px] ${arrowStyles[arrowDirection]}`}
            />

            <div className="bg-slate-900 border border-violet-500/40 rounded-xl shadow-2xl shadow-violet-500/20 overflow-hidden">
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 pt-3 pb-1">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStep 
                        ? 'w-4 bg-violet-500' 
                        : idx < currentStep 
                        ? 'w-1.5 bg-violet-500/50' 
                        : 'w-1.5 bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="px-4 pb-3 pt-2">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white">{step?.title}</h3>
                  <button
                    onClick={onSkip}
                    className="p-1 rounded hover:bg-slate-800 transition-colors -mr-1 -mt-1"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{step?.description}</p>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={isFirstStep}
                    className="text-xs text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Back
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={onSkip}
                      className="text-xs text-slate-500 hover:text-white"
                    >
                      Skip
                    </button>
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      {isLastStep ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Done
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
