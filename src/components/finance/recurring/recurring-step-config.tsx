'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { FinanceEntryType, IndexationType, RecurrenceUnit } from '@/types/finance';
import { INDEXATION_TYPE_LABELS, MONTH_LABELS } from '@/types/finance';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { useState } from 'react';
import type { RecurringWizardData } from './recurring-wizard';

// =============================================================================
// TYPES
// =============================================================================

interface RecurringStepConfigProps {
  data: RecurringWizardData;
  onChange: (partial: Partial<RecurringWizardData>) => void;
}

// =============================================================================
// FREQUENCY OPTIONS
// =============================================================================

const FREQUENCY_OPTIONS: { value: RecurrenceUnit; label: string }[] = [
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quinzenal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'SEMIANNUAL', label: 'Semestral' },
  { value: 'ANNUAL', label: 'Anual' },
];

// =============================================================================
// FREQUENCY UNIT → interval label
// =============================================================================

function getIntervalLabel(unit: RecurrenceUnit): string {
  switch (unit) {
    case 'DAILY':
      return 'dia(s)';
    case 'WEEKLY':
      return 'semana(s)';
    case 'BIWEEKLY':
      return 'quinzena(s)';
    case 'MONTHLY':
      return 'mês(es)';
    case 'QUARTERLY':
      return 'trimestre(s)';
    case 'SEMIANNUAL':
      return 'semestre(s)';
    case 'ANNUAL':
      return 'ano(s)';
  }
}

// =============================================================================
// SECTION DIVIDER
// =============================================================================

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-3 pb-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
      <div className="flex-1 border-b border-border/40" />
    </div>
  );
}

// =============================================================================
// INLINE DATE PICKER
// =============================================================================

function InlineDatePicker({
  value,
  onChange,
  placeholder = 'Selecionar',
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}) {
  const dateValue = value ? parseISO(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-8',
            !dateValue && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
          {dateValue
            ? format(dateValue, 'dd/MM/yyyy', { locale: ptBR })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={date => {
            if (date) onChange(format(date, 'yyyy-MM-dd'));
          }}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RecurringStepConfig({
  data,
  onChange,
}: RecurringStepConfigProps) {
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

  return (
    <div className="space-y-1">
      {/* ================================================================= */}
      {/* TYPE TOGGLE                                                        */}
      {/* ================================================================= */}
      <SectionDivider label="Tipo" />

      <div className="grid grid-cols-2 gap-3 py-2">
        {(['PAYABLE', 'RECEIVABLE'] as FinanceEntryType[]).map(type => {
          const isSelected = data.type === type;
          const isPayable = type === 'PAYABLE';
          const colorClasses = isSelected
            ? isPayable
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50 dark:bg-rose-500/8'
              : 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8'
            : 'hover:border-muted-foreground/40';

          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ type })}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer text-left',
                colorClasses
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center h-10 w-10 rounded-lg',
                  isPayable
                    ? 'bg-rose-100 dark:bg-rose-500/15'
                    : 'bg-emerald-100 dark:bg-emerald-500/15'
                )}
              >
                {isPayable ? (
                  <ArrowDownLeft className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <p
                  className={cn(
                    'font-medium text-sm',
                    isSelected
                      ? isPayable
                        ? 'text-rose-700 dark:text-rose-300'
                        : 'text-emerald-700 dark:text-emerald-300'
                      : ''
                  )}
                >
                  {isPayable ? 'A Pagar' : 'A Receber'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isPayable ? 'Despesas recorrentes' : 'Receitas recorrentes'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* FREQUENCY                                                          */}
      {/* ================================================================= */}
      <SectionDivider label="Frequência" />

      <div className="grid grid-cols-4 gap-1.5 py-2">
        {FREQUENCY_OPTIONS.map(opt => {
          const isSelected = data.frequencyUnit === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ frequencyUnit: opt.value })}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border',
                isSelected
                  ? 'bg-violet-600 text-white border-violet-600 dark:bg-violet-500 dark:border-violet-500'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 py-1">
        <span className="text-sm text-muted-foreground shrink-0">A cada</span>
        <Input
          type="number"
          min={1}
          value={data.frequencyInterval}
          onChange={e =>
            onChange({ frequencyInterval: parseInt(e.target.value) || 1 })
          }
          className="h-8 w-20"
        />
        <span className="text-sm text-muted-foreground shrink-0">
          {getIntervalLabel(data.frequencyUnit)}
        </span>
      </div>

      {/* ================================================================= */}
      {/* OCCURRENCES                                                        */}
      {/* ================================================================= */}
      <SectionDivider label="Duração" />

      <div className="flex items-center gap-2 py-1">
        <span className="text-sm text-muted-foreground shrink-0">
          Total de ocorrências
        </span>
        <Input
          type="number"
          min={0}
          value={data.totalOccurrences}
          onChange={e =>
            onChange({ totalOccurrences: parseInt(e.target.value) || 0 })
          }
          className="h-8 w-20"
        />
        <span className="text-[11px] text-muted-foreground">
          (0 = infinita)
        </span>
      </div>

      {/* ================================================================= */}
      {/* DATES                                                              */}
      {/* ================================================================= */}
      <SectionDivider label="Período" />

      <div className="grid grid-cols-2 gap-3 py-1">
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">
            Data de início <span className="text-rose-500">*</span>
          </span>
          <InlineDatePicker
            value={data.startDate}
            onChange={d => onChange({ startDate: d })}
          />
        </div>
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">
            Data de término
          </span>
          <InlineDatePicker
            value={data.endDate}
            onChange={d => onChange({ endDate: d })}
            placeholder="Opcional"
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* AJUSTE AUTOMÁTICO (collapsible)                                    */}
      {/* ================================================================= */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setAdjustmentOpen(!adjustmentOpen)}
          className="flex items-center gap-2 w-full pt-3 pb-1"
        >
          <Sliders className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Ajuste Automático
          </span>
          <div className="flex-1 border-b border-border/40" />
          {adjustmentOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          )}
        </button>

        {adjustmentOpen && (
          <div className="space-y-3 py-2">
            {/* Indexação */}
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Indexação</span>
              <Select
                value={data.indexationType ?? 'NONE'}
                onValueChange={(v) =>
                  onChange({ indexationType: v as IndexationType })
                }
              >
                <SelectTrigger className="h-8 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INDEXATION_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Taxa fixa */}
            {data.indexationType === 'FIXED_RATE' && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">
                  Taxa anual (%)
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={data.fixedAdjustmentRate || ''}
                  onChange={(e) =>
                    onChange({
                      fixedAdjustmentRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-8 w-28"
                  placeholder="Ex: 5.5"
                />
              </div>
            )}

            {/* Mês de reajuste */}
            {data.indexationType !== 'NONE' && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">
                  Mês de Reajuste
                </span>
                <Select
                  value={String(data.adjustmentMonth ?? 1)}
                  onValueChange={(v) =>
                    onChange({ adjustmentMonth: parseInt(v) })
                  }
                >
                  <SelectTrigger className="h-8 w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MONTH_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Feriados */}
            <div className="flex items-center gap-2.5 py-1">
              <Switch
                checked={data.adjustBusinessDays ?? true}
                onCheckedChange={(v) => onChange({ adjustBusinessDays: v })}
                id="adjust-bdays"
              />
              <label
                htmlFor="adjust-bdays"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Ajustar vencimento para dia útil
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
