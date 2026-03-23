'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Flashlight, FlashlightOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScannerCameraProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
  className?: string;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
];

export function ScannerCamera({
  onScan,
  onError,
  enabled = true,
  className,
}: ScannerCameraProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [flashOn, setFlashOn] = useState(false);
  const lastScanRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  const handleScan = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      // Debounce: ignore same code within 2 seconds
      if (
        decodedText === lastScanRef.current &&
        now - lastScanTimeRef.current < 2000
      )
        return;
      lastScanRef.current = decodedText;
      lastScanTimeRef.current = now;
      onScan(decodedText);
    },
    [onScan]
  );

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    let cancelled = false;
    const scanner = new Html5Qrcode('scanner-region', {
      formatsToSupport: SUPPORTED_FORMATS,
      verbose: false,
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        handleScan,
        () => {} // ignore scan failures (continuous)
      )
      .then(() => {
        // If unmounted before start completed, stop immediately
        if (cancelled) {
          scanner
            .stop()
            .then(() => scanner.clear())
            .catch(() => {});
        }
      })
      .catch(err => {
        if (!cancelled) {
          onError?.(err?.message || 'Falha ao acessar câmera');
        }
      });

    return () => {
      cancelled = true;
      const state = scanner.getState();
      // Only stop if scanner is actually running or paused (state 2 = SCANNING, 3 = PAUSED)
      if (state === 2 || state === 3) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      } else {
        try {
          scanner.clear();
        } catch {
          /* already cleared */
        }
      }
    };
  }, [enabled, handleScan, onError]);

  const toggleFlash = async () => {
    try {
      const track = scannerRef.current?.getRunningTrackCameraCapabilities();
      if (track?.torchFeature()?.isSupported()) {
        await track.torchFeature().apply(!flashOn);
        setFlashOn(!flashOn);
      }
    } catch {
      /* Flash not supported */
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div id="scanner-region" ref={containerRef} className="w-full" />
      {/* Viewfinder overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-56 w-56">
          {/* Corner brackets */}
          <div className="absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] border-indigo-400 rounded-tl" />
          <div className="absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] border-indigo-400 rounded-tr" />
          <div className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-indigo-400 rounded-bl" />
          <div className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-indigo-400 rounded-br" />
          {/* Scan line */}
          <div className="absolute left-[10%] right-[10%] top-1/2 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-70 animate-pulse" />
        </div>
      </div>
      {/* Flash toggle */}
      <button
        onClick={toggleFlash}
        className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm active:bg-black/70"
      >
        {flashOn ? (
          <FlashlightOff className="h-4 w-4" />
        ) : (
          <Flashlight className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
