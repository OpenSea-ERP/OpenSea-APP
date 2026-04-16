'use client';

import { cn } from '@/lib/utils';
import type { RecurrenceUnit } from '@/types/finance';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import {
  buildRecurrenceDescription,
  computeNextOccurrences,
  formatRelativeToNow,
} from '@/lib/finance/recurrence';

interface RecurrencePreviewProps {
  frequencyUnit: RecurrenceUnit;
  frequencyInterval: number;
  startDate: string;
  endDate?: string;
  totalOccurrences?: number;
  count?: number;
  className?: string;
}

export function RecurrencePreview({
  frequencyUnit,
  frequencyInterval,
  startDate,
  endDate,
  totalOccurrences,
  count = 5,
  className,
}: RecurrencePreviewProps) {
  const { description, occurrences } = useMemo(() => {
    if (!startDate) return { description: '', occurrences: [] as Date[] };
    const spec = {
      frequencyUnit,
      frequencyInterval,
      startDate,
      endDate: endDate || null,
      totalOccurrences: totalOccurrences || null,
    };
    return {
      description: buildRecurrenceDescription(spec),
      occurrences: computeNextOccurrences(spec, count),
    };
  }, [
    frequencyUnit,
    frequencyInterval,
    startDate,
    endDate,
    totalOccurrences,
    count,
  ]);

  if (!startDate) return null;

  const now = new Date();

  return (
    <div
      data-testid="recurrence-preview"
      className={cn(
        'rounded-xl border border-violet-200 bg-violet-50/70 dark:border-violet-500/20 dark:bg-violet-500/5 p-3 space-y-2',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <p className="text-sm text-violet-900 dark:text-violet-100 leading-snug">
          {description}
        </p>
      </div>

      {occurrences.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center gap-1.5 pb-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-violet-600/70 dark:text-violet-400/70" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-700/70 dark:text-violet-300/70">
              Próximas {occurrences.length} ocorrências
            </span>
          </div>
          <ul className="space-y-0.5">
            {occurrences.map((d, idx) => {
              const iso = d.toISOString().split('T')[0];
              const absolute = format(parseISO(iso), "EEE, d 'de' MMM yyyy", {
                locale: ptBR,
              });
              const relative = formatRelativeToNow(d, now);
              return (
                <li
                  key={idx}
                  className="flex items-center justify-between text-[12px] px-2 py-1 rounded-md bg-white/60 dark:bg-white/5"
                >
                  <span className="text-violet-900 dark:text-violet-100 tabular-nums">
                    {absolute}
                  </span>
                  <span className="text-[11px] text-violet-700/70 dark:text-violet-300/70">
                    {relative}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
