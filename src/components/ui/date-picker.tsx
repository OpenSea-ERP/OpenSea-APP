'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  /**
   * Date value. Accepts either ISO 8601 string ("2026-04-16" or full ISO) or a
   * Date object. Use `null`/`undefined` for the empty state. The component is
   * format-agnostic on the way out — see `onChange`.
   */
  value?: Date | string | null;
  /**
   * Called with the picked date. Returns either a `Date` (when `valueFormat`
   * is `"date"`) or an ISO date string `YYYY-MM-DD` (when `"iso"`, default).
   * Pages migrating from `<input type="date">` should keep `valueFormat="iso"`
   * so the existing string-based state continues to work without churn.
   */
  onChange: (value: Date | string | null) => void;
  valueFormat?: 'iso' | 'date';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** Hide the clear button (useful when the field is required). */
  hideClear?: boolean;
  /** Optional minimum selectable date. */
  fromDate?: Date;
  /** Optional maximum selectable date. */
  toDate?: Date;
}

function parseValue(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? undefined : value;
  // Treat plain `YYYY-MM-DD` as local-noon to dodge timezone-walking that
  // would otherwise display the previous day in negative timezones.
  const isoLike = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00`
    : value;
  const parsed = new Date(isoLike);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toIso(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function DatePicker({
  value,
  onChange,
  valueFormat = 'iso',
  placeholder = 'Selecionar data',
  disabled = false,
  className,
  id,
  hideClear = false,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parsed = parseValue(value);

  const emit = React.useCallback(
    (next: Date | null) => {
      if (!next) return onChange(null);
      onChange(valueFormat === 'iso' ? toIso(next) : next);
    },
    [onChange, valueFormat]
  );

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      emit(date);
      setOpen(false);
    }
  };

  const display = parsed
    ? format(parsed, "dd 'de' MMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal h-9',
            !parsed && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          <span className="flex-1 truncate">{display ?? placeholder}</span>
          {!hideClear && parsed && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Limpar data"
              onClick={e => {
                e.stopPropagation();
                emit(null);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  emit(null);
                }
              }}
              className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 z-[60]"
        align="start"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={parsed}
          onSelect={handleSelect}
          locale={ptBR}
          autoFocus
          fromDate={fromDate}
          toDate={toDate}
        />
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => emit(null)}
            className="text-muted-foreground"
          >
            Limpar
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              emit(new Date());
              setOpen(false);
            }}
          >
            Hoje
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type { DatePickerProps };
