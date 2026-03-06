'use client';

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface RecurrencePickerProps {
  value: string | null;
  onChange: (rrule: string | null) => void;
  accentColor?: string;
  titleSlot?: React.ReactNode;
}

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const WEEKDAYS = [
  { value: 'MO', label: 'Seg', full: 'Segunda' },
  { value: 'TU', label: 'Ter', full: 'Terça' },
  { value: 'WE', label: 'Qua', full: 'Quarta' },
  { value: 'TH', label: 'Qui', full: 'Quinta' },
  { value: 'FR', label: 'Sex', full: 'Sexta' },
  { value: 'SA', label: 'Sáb', full: 'Sábado' },
  { value: 'SU', label: 'Dom', full: 'Domingo' },
];

const FREQUENCIES: { value: Frequency; label: string; suffix: string }[] = [
  { value: 'DAILY', label: 'Dia', suffix: 'dia(s)' },
  { value: 'WEEKLY', label: 'Semana', suffix: 'semana(s)' },
  { value: 'MONTHLY', label: 'Mês', suffix: 'mês(es)' },
  { value: 'YEARLY', label: 'Ano', suffix: 'ano(s)' },
];

export function RecurrencePicker({ value, onChange, accentColor = '#3b82f6', titleSlot }: RecurrencePickerProps) {
  const [frequency, setFrequency] = useState<Frequency>('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [weekdays, setWeekdays] = useState<string[]>([]);
  const [count, setCount] = useState<number | undefined>(undefined);

  // Parse existing RRULE value on mount
  useEffect(() => {
    if (!value) return;
    const match = value.replace('RRULE:', '');
    const parts = Object.fromEntries(
      match.split(';').map((p) => p.split('=')),
    );
    if (parts.FREQ) setFrequency(parts.FREQ as Frequency);
    if (parts.INTERVAL) setInterval(Number(parts.INTERVAL));
    if (parts.BYDAY) setWeekdays(parts.BYDAY.split(','));
    if (parts.COUNT) setCount(Number(parts.COUNT));
  }, []);

  const emitRRule = useCallback(
    (f: Frequency, i: number, d: string[], c: number | undefined) => {
      const parts = [`FREQ=${f}`];
      if (i > 1) parts.push(`INTERVAL=${i}`);
      if (f === 'WEEKLY' && d.length > 0) parts.push(`BYDAY=${d.join(',')}`);
      if (c) parts.push(`COUNT=${c}`);
      onChange(`RRULE:${parts.join(';')}`);
    },
    [onChange],
  );

  // Emit initial value on mount
  useEffect(() => {
    if (!value) {
      emitRRule(frequency, interval, weekdays, count);
    }
  }, []);

  const handleFrequencyChange = (val: Frequency) => {
    setFrequency(val);
    const newDays = val === 'WEEKLY' ? weekdays : [];
    emitRRule(val, interval, newDays, count);
  };

  const handleIntervalChange = (val: number) => {
    const v = Math.max(1, Math.min(99, val || 1));
    setInterval(v);
    emitRRule(frequency, v, weekdays, count);
  };

  const handleWeekdaysChange = (val: string[]) => {
    setWeekdays(val);
    emitRRule(frequency, interval, val, count);
  };

  const handleCountChange = (val: number | undefined) => {
    setCount(val);
    emitRRule(frequency, interval, weekdays, val);
  };

  const currentFreq = FREQUENCIES.find((f) => f.value === frequency)!;

  return (
    <div className="space-y-3">
      {/* Header: title (left) + frequency chips (right) */}
      <div className="flex items-center gap-2">
        {titleSlot && <div className="flex-1 min-w-0">{titleSlot}</div>}
        <div className={cn('flex gap-1', !titleSlot && 'w-full')}>
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFrequencyChange(f.value)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all',
                frequency === f.value
                  ? 'text-white shadow-sm'
                  : 'bg-muted/60 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10',
              )}
              style={frequency === f.value ? { backgroundColor: accentColor } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interval row */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">A cada</span>
        <Input
          type="number"
          min={1}
          max={99}
          value={interval}
          onChange={(e) => handleIntervalChange(Number(e.target.value))}
          className="w-16 h-8 text-center text-sm px-1 [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-muted-foreground">{currentFreq.suffix}</span>

        {/* Count */}
        <span className="text-xs text-muted-foreground ml-auto">por</span>
        <Input
          type="number"
          min={1}
          max={365}
          value={count ?? ''}
          placeholder="∞"
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined;
            handleCountChange(val);
          }}
          className="w-16 h-8 text-center text-sm px-1 [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-muted-foreground">vezes</span>
      </div>

      {/* Weekday selector (only for WEEKLY) */}
      {frequency === 'WEEKLY' && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Nos dias:</span>
          <div className="rounded-md border border-border/60 bg-muted/30 dark:bg-white/[0.03] p-1.5">
            <ToggleGroup
              type="multiple"
              value={weekdays}
              onValueChange={handleWeekdaysChange}
              className="w-full gap-1"
            >
              {WEEKDAYS.map((day) => (
                <ToggleGroupItem
                  key={day.value}
                  value={day.value}
                  size="sm"
                  className={cn(
                    'flex-1 h-8 rounded-md p-0 text-xs font-medium transition-all',
                    weekdays.includes(day.value) && 'text-white',
                  )}
                  style={
                    weekdays.includes(day.value)
                      ? { backgroundColor: accentColor, borderColor: accentColor }
                      : undefined
                  }
                  title={day.full}
                >
                  {day.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      )}
    </div>
  );
}
