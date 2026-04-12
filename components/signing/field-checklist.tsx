'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle, PenTool, Edit3 } from 'lucide-react';
import type { SignatureField } from '@/hooks/use-signing-wizard';

export interface FieldChecklistProps {
  fields: SignatureField[];
  currentFieldIndex: number;
  onFieldClick?: (index: number) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

export default function FieldChecklist({
  fields,
  currentFieldIndex,
  onFieldClick,
  className,
  variant = 'default',
}: FieldChecklistProps) {
  const completedCount = useMemo(() => {
    return fields.filter((f) => f.completed).length;
  }, [fields]);

  const requiredCount = useMemo(() => {
    return fields.filter((f) => f.required).length;
  }, [fields]);

  // Group fields by section context
  const groupedFields = useMemo(() => {
    const groups: Map<string, { fields: (SignatureField & { originalIndex: number })[] }> = new Map();

    fields.forEach((field, index) => {
      const section = field.sectionContext || 'General';
      if (!groups.has(section)) {
        groups.set(section, { fields: [] });
      }
      groups.get(section)!.fields.push({ ...field, originalIndex: index });
    });

    return groups;
  }, [fields]);

  if (variant === 'inline') {
    return (
      <div className={cn('flex gap-2 flex-wrap', className)}>
        {fields.map((field, index) => {
          const isActive = index === currentFieldIndex;
          const isCompleted = field.completed;

          return (
            <button
              key={field.id}
              type="button"
              onClick={() => onFieldClick?.(index)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive && 'bg-violet-600 text-white shadow-md',
                isCompleted && !isActive && 'bg-emerald-100 text-emerald-700 border border-emerald-300',
                !isCompleted && !isActive && 'bg-white text-gray-700 border border-gray-300 hover:border-violet-400'
              )}
            >
              {isCompleted && <Check className="h-4 w-4" />}
              <span className="whitespace-nowrap">
                {field.type === 'initial' ? 'Initial' : 'Sign'} {index + 1}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Fields</span>
          <span className="text-gray-500">
            {completedCount}/{requiredCount} complete
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {fields.map((field, index) => {
            const isActive = index === currentFieldIndex;
            const isCompleted = field.completed;

            return (
              <button
                key={field.id}
                type="button"
                onClick={() => onFieldClick?.(index)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                  isActive && 'bg-violet-600 text-white ring-2 ring-violet-200',
                  isCompleted && !isActive && 'bg-emerald-500 text-white',
                  !isCompleted && !isActive && 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                )}
                title={`${field.label} - ${field.sectionContext || 'General'}`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default variant - full list with sections
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Signature Fields</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {completedCount}/{requiredCount} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${requiredCount > 0 ? (completedCount / requiredCount) * 100 : 0}%` }}
        />
      </div>

      {/* Field list grouped by section */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        {Array.from(groupedFields.entries()).map(([section, { fields: sectionFields }]) => (
          <div key={section} className="space-y-2">
            {/* Section header */}
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{section}</p>

            {/* Fields in section */}
            <div className="space-y-1">
              {sectionFields.map((field) => {
                const isActive = field.originalIndex === currentFieldIndex;
                const isCompleted = field.completed;

                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => onFieldClick?.(field.originalIndex)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                      isActive && 'bg-violet-50 border-2 border-violet-500',
                      isCompleted && !isActive && 'bg-emerald-50 border border-emerald-200',
                      !isCompleted && !isActive && 'bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'
                    )}
                  >
                    {/* Status icon */}
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                        isCompleted && 'bg-emerald-500 text-white',
                        isActive && !isCompleted && 'bg-violet-500 text-white',
                        !isCompleted && !isActive && 'bg-gray-200 text-gray-400'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : field.type === 'signature' ? (
                        <PenTool className="h-3 w-3" />
                      ) : (
                        <Edit3 className="h-3 w-3" />
                      )}
                    </div>

                    {/* Field info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium truncate',
                          isActive && 'text-violet-700',
                          isCompleted && !isActive && 'text-emerald-700',
                          !isCompleted && !isActive && 'text-gray-700'
                        )}
                      >
                        {field.label}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {field.type === 'signature' ? 'Full signature' : 'Initials only'}
                        {field.required && ' • Required'}
                      </p>
                    </div>

                    {/* Current indicator */}
                    {isActive && (
                      <span className="text-xs font-medium text-violet-600 bg-violet-100 px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
