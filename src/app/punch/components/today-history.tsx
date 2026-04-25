'use client';

import { cn } from '@/lib/utils';
import type { TimeEntry } from '@/types/hr';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Coffee,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import {
  PunchSyncStatusBadge,
  type PunchSyncStatus,
} from './punch-sync-status-badge';

/**
 * Phase 8 / Plan 08-03 / Task 1 (D-04 + D-07 + D-10).
 *
 * `TimeEntry` enriched with two PWA-only virtual fields:
 *
 * - `syncStatus`: 'pending' | 'syncing' | 'synced' | 'failed' — surfaced as a
 *   `<PunchSyncStatusBadge>` per row. Calculated by the parent (which merges
 *   server-side entries with IDB-pending entries from `useOfflinePunch`).
 * - `canJustify`: boolean — when true, the row exposes an inline link to
 *   `/punch/justify/{id}` so the employee can self-justify exceptions
 *   (e.g. missed punches, geofence rejections, face-match retries).
 *
 * Both fields are optional so legacy rows that don't carry them stay rendering
 * as today.
 */
export interface TimeEntryWithSync extends TimeEntry {
  syncStatus?: PunchSyncStatus;
  canJustify?: boolean;
}

interface TodayHistoryProps {
  entries: TimeEntryWithSync[];
  /**
   * Phase 8 / Plan 08-03: when used inside `/punch/history` (extended view),
   * the list is purely informational — the inline "Justificar" CTA is
   * suppressed because the user is browsing past data, not resolving the
   * current day. `/punch` keeps the default actionable behaviour.
   */
  readOnly?: boolean;
}

const TYPE_LABEL: Record<TimeEntry['entryType'], string> = {
  CLOCK_IN: 'Entrada',
  CLOCK_OUT: 'Saída',
  BREAK_START: 'Início da pausa',
  BREAK_END: 'Fim da pausa',
  OVERTIME_START: 'Início da hora extra',
  OVERTIME_END: 'Fim da hora extra',
};

export function TodayHistory({ entries, readOnly = false }: TodayHistoryProps) {
  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [entries]
  );

  if (sorted.length === 0) return null;

  return (
    <section
      aria-label="Registros de hoje"
      data-testid="punch-today-history"
      className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 overflow-hidden"
    >
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700/60">
        <History className="size-4 text-slate-500 dark:text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {readOnly ? 'Histórico' : 'Hoje'}
        </h2>
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {sorted.length} {sorted.length === 1 ? 'batida' : 'batidas'}
        </span>
      </header>

      <ul className="divide-y divide-slate-100 dark:divide-slate-700/40">
        {sorted.map(entry => {
          const time = new Date(entry.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const Icon =
            entry.entryType === 'CLOCK_IN'
              ? ArrowDownToLine
              : entry.entryType === 'CLOCK_OUT'
                ? ArrowUpFromLine
                : Coffee;
          const colorClass = colorFor(entry.entryType);
          return (
            <li
              key={entry.id}
              className="flex items-center gap-3 px-4 py-2.5"
              data-testid="punch-today-history-row"
            >
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-lg shrink-0',
                  colorClass
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {TYPE_LABEL[entry.entryType] ?? entry.entryType}
                </p>
                {entry.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {entry.notes}
                  </p>
                )}
              </div>
              {entry.syncStatus && (
                <PunchSyncStatusBadge status={entry.syncStatus} />
              )}
              <span className="font-mono tabular-nums text-sm font-semibold text-slate-700 dark:text-slate-200">
                {time}
              </span>
              {!readOnly && entry.canJustify && (
                <Link
                  href={`/punch/justify/${entry.id}`}
                  data-testid="punch-justify-link"
                  className="text-xs font-semibold text-violet-600 dark:text-violet-300 hover:underline"
                >
                  Justificar
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function colorFor(type: TimeEntry['entryType']): string {
  switch (type) {
    case 'CLOCK_IN':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300';
    case 'CLOCK_OUT':
      return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300';
    case 'BREAK_START':
    case 'BREAK_END':
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300';
    default:
      return 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-300';
  }
}
