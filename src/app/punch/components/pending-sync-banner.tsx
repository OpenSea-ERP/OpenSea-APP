'use client';

import { cn } from '@/lib/utils';
import { CloudOff, Loader2, RefreshCw } from 'lucide-react';

interface PendingSyncBannerProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onRetry?: () => void;
}

/**
 * Always-visible banner that surfaces queued punches and the current sync
 * state. Sits below the CTA so the user knows their offline punches did not
 * vanish — and that they will be sent automatically the moment the device
 * reconnects.
 */
export function PendingSyncBanner({
  isOnline,
  pendingCount,
  isSyncing,
  onRetry,
}: PendingSyncBannerProps) {
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  const variant = !isOnline ? 'offline' : 'pending';

  return (
    <div
      data-testid="punch-pending-sync"
      data-sync-state={isSyncing ? 'syncing' : variant}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3 border',
        variant === 'offline'
          ? 'bg-rose-50 dark:bg-rose-500/8 border-rose-200 dark:border-rose-500/20'
          : 'bg-amber-50 dark:bg-amber-500/8 border-amber-200 dark:border-amber-500/20'
      )}
    >
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-xl shrink-0',
          variant === 'offline'
            ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300'
            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
        )}
      >
        {isSyncing ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CloudOff className="size-4" />
        )}
      </span>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold',
            variant === 'offline'
              ? 'text-rose-700 dark:text-rose-200'
              : 'text-amber-700 dark:text-amber-200'
          )}
        >
          {isSyncing
            ? 'Sincronizando batidas...'
            : !isOnline
              ? 'Você está offline'
              : `${pendingCount} ${pendingCount === 1 ? 'batida aguardando' : 'batidas aguardando'} envio`}
        </p>
        <p
          className={cn(
            'text-xs',
            variant === 'offline'
              ? 'text-rose-600/80 dark:text-rose-300/80'
              : 'text-amber-600/80 dark:text-amber-300/80'
          )}
        >
          {!isOnline
            ? pendingCount > 0
              ? `${pendingCount} ${pendingCount === 1 ? 'batida salva' : 'batidas salvas'} no dispositivo. Enviaremos quando reconectar.`
              : 'Suas batidas serão salvas no dispositivo até reconectar.'
            : 'O envio acontece em segundo plano.'}
        </p>
      </div>

      {onRetry && isOnline && pendingCount > 0 && !isSyncing && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold',
            'bg-amber-600 hover:bg-amber-700 text-white shrink-0'
          )}
        >
          <RefreshCw className="size-3" />
          Enviar agora
        </button>
      )}
    </div>
  );
}
