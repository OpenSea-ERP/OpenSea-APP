'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, CloudOff, Loader2, RefreshCw } from 'lucide-react';

interface PendingSyncBannerProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onRetry?: () => void;
  /**
   * Phase 8 / Plan 08-03 (D-04 + D-10).
   * Number of queued punches whose status is `'failed'` or `'paused'`
   * (backoff exhausted). When > 0, the banner renders the rose `failed`
   * variant and surfaces an explicit retry CTA.
   */
  failedCount?: number;
}

type BannerVariant = 'failed' | 'offline' | 'pending';

/**
 * Always-visible banner that surfaces queued punches and the current sync
 * state. Sits below the CTA so the user knows their offline punches did not
 * vanish — and that they will be sent automatically the moment the device
 * reconnects.
 *
 * Phase 8 / Plan 08-03 adds the `failed` variant (rose) which is shown
 * whenever any punch in the queue is in a `paused`/`failed` terminal state.
 * When in doubt the priority order is: failed > offline > pending.
 */
export function PendingSyncBanner({
  isOnline,
  pendingCount,
  isSyncing,
  onRetry,
  failedCount = 0,
}: PendingSyncBannerProps) {
  if (isOnline && pendingCount === 0 && !isSyncing && failedCount === 0)
    return null;

  const variant: BannerVariant =
    failedCount > 0 ? 'failed' : !isOnline ? 'offline' : 'pending';

  const containerClass =
    variant === 'failed'
      ? 'bg-rose-50 dark:bg-rose-500/8 border-rose-200 dark:border-rose-500/20'
      : variant === 'offline'
        ? 'bg-rose-50 dark:bg-rose-500/8 border-rose-200 dark:border-rose-500/20'
        : 'bg-amber-50 dark:bg-amber-500/8 border-amber-200 dark:border-amber-500/20';

  const iconBoxClass =
    variant === 'failed'
      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300'
      : variant === 'offline'
        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300'
        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300';

  const titleClass =
    variant === 'failed'
      ? 'text-rose-700 dark:text-rose-200'
      : variant === 'offline'
        ? 'text-rose-700 dark:text-rose-200'
        : 'text-amber-700 dark:text-amber-200';

  const subtitleClass =
    variant === 'failed'
      ? 'text-rose-600/80 dark:text-rose-300/80'
      : variant === 'offline'
        ? 'text-rose-600/80 dark:text-rose-300/80'
        : 'text-amber-600/80 dark:text-amber-300/80';

  let titleText: string;
  let subtitleText: string;
  if (variant === 'failed') {
    titleText = `${failedCount} ${failedCount === 1 ? 'batida falhou' : 'batidas falharam'}`;
    subtitleText = 'Toque para tentar novamente.';
  } else if (variant === 'offline') {
    titleText = 'Você está offline';
    subtitleText =
      pendingCount > 0
        ? `${pendingCount} ${pendingCount === 1 ? 'batida salva' : 'batidas salvas'} no dispositivo. Enviaremos quando reconectar.`
        : 'Suas batidas serão salvas no dispositivo até reconectar.';
  } else if (isSyncing) {
    titleText = 'Sincronizando batidas...';
    subtitleText = 'O envio acontece em segundo plano.';
  } else {
    titleText = `${pendingCount} ${
      pendingCount === 1 ? 'batida aguardando' : 'batidas aguardando'
    } envio`;
    subtitleText = 'O envio acontece em segundo plano.';
  }

  let IconElement: React.ReactNode;
  if (isSyncing && variant !== 'failed') {
    IconElement = <Loader2 className="size-4 animate-spin" />;
  } else if (variant === 'failed') {
    IconElement = <AlertTriangle className="size-4" />;
  } else {
    IconElement = <CloudOff className="size-4" />;
  }

  const showRetryButton =
    onRetry &&
    !isSyncing &&
    (variant === 'failed' || (isOnline && pendingCount > 0));

  const retryButtonClass =
    variant === 'failed'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : 'bg-amber-600 hover:bg-amber-700 text-white';

  return (
    <div
      data-testid="punch-pending-sync"
      data-sync-state={isSyncing ? 'syncing' : variant}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3 border',
        containerClass
      )}
    >
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-xl shrink-0',
          iconBoxClass
        )}
      >
        {IconElement}
      </span>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', titleClass)}>{titleText}</p>
        <p className={cn('text-xs', subtitleClass)}>{subtitleText}</p>
      </div>

      {showRetryButton && (
        <button
          type="button"
          onClick={onRetry}
          data-testid="punch-pending-sync-retry"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0',
            retryButtonClass
          )}
        >
          <RefreshCw className="size-3" />
          {variant === 'failed' ? 'Tentar novamente' : 'Enviar agora'}
        </button>
      )}
    </div>
  );
}
