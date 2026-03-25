'use client';

import { Button } from '@/components/ui/button';
import { FREQUENCY_LABELS } from '@/types/finance';
import type { RecurrenceUnit } from '@/types/finance';
import { addDays, addMonths, addWeeks, addYears, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
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
  const nextDates = computeNextDates(
    data.startDate,
    data.frequencyUnit,
    data.frequencyInterval,
    3
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* Configuração */}
        <div className="rounded-xl border p-4">
          <h4 className="text-sm font-semibold mb-3">Configuração</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Tipo"
              value={isPayable ? 'A Pagar' : 'A Receber'}
            />
            <Field
              label="Frequência"
              value={getFrequencyDescription(
                data.frequencyUnit,
                data.frequencyInterval
              )}
            />
            <Field
              label="Total de ocorrências"
              value={
                data.totalOccurrences > 0
                  ? `${data.totalOccurrences} ocorrências`
                  : 'Infinita'
              }
            />
            <Field
              label="Período"
              value={`${formatDate(data.startDate)}${data.endDate ? ` \u2014 ${formatDate(data.endDate)}` : ' \u2014 Indefinido'}`}
            />
          </div>
        </div>

        {/* Detalhes */}
        <div className="rounded-xl border p-4">
          <h4 className="text-sm font-semibold mb-3">Detalhes</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Descrição" value={data.description} />
            <Field
              label={isPayable ? 'Fornecedor' : 'Cliente'}
              value={isPayable ? data.supplierName : data.customerName}
            />
            <Field label="Categoria" value={data.categoryName} />
            <Field
              label="Valor Esperado"
              value={formatCurrency(data.expectedAmount)}
            />
            <Field label="Conta Bancária" value={data.bankAccountName} />
            <Field label="Centro de Custo" value={data.costCenterName} />
            {data.interestRate > 0 && (
              <Field label="Juros" value={`${data.interestRate}% ao mês`} />
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
            <h4 className="text-sm font-semibold mb-2">Observações</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {data.notes}
            </p>
          </div>
        )}

        {/* Preview: Next 3 entries */}
        <div className="rounded-xl border p-4">
          <h4 className="text-sm font-semibold mb-3">
            Próximos 3 lançamentos
          </h4>
          <div className="space-y-2">
            {nextDates.map((date, i) => (
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
