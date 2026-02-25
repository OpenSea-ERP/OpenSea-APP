'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface RecurrencePickerProps {
  value: string | null;
  onChange: (rrule: string | null) => void;
}

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const WEEKDAYS = [
  { value: 'MO', label: 'Se' },
  { value: 'TU', label: 'Te' },
  { value: 'WE', label: 'Qa' },
  { value: 'TH', label: 'Qi' },
  { value: 'FR', label: 'Sx' },
  { value: 'SA', label: 'Sá' },
  { value: 'SU', label: 'Do' },
];

const WEEKDAY_TOOLTIPS: Record<string, string> = {
  MO: 'Segunda',
  TU: 'Terça',
  WE: 'Quarta',
  TH: 'Quinta',
  FR: 'Sexta',
  SA: 'Sábado',
  SU: 'Domingo',
};

const FREQUENCY_LABELS: Record<Frequency, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
};

const FREQUENCY_SUFFIX: Record<Frequency, string> = {
  DAILY: 'dia(s)',
  WEEKLY: 'semana(s)',
  MONTHLY: 'mês(es)',
  YEARLY: 'ano(s)',
};

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
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

  return (
    <div className="space-y-3">
      {/* Frequency + Interval row */}
      <div className="flex items-center gap-3">
        <Select
          value={frequency}
          onValueChange={(val) => handleFrequencyChange(val as Frequency)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(FREQUENCY_LABELS) as [Frequency, string][]).map(
              ([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">a cada</span>

        <Input
          type="number"
          min={1}
          max={99}
          value={interval}
          onChange={(e) => handleIntervalChange(Number(e.target.value))}
          className="w-16 text-center"
        />

        <span className="text-sm text-muted-foreground">
          {FREQUENCY_SUFFIX[frequency]}
        </span>
      </div>

      {/* Weekday selector (only for WEEKLY) */}
      {frequency === 'WEEKLY' && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Repetir nos dias</Label>
          <ToggleGroup
            type="multiple"
            value={weekdays}
            onValueChange={handleWeekdaysChange}
            className="justify-start gap-1"
          >
            {WEEKDAYS.map((day) => (
              <ToggleGroupItem
                key={day.value}
                value={day.value}
                size="sm"
                className="w-9 h-8 text-xs rounded-full p-0"
                title={WEEKDAY_TOOLTIPS[day.value]}
              >
                {day.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {/* Repetition count */}
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">
          Repetições
        </Label>
        <Input
          type="number"
          min={1}
          max={365}
          value={count ?? ''}
          placeholder="Sem limite"
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined;
            handleCountChange(val);
          }}
          className="w-24"
        />
      </div>
    </div>
  );
}
