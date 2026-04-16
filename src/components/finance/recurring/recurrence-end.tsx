'use client';

import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CalendarX, Hash, Infinity } from 'lucide-react';

export type RecurrenceEndMode = 'NEVER' | 'DATE' | 'AFTER_N';

interface RecurrenceEndProps {
  mode: RecurrenceEndMode;
  endDate: string;
  totalOccurrences: number;
  onChange: (next: {
    mode: RecurrenceEndMode;
    endDate: string;
    totalOccurrences: number;
  }) => void;
}

export function deriveEndMode(
  endDate: string | null | undefined,
  totalOccurrences: number | null | undefined
): RecurrenceEndMode {
  if (totalOccurrences && totalOccurrences > 0) return 'AFTER_N';
  if (endDate) return 'DATE';
  return 'NEVER';
}

const OPTIONS: {
  value: RecurrenceEndMode;
  label: string;
  description: string;
  icon: typeof Infinity;
}[] = [
  {
    value: 'NEVER',
    label: 'Nunca',
    description: 'Repete indefinidamente',
    icon: Infinity,
  },
  {
    value: 'DATE',
    label: 'Em uma data',
    description: 'Termina em uma data específica',
    icon: CalendarX,
  },
  {
    value: 'AFTER_N',
    label: 'Após N ocorrências',
    description: 'Gera um número fixo de lançamentos',
    icon: Hash,
  },
];

export function RecurrenceEnd({
  mode,
  endDate,
  totalOccurrences,
  onChange,
}: RecurrenceEndProps) {
  return (
    <div className="space-y-3" data-testid="recurrence-end">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {OPTIONS.map(opt => {
          const selected = mode === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`recurrence-end-${opt.value.toLowerCase()}`}
              onClick={() => {
                if (opt.value === 'NEVER')
                  onChange({ mode: 'NEVER', endDate: '', totalOccurrences: 0 });
                else if (opt.value === 'DATE')
                  onChange({ mode: 'DATE', endDate, totalOccurrences: 0 });
                else
                  onChange({
                    mode: 'AFTER_N',
                    endDate: '',
                    totalOccurrences:
                      totalOccurrences > 0 ? totalOccurrences : 12,
                  });
              }}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer',
                selected
                  ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50 dark:bg-violet-500/8'
                  : 'hover:border-muted-foreground/40'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  selected
                    ? 'bg-violet-100 dark:bg-violet-500/15'
                    : 'bg-muted/50'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    selected
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-muted-foreground'
                  )}
                />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    selected && 'text-violet-700 dark:text-violet-300'
                  )}
                >
                  {opt.label}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {mode === 'DATE' && (
        <div className="pl-2">
          <DatePicker
            value={endDate}
            onChange={v =>
              onChange({
                mode: 'DATE',
                endDate: typeof v === 'string' ? v : '',
                totalOccurrences: 0,
              })
            }
            placeholder="Selecionar data de término"
          />
        </div>
      )}

      {mode === 'AFTER_N' && (
        <div className="flex items-center gap-2 pl-2">
          <span className="text-sm text-muted-foreground shrink-0">Após</span>
          <Input
            type="number"
            min={1}
            value={totalOccurrences || ''}
            onChange={e =>
              onChange({
                mode: 'AFTER_N',
                endDate: '',
                totalOccurrences: parseInt(e.target.value) || 0,
              })
            }
            className="h-8 w-24"
            data-testid="recurrence-end-n"
          />
          <span className="text-sm text-muted-foreground shrink-0">
            {totalOccurrences === 1 ? 'ocorrência' : 'ocorrências'}
          </span>
        </div>
      )}
    </div>
  );
}
