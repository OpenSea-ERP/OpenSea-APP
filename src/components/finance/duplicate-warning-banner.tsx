'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import type { DuplicateMatch } from '@/types/finance';

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (d: string) => {
  if (!d) return '—';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// =============================================================================
// TYPES
// =============================================================================

interface DuplicateWarningBannerProps {
  duplicates: DuplicateMatch[];
  isLoading: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DuplicateWarningBanner({
  duplicates,
  isLoading,
}: DuplicateWarningBannerProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Loader2 className="size-4 animate-spin" />
          <p className="text-sm font-medium">Verificando duplicidades...</p>
        </div>
      </div>
    );
  }

  if (duplicates.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="size-4 shrink-0" />
        <p className="text-sm font-semibold">
          Possíveis duplicidades encontradas
        </p>
      </div>

      <p className="text-xs text-amber-700/80 dark:text-amber-300/70">
        {duplicates.length === 1
          ? 'Foi encontrada 1 entrada similar no sistema. Verifique antes de prosseguir.'
          : `Foram encontradas ${duplicates.length} entradas similares no sistema. Verifique antes de prosseguir.`}
      </p>

      {/* Matches list */}
      <div className="space-y-2">
        {duplicates.map((match) => (
          <div
            key={match.entryId}
            className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate max-w-[70%]">
                {match.description}
              </p>
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-xs font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
                {match.score}% similar
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {match.supplierName && (
                <span>Fornecedor: {match.supplierName}</span>
              )}
              {match.customerName && (
                <span>Cliente: {match.customerName}</span>
              )}
              <span>Valor: {formatCurrency(match.expectedAmount)}</span>
              <span>Vencimento: {formatDate(match.dueDate)}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-1">
              {match.matchReasons.map((reason) => (
                <span
                  key={reason}
                  className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
