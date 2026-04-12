'use client';

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Trash2 } from 'lucide-react';

export interface SignatureCanvasProps {
  width?: number | string;
  height?: number | string;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  disabled?: boolean;
  className?: string;
  onSignatureChange?: (dataUrl: string | null) => void;
  onDrawStart?: () => void;
  onDrawEnd?: () => void;
}

export interface SignatureCanvasRef {
  clear: () => void;
  undo: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string, quality?: number) => string;
  fromDataURL: (dataUrl: string) => void;
}

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  (
    {
      width = '100%',
      height = 150,
      strokeColor = '#1a1a2e',
      strokeWidth = 2,
      backgroundColor = '#ffffff',
      disabled = false,
      className = '',
      onSignatureChange,
      onDrawStart,
      onDrawEnd,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Setup canvas with proper DPI scaling
    const setupCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set display size
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = typeof height === 'number' ? `${height}px` : height;

      // Set actual size in memory (scaled for DPI)
      const actualHeight = typeof height === 'number' ? height : rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = actualHeight * dpr;

      setCanvasSize({ width: rect.width, height: actualHeight });

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Scale context for DPI
      ctx.scale(dpr, dpr);

      // Redraw existing strokes
      redrawCanvas(ctx, rect.width, actualHeight);
    }, [height, strokes, backgroundColor]);

    // Redraw all strokes
    const redrawCanvas = useCallback(
      (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Clear and fill background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Draw all strokes
        strokes.forEach((stroke) => {
          if (stroke.points.length < 2) return;

          ctx.beginPath();
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            const p0 = stroke.points[i - 1];
            const p1 = stroke.points[i];
            // Use quadratic curve for smoother lines
            const midX = (p0.x + p1.x) / 2;
            const midY = (p0.y + p1.y) / 2;
            ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
          }
          ctx.stroke();
        });
      },
      [strokes, backgroundColor]
    );

    // Initialize canvas on mount and resize
    useEffect(() => {
      setupCanvas();

      const handleResize = () => {
        setupCanvas();
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [setupCanvas]);

    // Redraw when strokes change
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      redrawCanvas(ctx, canvasSize.width, canvasSize.height);

      // Notify parent of signature change
      if (strokes.length > 0) {
        onSignatureChange?.(canvas.toDataURL('image/png'));
      } else {
        onSignatureChange?.(null);
      }
    }, [strokes, canvasSize, redrawCanvas, onSignatureChange]);

    // Get point from pointer event
    const getPoint = useCallback((e: PointerEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure,
      };
    }, []);

    // Drawing handlers
    const handlePointerDown = useCallback(
      (e: PointerEvent) => {
        if (disabled) return;

        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.setPointerCapture(e.pointerId);
        setIsDrawing(true);
        setCurrentStroke([getPoint(e)]);
        onDrawStart?.();
      },
      [disabled, getPoint, onDrawStart]
    );

    const handlePointerMove = useCallback(
      (e: PointerEvent) => {
        if (!isDrawing || disabled) return;

        e.preventDefault();
        const point = getPoint(e);
        setCurrentStroke((prev) => [...prev, point]);

        // Draw current stroke in real-time
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.scale(1 / dpr, 1 / dpr);
        ctx.scale(dpr, dpr);

        if (currentStroke.length > 0) {
          const lastPoint = currentStroke[currentStroke.length - 1];
          ctx.beginPath();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        }

        ctx.restore();
      },
      [isDrawing, disabled, getPoint, currentStroke, strokeColor, strokeWidth]
    );

    const handlePointerUp = useCallback(
      (e: PointerEvent) => {
        if (!isDrawing) return;

        e.preventDefault();
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.releasePointerCapture(e.pointerId);
        }

        setIsDrawing(false);

        if (currentStroke.length > 1) {
          setStrokes((prev) => [
            ...prev,
            {
              points: currentStroke,
              color: strokeColor,
              width: strokeWidth,
            },
          ]);
        }

        setCurrentStroke([]);
        onDrawEnd?.();
      },
      [isDrawing, currentStroke, strokeColor, strokeWidth, onDrawEnd]
    );

    // Attach event listeners
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerup', handlePointerUp);
      canvas.addEventListener('pointerleave', handlePointerUp);
      canvas.addEventListener('pointercancel', handlePointerUp);

      return () => {
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
        canvas.removeEventListener('pointerleave', handlePointerUp);
        canvas.removeEventListener('pointercancel', handlePointerUp);
      };
    }, [handlePointerDown, handlePointerMove, handlePointerUp]);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        clear: () => {
          setStrokes([]);
          setCurrentStroke([]);
        },
        undo: () => {
          setStrokes((prev) => prev.slice(0, -1));
        },
        isEmpty: () => strokes.length === 0,
        toDataURL: (type = 'image/png', quality = 1) => {
          const canvas = canvasRef.current;
          if (!canvas) return '';
          return canvas.toDataURL(type, quality);
        },
        fromDataURL: (dataUrl: string) => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = dataUrl;
        },
      }),
      [strokes]
    );

    const handleClear = () => {
      setStrokes([]);
      setCurrentStroke([]);
    };

    const handleUndo = () => {
      setStrokes((prev) => prev.slice(0, -1));
    };

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div
          ref={containerRef}
          className="relative rounded-xl border-2 overflow-hidden"
          style={{
            borderColor: isDrawing ? '#8b5cf6' : '#d4d4d4',
            width: typeof width === 'number' ? `${width}px` : width,
            transition: 'border-color 0.2s',
          }}
        >
          <canvas
            ref={canvasRef}
            className={`w-full ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'}`}
            style={{
              height: typeof height === 'number' ? `${height}px` : height,
              touchAction: 'none',
              background: backgroundColor,
            }}
          />
          {strokes.length === 0 && !isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm">Draw your signature here</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Use your finger, stylus, or mouse</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              disabled={disabled || strokes.length === 0}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Undo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClear}
              disabled={disabled || strokes.length === 0}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

SignatureCanvas.displayName = 'SignatureCanvas';

export default SignatureCanvas;
