'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface SignatureStyle {
  id: number;
  name: string;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  letterSpacing: string;
  transform?: string;
}

export const SIGNATURE_STYLES: SignatureStyle[] = [
  {
    id: 0,
    name: 'Classic',
    fontFamily: 'Georgia, serif',
    fontWeight: '400',
    fontStyle: 'italic',
    letterSpacing: '0.02em',
  },
  {
    id: 1,
    name: 'Elegant',
    fontFamily: '"Brush Script MT", "Segoe Script", cursive',
    fontWeight: '400',
    fontStyle: 'normal',
    letterSpacing: '0.01em',
  },
  {
    id: 2,
    name: 'Modern',
    fontFamily: '"Lucida Handwriting", "Comic Sans MS", cursive',
    fontWeight: '400',
    fontStyle: 'normal',
    letterSpacing: '0.03em',
  },
  {
    id: 3,
    name: 'Bold',
    fontFamily: 'Georgia, serif',
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: '0.01em',
  },
];

export interface TypedSignatureProps {
  name: string;
  type?: 'signature' | 'initial';
  styleIndex?: number;
  onStyleChange?: (styleIndex: number) => void;
  onSignatureGenerated?: (dataUrl: string) => void;
  showStyleSelector?: boolean;
  className?: string;
  previewClassName?: string;
}

/**
 * Generate initials from a full name
 */
export function generateInitials(name: string): string {
  if (!name || !name.trim()) return '';
  
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  return name.substring(0, Math.min(2, name.length)).toUpperCase();
}

/**
 * Generate a signature image from text
 */
export function generateSignatureImage(
  text: string,
  style: SignatureStyle,
  options: {
    width?: number;
    height?: number;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
  } = {}
): string {
  if (!text || !text.trim()) return '';

  const {
    width = 400,
    height = 120,
    fontSize = 48,
    color = '#1a1a2e',
    backgroundColor = '#ffffff',
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Set font style
  ctx.fillStyle = color;
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Apply slight slant for signature effect
  const slant = -0.1;
  ctx.setTransform(1, 0, slant, 1, 0, 0);

  // Draw text
  ctx.fillText(text, width / 2, height / 2);

  // Reset transform
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  return canvas.toDataURL('image/png');
}

/**
 * Generate an initials image
 */
export function generateInitialsImage(
  initials: string,
  options: {
    width?: number;
    height?: number;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
  } = {}
): string {
  if (!initials || !initials.trim()) return '';

  const {
    width = 80,
    height = 60,
    fontSize = 32,
    color = '#1a1a2e',
    backgroundColor = '#ffffff',
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Set font style
  ctx.fillStyle = color;
  ctx.font = `italic 400 ${fontSize}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw initials
  ctx.fillText(initials, width / 2, height / 2);

  return canvas.toDataURL('image/png');
}

export default function TypedSignature({
  name,
  type = 'signature',
  styleIndex = 0,
  onStyleChange,
  onSignatureGenerated,
  showStyleSelector = true,
  className,
  previewClassName,
}: TypedSignatureProps) {
  const [selectedStyle, setSelectedStyle] = useState(styleIndex);

  // Update selected style when prop changes
  useEffect(() => {
    setSelectedStyle(styleIndex);
  }, [styleIndex]);

  const currentStyle = useMemo(() => {
    return SIGNATURE_STYLES[selectedStyle] || SIGNATURE_STYLES[0];
  }, [selectedStyle]);

  const displayText = useMemo(() => {
    if (type === 'initial') {
      return generateInitials(name);
    }
    return name;
  }, [name, type]);

  const signatureDataUrl = useMemo(() => {
    if (!displayText) return '';

    if (type === 'initial') {
      return generateInitialsImage(displayText);
    }

    return generateSignatureImage(displayText, currentStyle);
  }, [displayText, type, currentStyle]);

  // Notify parent when signature is generated
  useEffect(() => {
    if (signatureDataUrl) {
      onSignatureGenerated?.(signatureDataUrl);
    }
  }, [signatureDataUrl, onSignatureGenerated]);

  const handleStyleChange = useCallback(
    (index: number) => {
      setSelectedStyle(index);
      onStyleChange?.(index);
    },
    [onStyleChange]
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preview */}
      <div
        className={cn(
          'rounded-xl border-2 p-4 flex items-center justify-center min-h-[120px]',
          'border-gray-300 bg-white',
          previewClassName
        )}
      >
        {displayText ? (
          <img
            src={signatureDataUrl}
            alt={type === 'signature' ? 'Signature preview' : 'Initials preview'}
            className="max-h-20 object-contain"
          />
        ) : (
          <p className="text-gray-400 text-sm">
            {type === 'signature' ? 'Enter your name to generate signature' : 'Enter your name to generate initials'}
          </p>
        )}
      </div>

      {/* Style selector (only for signatures) */}
      {showStyleSelector && type === 'signature' && displayText && (
        <div className="flex justify-center gap-2 flex-wrap">
          {SIGNATURE_STYLES.map((style, index) => (
            <button
              key={style.id}
              type="button"
              onClick={() => handleStyleChange(index)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                selectedStyle === index
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {style.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
