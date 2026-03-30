'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecurringPreview } from '@/hooks/finance';
import { FREQUENCY_LABELS } from '@/types/finance';
import type { RecurrenceUnit } from '@/types/finance';
import { addDays, addMonths, addWeeks, addYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck, Loader2 } from 'lucide-react';
import type { RecurringWizardData } from './recurring-wizard';

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v);

const formatDate = (d: string) => {
  if (!d) return '\u2014';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

function getFrequencyDescription(
  unit: RecurrenceUnit,
  interval: number
): string {
  const label = FREQUENCY_LABELS[unit];
  if (interval <= 1) return label;
  return `${label}, a cada ${interval}x`;
}

function computeNextDates(
  startDate: string,
  unit: RecurrenceUnit,
  interval: number,
  count: number
): Date[] {
  const dates: Date[] = [];
  let current = new Date(startDate + 'T12:00:00');
  for (let i = 0; i < count; i++) {
    dates.push(current);
    const n = interval;
    switch (unit) {
      case 'DAILY':
        current = addDays(current, n);
        break;
      case 'WEEKLY':
        current = addWeeks(current, n);
        break;
      case 'BIWEEKLY':
        current = addWeeks(current, n * 2);
        break;
      case 'MONTHLY':
        current = addMonths(current, n);
        break;
      case 'QUARTERLY':
        current = addMonths(current, n * 3);
        break;
      case 'SEMIANNUAL':
        current = addMonths(current, n * 6);
        break;
      case 'ANNUAL':
        current = addYears(current, n);
        break;
    }
  }
  return dates;
}

// =============================================================================
// TYPES
// =============================================================================

interface RecurringStepConfirmationProps {
  data: RecurringWizardData;
}

// =============================================================================
// FIELD ROW
// =============================================================================

function Field({ label, value }: { label: string; value: string }) {
  if (!value || value === '\u2014') return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RecurringStepConfirmation({
  data,
}: RecurringStepConfirmationProps) {
  const isPayable = data.type === 'PAYABLE';

  // Local fallback dates (used if server preview fails)
  const localDates = computeNextDates(
    data.startDate,
    data.frequencyUnit,
    data.frequencyInterval,
    3
  );

  // Server-side preview with holiday/weekend detection
  const { data: serverPreview, isLoading: previewLoading } =
    useRecurringPreview({
      startDate: data.startDate,
      frequency: data.frequencyUnit,
      interval: data.frequencyInterval,
      count: 12,
      adjustBusinessDays: data.adjustBusinessDays,
    });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* Configuracao */}
        <div className="rounded-xl border p-4">
          <h4 className="text-sm font-semibold mb-3">Configuracao</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tipo" value={isPayable ? 'A Pagar' : 'A Receber'} />
            <Field
              label="Frequencia"
              value={getFrequencyDescription(
                data.frequencyUnit,
                data.frequencyInterval
              )}
            />
            <Field
              label="Total de ocorrencias"
              value={
                data.totalOccurrences > 0
                  ? `${data.totalOccurrences} ocorrencias`
                  : 'Infinita'
              }
            />
            <Field
              label="Periodo"
              value={`${formatDate(data.startDate)}${data.endDate ? ` \u2014 ${formatDate(data.endDate)}` : ' \u2014 Indefinido'}`}
            />
          </div>
        </div>

        {/* Detalhes */}
        <div className="rounded-xl border p-4">
          <h4 className="text-sm font-semibold mb-3">Detalhes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Descricao" value={data.description} />
            <Field
              label={isPayable ? 'Fornecedor' : 'Cliente'}
              value={isPayable ? data.supplierName : data.customerName}
            />
            <Field label="Categoria" value={data.categoryName} />
            <Field
              label="Valor Esperado"
              value={formatCurrency(data.expectedAmount)}
            />
            <Field label="Conta Bancaria" value={data.bankAccountName} />
            <Field label="Centro de Custo" value={data.costCenterName} />
            {data.interestRate > 0 && (
              <Field label="Juros" value={`${data.interestRate}% ao mes`} />
            )}
            {data.penaltyRate > 0 && (
              <Field label="Multa" value={`${data.penaltyRate}%`} />
            )}
          </div>
        </div>

        {/* Tags */}
        {data.tags.length > 0 && (
          <div className="rounded-xl border p-4">
            <h4 className="text-sm font-semibold mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-xs text-violet-600 dark:text-violet-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="rounded-xl border p-4">
            <h4 className="text-sm font-semibold mb-2">Observacoes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {data.notes}
            </p>
          </div>
        )}

        {/* Preview: Server-side dates with holiday/weekend info */}
        <div className="rounded-xl border p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-violet-500" />
            Previsao de lancamentos
          </h4>

          {previewLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          )}

          {serverPreview && serverPreview.dates.length > 0 && (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {serverPreview.dates.map((d, i) => {
                const displayDate = d.adjustedDate || d.date;
                const [y, m, day] = displayDate.split('-');
                const formattedDate = `${day}/${m}/${y}`;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-medium w-5">
                        #{i + 1}
                      </span>
                      <span className="text-sm">{formattedDate}</span>
                      <div className="flex items-center gap-1.5">
                        {d.isHoliday && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300 border-0"
                          >
                            {d.holidayName || 'Feriado'}
                          </Badge>
                        )}
                        {d.isWeekend && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-slate-50 dark:bg-slate-500/8 text-slate-600 dark:text-slate-400 border-0"
                          >
                            Fim de semana
                          </Badge>
                        )}
                        {d.adjustedDate && (
                          <span className="text-[10px] text-muted-foreground italic">
                            Ajustado
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium tabular-nums ${
                        isPayable
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isPayable ? '- ' : '+ '}
                      {formatCurrency(data.expectedAmount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback to local dates if server preview unavailable */}
          {!previewLoading && !serverPreview && (
            <div className="space-y-2">
              {localDates.map((date, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-medium w-5">
                      #{i + 1}
                    </span>
                    <span className="text-sm">
                      {format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium tabular-nums ${
                      isPayable
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isPayable ? '- ' : '+ '}
                    {formatCurrency(data.expectedAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CUSTOM FOOTER
// =============================================================================

export function RecurringConfirmationFooter({
  onSubmit,
  isPending,
  onBack,
}: {
  onSubmit: () => void;
  isPending: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <Button type="button" variant="outline" onClick={onBack}>
        \u2190 Voltar
      </Button>
      <Button
        type="button"
        onClick={onSubmit}
        disabled={isPending}
        className="h-9 px-2.5"
      >
        {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        Criar recorrência
      </Button>
    </>
  );
}
