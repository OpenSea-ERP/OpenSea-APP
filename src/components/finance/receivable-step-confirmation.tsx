'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ReceivableWizardData } from './receivable-wizard-modal';

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    v
  );

const formatDate = (d: string) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

// =============================================================================
// TYPES
// =============================================================================

interface ReceivableStepConfirmationProps {
  data: ReceivableWizardData;
  onSubmit: () => void;
  isPending: boolean;
}

// =============================================================================
// FIELD ROW
// =============================================================================

function Field({ label, value }: { label: string; value: string }) {
  if (!value || value === '—') return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

// =============================================================================
// ENTRY MODE LABEL
// =============================================================================

function getEntryModeLabel(data: ReceivableWizardData): string {
  if (data.entryMode === 'NF') return 'Nota Fiscal (OCR)';
  if (data.subType === 'INVOICE') return 'Manual — Fatura';
  if (data.subType === 'BILL') return 'Manual — Duplicata';
  if (data.subType === 'SALARY') return 'Manual — Salário';
  if (data.subType === 'BONUS') return 'Manual — Bonificação';
  if (data.subType === 'REBATE') return 'Manual — Reembolso';
  return 'Manual';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ReceivableStepConfirmation({
  data,
  onSubmit,
  isPending,
}: ReceivableStepConfirmationProps) {
  const totalDue =
    data.expectedAmount + data.interest + data.penalty - data.discount;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* Tipo */}
        <div className="rounded-xl border p-4">
          <h4 className="text-sm font-semibold mb-2">Tipo</h4>
          <p className="text-sm text-muted-foreground">
            {getEntryModeLabel(data)}
          </p>
        </div>

        {/* Dados Gerais */}
        <div className="rounded-xl border p-4">
          <h4 className="text-sm font-semibold mb-3">Dados Gerais</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Descrição" value={data.description} />
            <Field label="Cliente" value={data.customerName} />
            <Field label="Categoria" value={data.categoryName} />
            <Field label="Centro de Custo" value={data.costCenterName} />
            <Field label="Conta Bancária" value={data.bankAccountName} />
          </div>
        </div>

        {/* Valores */}
        <div className="rounded-xl border p-4">
          <h4 className="text-sm font-semibold mb-3">Valores</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor" value={formatCurrency(data.expectedAmount)} />
            {data.interest > 0 && (
              <Field label="Juros" value={formatCurrency(data.interest)} />
            )}
            {data.penalty > 0 && (
              <Field label="Multa" value={formatCurrency(data.penalty)} />
            )}
            {data.discount > 0 && (
              <Field label="Desconto" value={formatCurrency(data.discount)} />
            )}
            <div className="col-span-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">Total a Receber</p>
              <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
                {formatCurrency(totalDue)}
              </p>
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="rounded-xl border p-4">
          <h4 className="text-sm font-semibold mb-3">Datas</h4>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Emissão" value={formatDate(data.issueDate)} />
            <Field label="Vencimento" value={formatDate(data.dueDate)} />
            <Field
              label="Competência"
              value={formatDate(data.competenceDate)}
            />
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

        {/* Observações */}
        {data.notes && (
          <div className="rounded-xl border p-4">
            <h4 className="text-sm font-semibold mb-2">Observações</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {data.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SUBMIT FOOTER (used as WizardStep.footer)
// =============================================================================

export function ReceivableConfirmationFooter({
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
        ← Voltar
      </Button>
      <Button
        type="button"
        onClick={onSubmit}
        disabled={isPending}
        className="h-9 px-2.5"
      >
        {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        Criar conta a receber
      </Button>
    </>
  );
}
