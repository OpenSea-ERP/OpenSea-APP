'use client';

import { cn } from '@/lib/utils';
import { Flame, Sparkles } from 'lucide-react';

interface StreakCounterProps {
  /** Number of consecutive on-time working days. */
  days: number;
  /** Personal record (highest streak the user ever reached). */
  record?: number;
}

/**
 * Gamified streak chip — encourages a daily punch habit (Sólides Ponto-style).
 * Renders a flame icon with the day count and an optional personal record.
 * Hidden when streak is zero so first-time users don't see a "0 days" badge.
 */
export function StreakCounter({ days, record }: StreakCounterProps) {
  if (days <= 0) return null;

  const isOnFire = days >= 5;
  const isRecord = record !== undefined && days >= record;

  return (
    <div
      data-testid="punch-streak"
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-1.5',
        'border font-medium text-sm',
        isOnFire
          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300'
          : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
      )}
    >
      <Flame
        className={cn(
          'size-4',
          isOnFire
            ? 'text-amber-500 dark:text-amber-300'
            : 'text-slate-400 dark:text-slate-500'
        )}
      />
      <span className="tabular-nums">
        {days} {days === 1 ? 'dia' : 'dias'} seguidos pontual
      </span>
      {isRecord && (
        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-300 font-semibold">
          <Sparkles className="size-3" />
          recorde
        </span>
      )}
    </div>
  );
}
