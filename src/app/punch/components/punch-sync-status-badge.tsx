'use client';

/**
 * PunchSyncStatusBadge — small status badge for individual punch entries.
 *
 * Phase 8 / Plan 08-03 / Task 1 (D-04, D-10).
 *
 * Renders a 5×5 colored pill with an icon mirroring the sync state of a
 * pending or persisted TimeEntry. Used inside `TodayHistory` (one badge per
 * row) and anywhere a row-level sync status needs to surface visually.
 *
 * Why not a shadcn `<Tooltip>`? We use the native `title` HTML attribute so
 * the hint also works on touch (long-press) without forcing the Radix tooltip
 * runtime onto every history row.
 */

import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Cloud, Loader2 } from 'lucide-react';

export type PunchSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

interface PunchSyncStatusBadgeProps {
  status: PunchSyncStatus;
  className?: string;
}

const COLOR_MAP: Record<PunchSyncStatus, string> = {
  pending:
    'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300',
  syncing: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300',
  synced:
    'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  failed: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300',
};

const ICON_MAP: Record<PunchSyncStatus, typeof Cloud> = {
  pending: Cloud,
  syncing: Loader2,
  synced: CheckCircle2,
  failed: AlertCircle,
};

const TOOLTIP_MAP: Record<PunchSyncStatus, string> = {
  pending: 'Aguardando envio',
  syncing: 'Enviando...',
  synced: 'Sincronizada',
  failed: 'Falha ao sincronizar — toque para tentar novamente',
};

export function PunchSyncStatusBadge({
  status,
  className,
}: PunchSyncStatusBadgeProps) {
  const Icon = ICON_MAP[status];
  return (
    <span
      data-testid={`punch-sync-status-${status}`}
      title={TOOLTIP_MAP[status]}
      aria-label={TOOLTIP_MAP[status]}
      className={cn(
        'flex size-5 items-center justify-center rounded-md shrink-0',
        COLOR_MAP[status],
        className
      )}
    >
      <Icon
        className={cn('size-3', status === 'syncing' && 'animate-spin')}
        aria-hidden="true"
      />
    </span>
  );
}
