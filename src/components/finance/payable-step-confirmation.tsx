'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCheckDuplicate } from '@/hooks/finance/use-check-duplicate';
import { DuplicateWarningBanner } from './duplicate-warning-banner';
import type { PayableWizardData } from './payable-wizard-modal';

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

interface PayableStepConfirmationProps {
  data: PayableWizardData;
  isBatch: boolean;
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
// SINGLE ENTRY SUMMARY
// =============================================================================

function SingleSummary({ data }: { data: PayableWizardData }) {
  const totalDue =
    data.expectedAmount + data.interest + data.penalty - data.discount;

  const paymentLabel =
    data.paymentType === 'BOLETO' ? 'Boleto Bancário' : 'Pix / Transferência';

  return (
    <div className="space-y-4">
      {/* Tipo */}
      <div className="rounded-xl border p-4">
        <h4 className="text-sm font-semibold mb-2">Tipo</h4>
        <p className="text-sm text-muted-foreground">
          {paymentLabel}
          {data.bankName ? ` · ${data.bankName}` : ''}
        </p>
      </div>

      {/* Dados Gerais */}
      <div className="rounded-xl border p-4">
        <h4 className="text-sm font-semibold mb-3">Dados Gerais</h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Descrição" value={data.description} />
          <Field label="Beneficiário" value={data.beneficiaryName} />
          <Field label="Fornecedor" value={data.supplierName} />
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
            <p className="text-xs text-muted-foreground">Total Devido</p>
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
          <Field label="Competência" value={formatDate(data.competenceDate)} />
        </div>
      </div>

      {/* Parcelamento */}
      {data.installmentEnabled && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/5 p-4">
          <h4 className="text-sm font-semibold mb-3">Parcelamento</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Parcelas"
              value={`${data.totalInstallments}x de ${formatCurrency(data.expectedAmount / data.totalInstallments)}`}
            />
            <Field
              label="Frequência"
              value={
                data.recurrenceUnit === 'MONTHLY'
                  ? 'Mensal'
                  : data.recurrenceUnit === 'BIWEEKLY'
                    ? 'Quinzenal'
                    : 'Semanal'
              }
            />
          </div>
        </div>
      )}

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
  );
}

// =============================================================================
// BATCH SUMMARY
// =============================================================================

function BatchSummary({ data }: { data: PayableWizardData }) {
  const total = data.batchEntries.reduce((sum, e) => sum + e.expectedAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {data.batchEntries.length} contas a pagar
        </p>
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-300">
          Total: {formatCurrency(total)}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                #
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                Beneficiário
              </th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">
                Valor
              </th>
              <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">
                Vencimento
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.batchEntries.map((entry, i) => (
              <tr key={entry.id}>
                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2">{entry.beneficiaryName || '—'}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCurrency(entry.expectedAmount)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatDate(entry.dueDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Common fields */}
      <div className="rounded-xl border p-4">
        <h4 className="text-sm font-semibold mb-3">Campos em Comum</h4>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria" value={data.categoryName} />
          <Field label="Centro de Custo" value={data.costCenterName} />
          <Field label="Conta Bancária" value={data.bankAccountName} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PayableStepConfirmation({
  data,
  isBatch,
  onSubmit,
  isPending,
}: PayableStepConfirmationProps) {
  const {
    mutate: checkDuplicate,
    data: duplicateResult,
    isPending: isCheckingDuplicates,
  } = useCheckDuplicate();

  // Check for duplicates when this step mounts (single entry only)
  useEffect(() => {
    if (!isBatch && data.expectedAmount > 0 && data.dueDate) {
      checkDuplicate({
        supplierName: data.supplierName || undefined,
        expectedAmount: data.expectedAmount,
        dueDate: data.dueDate,
        description: data.description || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* Duplicate detection banner */}
        {!isBatch && (
          <DuplicateWarningBanner
            duplicates={duplicateResult?.duplicates ?? []}
            isLoading={isCheckingDuplicates}
          />
        )}

        {isBatch ? <BatchSummary data={data} /> : <SingleSummary data={data} />}
      </div>
    </div>
  );
}

// =============================================================================
// SUBMIT FOOTER (used as WizardStep.footer)
// =============================================================================

export function PayableConfirmationFooter({
  isBatch,
  entryCount,
  onSubmit,
  isPending,
  onBack,
}: {
  isBatch: boolean;
  entryCount: number;
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
        {isBatch ? `Criar ${entryCount} contas` : 'Criar conta a pagar'}
      </Button>
    </>
  );
}
