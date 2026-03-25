'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useBankAccounts,
  useCostCenters,
  useFinanceCategories,
  useFinanceSuppliers,
} from '@/hooks/finance';
import { cn } from '@/lib/utils';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import type { BatchEntry, PayableWizardData } from './payable-wizard-modal';

// ============================================================================
// TYPES
// ============================================================================

interface PayableBatchTableProps {
  data: PayableWizardData;
  onChange: (partial: Partial<PayableWizardData>) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

// ============================================================================
// COMPONENT
// ============================================================================

export function PayableBatchTable({ data, onChange }: PayableBatchTableProps) {
  const { data: suppliersData } = useFinanceSuppliers();
  const { data: categoriesData } = useFinanceCategories({ type: 'EXPENSE' });
  const { data: costCentersData } = useCostCenters();
  const { data: bankAccountsData } = useBankAccounts();

  const suppliers = suppliersData?.suppliers ?? [];
  const categories = categoriesData?.categories ?? [];
  const costCenters = costCentersData?.costCenters ?? [];
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];

  const total = useMemo(
    () => data.batchEntries.reduce((sum, e) => sum + (e.expectedAmount || 0), 0),
    [data.batchEntries]
  );

  function updateBatchEntry(
    index: number,
    field: keyof BatchEntry,
    value: string | number | boolean
  ) {
    const updated = [...data.batchEntries];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ batchEntries: updated });
  }

  function removeBatchEntry(index: number) {
    const updated = data.batchEntries.filter((_, i) => i !== index);
    onChange({ batchEntries: updated });
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold">
            {data.batchEntries.length} boletos extraídos
          </p>
          <p className="text-xs text-muted-foreground">
            Edite diretamente na tabela
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Total: {formatCurrency(total)}
        </div>
      </div>

      {/* Table container */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="max-h-[280px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
              <tr>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-8">#</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[140px]">Beneficiário</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[130px]">Fornecedor</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[100px]">Valor</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[120px]">Vencimento</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[70px]">Juros</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[70px]">Multa</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[70px]">Desconto</th>
                <th className="px-2 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {data.batchEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={cn(
                    'border-t transition-colors',
                    entry.hasWarning
                      ? 'border border-amber-500/30 bg-amber-500/[0.03]'
                      : 'border border-border/50'
                  )}
                >
                  <td className="px-2 py-1.5">
                    <span className="inline-flex items-center justify-center size-5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    {entry.beneficiaryName ? (
                      <input
                        type="text"
                        value={entry.beneficiaryName}
                        onChange={(e) => updateBatchEntry(index, 'beneficiaryName', e.target.value)}
                        className="w-full bg-transparent border-0 outline-none text-sm px-1 py-0.5 rounded focus:bg-muted/50 focus:ring-1 focus:ring-ring/30"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value=""
                          placeholder="Nome do beneficiário"
                          onChange={(e) => updateBatchEntry(index, 'beneficiaryName', e.target.value)}
                          className="w-full bg-transparent border-0 outline-none text-sm px-1 py-0.5 rounded focus:bg-muted/50 focus:ring-1 focus:ring-ring/30 placeholder:text-muted-foreground/50"
                        />
                        {entry.hasWarning && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[10px] font-medium whitespace-nowrap">
                            <AlertTriangle className="size-3" />
                            Não extraído
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={entry.supplierId}
                      onChange={(e) => {
                        const supplier = suppliers.find((s) => s.id === e.target.value);
                        updateBatchEntry(index, 'supplierId', e.target.value);
                        if (supplier) {
                          updateBatchEntry(index, 'supplierName', supplier.name);
                        }
                      }}
                      className="w-full bg-transparent border-0 outline-none text-sm px-1 py-0.5 rounded cursor-pointer focus:bg-muted/50 focus:ring-1 focus:ring-ring/30 text-foreground"
                    >
                      <option value="">Selecionar...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entry.expectedAmount || ''}
                      onChange={(e) => updateBatchEntry(index, 'expectedAmount', parseFloat(e.target.value) || 0)}
                      className={cn(
                        'w-full bg-transparent border-0 outline-none text-sm px-1 py-0.5 rounded focus:bg-muted/50 focus:ring-1 focus:ring-ring/30',
                        entry.expectedAmount > 0 && 'text-violet-600 dark:text-violet-400 font-medium'
                      )}
                      placeholder="0,00"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="date"
                      value={entry.dueDate}
                      onChange={(e) => updateBatchEntry(index, 'dueDate', e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-sm px-1 py-0.5 rounded focus:bg-muted/50 focus:ring-1 focus:ring-ring/30"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number" step="0.01" min="0"
                      value={entry.interest || ''}
                      onChange={(e) => updateBatchEntry(index, 'interest', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent border-0 outline-none text-sm px-1 py-0.5 rounded focus:bg-muted/50 focus:ring-1 focus:ring-ring/30"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number" step="0.01" min="0"
                      value={entry.penalty || ''}
                      onChange={(e) => updateBatchEntry(index, 'penalty', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent border-0 outline-none text-sm px-1 py-0.5 rounded focus:bg-muted/50 focus:ring-1 focus:ring-ring/30"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number" step="0.01" min="0"
                      value={entry.discount || ''}
                      onChange={(e) => updateBatchEntry(index, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent border-0 outline-none text-sm px-1 py-0.5 rounded focus:bg-muted/50 focus:ring-1 focus:ring-ring/30"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => removeBatchEntry(index)}
                      className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remover boleto"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campos em comum */}
      <div className="mt-4 p-4 rounded-xl border border-border/50 bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground mb-3">
          Campos em comum (aplicados a todos)
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Categoria <span className="text-rose-500">*</span>
            </label>
            <Select
              value={data.categoryId}
              onValueChange={(value) => {
                const cat = categories.find((c) => c.id === value);
                onChange({ categoryId: value, categoryName: cat?.name ?? '' });
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Centro de Custo
            </label>
            <Select
              value={data.costCenterId || '__none__'}
              onValueChange={(value) => {
                const cc = costCenters.find((c) => c.id === value);
                onChange({
                  costCenterId: value === '__none__' ? '' : value,
                  costCenterName: cc?.name ?? '',
                });
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">Nenhum</SelectItem>
                {costCenters.map((cc) => (
                  <SelectItem key={cc.id} value={cc.id} className="text-xs">
                    {cc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Conta Bancária
            </label>
            <Select
              value={data.bankAccountId || '__none__'}
              onValueChange={(value) => {
                const ba = bankAccounts.find((a) => a.id === value);
                onChange({
                  bankAccountId: value === '__none__' ? '' : value,
                  bankAccountName: ba?.name ?? '',
                });
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">Nenhuma</SelectItem>
                {bankAccounts.map((ba) => (
                  <SelectItem key={ba.id} value={ba.id} className="text-xs">
                    {ba.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Tags</label>
            <Input
              value={data.tags.join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                onChange({ tags });
              }}
              placeholder="Separar por vírgula"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Observações
            </label>
            <Textarea
              value={data.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="Observações gerais..."
              className="h-8 min-h-8 text-xs resize-none"
              rows={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
