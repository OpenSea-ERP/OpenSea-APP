'use client';

import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  syncing: boolean;
}

export function OfflineIndicator({
  isOnline,
  pendingCount,
  syncing,
}: OfflineIndicatorProps) {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm',
        isOnline
          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
      )}
    >
      {isOnline ? (
        <>
          {syncing ? (
            <RefreshCw className="size-4 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
          ) : (
            <Cloud className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <span className="text-amber-700 dark:text-amber-300 font-medium">
            {syncing
              ? 'Sincronizando registros pendentes...'
              : `${pendingCount} registro(s) pendente(s) de sincronização`}
          </span>
        </>
      ) : (
        <>
          <CloudOff className="size-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            Modo offline
            {pendingCount > 0 && ` — ${pendingCount} registro(s) salvo(s)`}
          </span>
        </>
      )}
    </div>
  );
}
