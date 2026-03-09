'use client';

import { useEffect, useRef, useState } from 'react';

interface ProtectedImageCanvasProps {
  src: string;
  alt: string;
  watermarkText: string;
  className?: string;
  maxHeight?: number;
}

export function ProtectedImageCanvas({
  src,
  alt,
  watermarkText,
  className,
  maxHeight = 500,
}: ProtectedImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Scale image to fit within maxHeight while maintaining aspect ratio
      let { width, height } = img;
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Account for device pixel ratio for sharp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      setDimensions({ width, height });

      ctx.scale(dpr, dpr);

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Draw watermark grid
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#000000';
      ctx.font = '14px sans-serif';
      ctx.rotate(-Math.PI / 6); // -30 degrees

      const text = watermarkText;
      const stepX = 250;
      const stepY = 80;

      // Cover the entire rotated area with extra margin
      for (let y = -height; y < height * 2; y += stepY) {
        for (let x = -width; x < width * 2; x += stepX) {
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();

      // Override toDataURL and toBlob to prevent extraction
      canvas.toDataURL = () => '';
      canvas.toBlob = () => {};
    };
    img.src = src;
  }, [src, watermarkText, maxHeight]);

  // Block keyboard shortcuts for save/print/devtools — scoped to parent container
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current?.closest('[role="dialog"]') ?? containerRef.current;
    if (!container) return;

    const handler = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (
        (ke.ctrlKey || ke.metaKey) &&
        (ke.key === 's' || ke.key === 'p' || ke.key === 'u' ||
         (ke.shiftKey && ke.key === 'I'))
      ) {
        ke.preventDefault();
      }
      if (ke.key === 'PrintScreen') {
        ke.preventDefault();
      }
    };

    container.addEventListener('keydown', handler, { capture: true });
    return () => container.removeEventListener('keydown', handler, { capture: true });
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
      style={{ position: 'relative' }}
    >
      {/* Transparent overlay to block interaction with canvas */}
      <div
        className="absolute inset-0 z-10"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      />
      {/* Black overlay shown only during print */}
      <div
        className="print-only absolute inset-0 z-20 bg-black"
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        aria-label={alt}
        className="print-hidden"
        style={{
          width: dimensions.width || 'auto',
          height: dimensions.height || 'auto',
          maxWidth: '100%',
          maxHeight: `${maxHeight}px`,
          userSelect: 'none',
          pointerEvents: 'none',
          WebkitUserSelect: 'none',
        }}
      />
    </div>
  );
}
