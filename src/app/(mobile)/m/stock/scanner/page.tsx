'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MobileTopBar } from '@/components/mobile/mobile-top-bar';
import {
  ScanModeChips,
  type ScanMode,
} from '@/components/mobile/scan-mode-chips';
import { ScanResultSheet } from '@/components/mobile/scan-result-sheet';
import { useCodeLookup } from '@/hooks/mobile/use-code-lookup';
import { cn } from '@/lib/utils';
import { Search, ScanLine, Loader2, AlertCircle } from 'lucide-react';

const ScannerCamera = dynamic(
  () =>
    import('@/components/mobile/scanner-camera').then(m => ({
      default: m.ScannerCamera,
    })),
  { ssr: false }
);

export default function ScannerPage() {
  const [mode, setMode] = useState<ScanMode>('lookup');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastScan, setLastScan] = useState<{
    code: string;
    time: Date;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lookup = useCodeLookup();

  const handleScan = useCallback(
    (code: string) => {
      setLastScan({ code, time: new Date() });
      lookup.mutate(code, {
        onSuccess: () => {
          setSheetOpen(true);
        },
      });
    },
    [lookup]
  );

  const handleCameraError = useCallback((error: string) => {
    setCameraError(error);
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    handleScan(code);
    setManualCode('');
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-slate-950">
      <MobileTopBar
        title="Scanner"
        subtitle={mode !== 'lookup' ? `Modo: ${mode}` : undefined}
        showBack
        rightContent={
          lookup.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          ) : null
        }
      />

      {/* Camera area */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
              <AlertCircle className="h-7 w-7 text-rose-400" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              Câmera indisponível
            </p>
            <p className="text-xs text-slate-500">{cameraError}</p>
            <p className="text-xs text-slate-500">
              Use a entrada manual abaixo
            </p>
          </div>
        ) : (
          <ScannerCamera
            onScan={handleScan}
            onError={handleCameraError}
            enabled={!sheetOpen}
            className="h-full"
          />
        )}

        {/* Mode chips overlay at bottom of camera */}
        {!cameraError && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-8">
            <ScanModeChips value={mode} onChange={setMode} />
          </div>
        )}
      </div>

      {/* Last scan bar */}
      {lastScan && (
        <div
          className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/80 px-4 py-2 text-xs cursor-pointer active:bg-slate-800/80"
          onClick={() => {
            if (lookup.data) setSheetOpen(true);
          }}
        >
          <ScanLine className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
          <span className="flex-1 truncate text-slate-300">
            {lastScan.code}
          </span>
          <span className="shrink-0 text-slate-600">
            {formatTime(lastScan.time)}
          </span>
        </div>
      )}

      {/* Manual input */}
      <form
        onSubmit={handleManualSubmit}
        className="flex items-center gap-2 border-t border-slate-800 bg-slate-900 px-4 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={manualCode}
          onChange={e => setManualCode(e.target.value)}
          placeholder="Código manual..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!manualCode.trim() || lookup.isPending}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white disabled:opacity-40 active:bg-indigo-600"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Result sheet */}
      <ScanResultSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        result={lookup.data ?? null}
      />
    </div>
  );
}
