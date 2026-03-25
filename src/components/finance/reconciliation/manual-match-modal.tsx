'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useReconciliationSuggestions } from '@/hooks/finance/use-reconciliation';
import type {
  ReconciliationItem,
  ReconciliationMatchSuggestion,
} from '@/types/finance';
import { cn } from '@/lib/utils';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Check,
  Loader2,
  Search,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ManualMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliationId: string;
  item: ReconciliationItem | null;
  onMatch: (entryId: string) => void;
  isMatching?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getConfidenceBadge(confidence: number) {
  if (confidence >= 90)
    return {
      label: 'Alta',
      color:
        'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    };
  if (confidence >= 70)
    return {
      label: 'Média',
      color:
        'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    };
  return {
    label: 'Baixa',
    color:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ManualMatchModal({
  open,
  onOpenChange,
  reconciliationId,
  item,
  onMatch,
  isMatching,
}: ManualMatchModalProps) {
  const [search, setSearch] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const { data: suggestionsData, isLoading: isLoadingSuggestions } =
    useReconciliationSuggestions(
      reconciliationId,
      item?.id ?? ''
    );

  const suggestions = suggestionsData?.suggestions ?? [];

  const filteredSuggestions = useMemo(() => {
    if (!search.trim()) return suggestions;
    const q = search.toLowerCase();
    return suggestions.filter(
      s =>
        s.entryCode?.toLowerCase().includes(q) ||
        s.entryDescription?.toLowerCase().includes(q) ||
        s.supplierName?.toLowerCase().includes(q) ||
        s.customerName?.toLowerCase().includes(q)
    );
  }, [suggestions, search]);

  const handleConfirm = useCallback(() => {
    if (selectedEntryId) {
      onMatch(selectedEntryId);
    }
  }, [selectedEntryId, onMatch]);

  const handleClose = useCallback(() => {
    setSearch('');
    setSelectedEntryId(null);
    onOpenChange(false);
  }, [onOpenChange]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vincular Transação</DialogTitle>
          <DialogDescription>
            Selecione o lançamento financeiro correspondente a esta transação
            bancária.
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Summary */}
        <div className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate pr-4">
              {item.description}
            </span>
            <span
              className={cn(
                'text-sm font-bold font-mono whitespace-nowrap',
                item.transactionType === 'CREDIT'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {item.transactionType === 'CREDIT' ? '+' : '-'}
              {formatCurrency(Math.abs(item.amount))}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(item.date)}
            </span>
            {item.memo && <span className="truncate">{item.memo}</span>}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, descrição, fornecedor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Suggestions List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
          {isLoadingSuggestions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhum lançamento compatível encontrado.
            </div>
          ) : (
            filteredSuggestions.map(suggestion => (
              <SuggestionRow
                key={suggestion.entryId}
                suggestion={suggestion}
                isSelected={selectedEntryId === suggestion.entryId}
                onClick={() => setSelectedEntryId(suggestion.entryId)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedEntryId || isMatching}
          >
            {isMatching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Vinculando...
              </>
            ) : (
              'Confirmar Vínculo'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// SUGGESTION ROW
// ============================================================================

function SuggestionRow({
  suggestion,
  isSelected,
  onClick,
}: {
  suggestion: ReconciliationMatchSuggestion;
  isSelected: boolean;
  onClick: () => void;
}) {
  const badge = getConfidenceBadge(suggestion.confidence);
  const isCredit = suggestion.entryType === 'RECEIVABLE';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-colors',
        isSelected
          ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/8 ring-1 ring-sky-500'
          : 'border-border hover:bg-muted/50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            {isSelected && (
              <Check className="h-4 w-4 text-sky-500 shrink-0" />
            )}
            <span className="text-sm font-medium truncate">
              {suggestion.entryDescription}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {suggestion.entryCode && (
              <span className="font-mono">{suggestion.entryCode}</span>
            )}
            {(suggestion.supplierName || suggestion.customerName) && (
              <span className="truncate">
                {suggestion.supplierName || suggestion.customerName}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={cn(
              'text-sm font-bold font-mono',
              isCredit
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {formatCurrency(suggestion.entryAmount)}
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(suggestion.entryDueDate)}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border',
                badge.color
              )}
            >
              {Math.round(suggestion.confidence)}% {badge.label}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
