'use client';

import { cn } from '@/lib/utils';
import type { TimeEntry } from '@/types/hr';
import { Activity, Coffee, Pause, Timer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface JourneyTimerProps {
  /** All time entries for the current employee from "today only". */
  todayEntries: TimeEntry[];
  /** Whether the current session is open (CLOCK_IN without matching CLOCK_OUT). */
  isWorking: boolean;
}

/**
 * Live elapsed time of the user's working day. Adds up paired CLOCK_IN/OUT
 * intervals and, when a session is currently open, ticks forward in
 * real time so the user sees the counter advance second by second.
 */
export function JourneyTimer({ todayEntries, isWorking }: JourneyTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isWorking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isWorking]);

  const { workedMs, openedAtMs } = useMemo(
    () => calculateWorkedMs(todayEntries, now),
    [todayEntries, now]
  );

  const formatted = formatHms(workedMs);
  const sessionStart = openedAtMs
    ? new Date(openedAtMs).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      data-testid="punch-timer"
      className={cn(
        'rounded-2xl border px-5 py-4 flex items-center gap-4',
        'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
      )}
    >
      <div
        className={cn(
          'flex size-12 items-center justify-center rounded-xl shrink-0',
          isWorking
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
            : 'bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400'
        )}
      >
        {isWorking ? (
          <Activity className="size-6" />
        ) : todayEntries.length === 0 ? (
          <Timer className="size-6" />
        ) : (
          <Pause className="size-6" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium">
          {isWorking
            ? 'Trabalhando agora'
            : todayEntries.length === 0
              ? 'Jornada não iniciada'
              : 'Jornada pausada'}
        </p>
        <p
          className={cn(
            'font-mono tabular-nums text-3xl font-bold tracking-tight leading-tight',
            isWorking
              ? 'text-emerald-600 dark:text-emerald-300'
              : 'text-slate-700 dark:text-slate-200'
          )}
          data-testid="punch-timer-value"
        >
          {formatted}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
          <Coffee className="size-3" />
          {sessionStart
            ? `Aberta desde ${sessionStart}`
            : todayEntries.length === 0
              ? 'Toque no botão para iniciar'
              : 'Aguardando próxima entrada'}
        </p>
      </div>
    </div>
  );
}

function calculateWorkedMs(
  entries: TimeEntry[],
  nowMs: number
): { workedMs: number; openedAtMs: number | null } {
  if (entries.length === 0) return { workedMs: 0, openedAtMs: null };

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let total = 0;
  let openedAtMs: number | null = null;

  for (const entry of sorted) {
    const ts = new Date(entry.timestamp).getTime();
    if (entry.entryType === 'CLOCK_IN' || entry.entryType === 'BREAK_END') {
      if (openedAtMs === null) openedAtMs = ts;
    } else if (
      entry.entryType === 'CLOCK_OUT' ||
      entry.entryType === 'BREAK_START'
    ) {
      if (openedAtMs !== null) {
        total += Math.max(0, ts - openedAtMs);
        openedAtMs = null;
      }
    }
  }

  if (openedAtMs !== null) {
    total += Math.max(0, nowMs - openedAtMs);
  }

  return { workedMs: total, openedAtMs };
}

function formatHms(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(value => value.toString().padStart(2, '0'))
    .join(':');
}
