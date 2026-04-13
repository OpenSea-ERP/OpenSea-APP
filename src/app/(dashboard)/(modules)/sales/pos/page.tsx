'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Monitor } from 'lucide-react';
import { useDeviceTerminal } from '@/hooks/sales';

export default function PosEntryPage() {
  const router = useRouter();
  const {
    isLoading,
    needsPairing,
    needsSession,
    isReady,
    mode,
    terminal,
  } = useDeviceTerminal();

  useEffect(() => {
    if (isLoading) return;

    if (needsPairing) {
      router.replace('/sales/pos/pair');
      return;
    }

    if (needsSession) {
      router.replace('/sales/pos/session/open');
      return;
    }

    if (isReady) {
      if (mode === 'TOTEM') {
        router.replace('/sales/pos/totem');
      } else {
        router.replace('/sales/pos/operator');
      }
    }
  }, [isLoading, needsPairing, needsSession, isReady, mode, router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-white to-sky-50 dark:from-violet-950/40 dark:via-slate-950 dark:to-sky-950/40">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 shadow-lg shadow-violet-500/30 mb-4">
        <Monitor className="h-8 w-8 text-white" />
      </div>
      {terminal && (
        <h1 className="text-xl font-bold text-foreground mb-1">
          {terminal.terminalName}
        </h1>
      )}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando terminal...</span>
      </div>
    </div>
  );
}
