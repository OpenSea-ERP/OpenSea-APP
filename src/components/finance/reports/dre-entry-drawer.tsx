'use client';

import { useRef, useCallback, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFinanceEntriesInfinite } from '@/hooks/finance/use-finance-entries';
import type { FinanceEntry, FinanceEntryStatus } from '@/types/finance';
import { FINANCE_ENTRY_STATUS_LABELS } from '@/types/finance';
import { Receipt, FileX2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface DreEntryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
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
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatPeriod(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function getStatusColor(status: FinanceEntryStatus): string {
  const colors: Record<FinanceEntryStatus, string> = {
    PENDING:
      'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
    OVERDUE:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
    PAID: 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    RECEIVED:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    PARTIALLY_PAID:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    CANCELLED:
      'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
    SCHEDULED:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  };
  return colors[status] ?? colors.PENDING;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function EntrySkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-[40%]" />
          <Skeleton className="h-4 w-[20%]" />
          <Skeleton className="h-4 w-[15%]" />
          <Skeleton className="h-4 w-[15%]" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-3 rounded-full bg-muted mb-4">
        <FileX2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">Nenhum lançamento encontrado</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Não há lançamentos pagos ou recebidos para esta categoria no período selecionado.
      </p>
    </div>
  );
}

// ============================================================================
// ENTRY ROW
// ============================================================================

function EntryRow({ entry }: { entry: FinanceEntry }) {
  const counterparty = entry.supplierName || entry.customerName || '—';

  return (
    <TableRow className="text-sm">
      <TableCell className="max-w-[180px]">
        <div className="truncate font-medium" title={entry.description}>
          {entry.description}
        </div>
        <div className="truncate text-xs text-muted-foreground" title={counterparty}>
          {counterparty}
        </div>
      </TableCell>
      <TableCell className="text-right font-mono whitespace-nowrap">
        {formatCurrency(entry.actualAmount ?? entry.expectedAmount)}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap text-muted-foreground">
        {formatDate(entry.dueDate)}
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className={getStatusColor(entry.status)}>
          {FINANCE_ENTRY_STATUS_LABELS[entry.status]}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DreEntryDrawer({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  startDate,
  endDate,
  totalAmount,
}: DreEntryDrawerProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    entries,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFinanceEntriesInfinite(
    {
      categoryId,
      dueDateFrom: startDate,
      dueDateTo: endDate,
      status: 'PAID,RECEIVED',
      sortBy: 'dueDate',
      sortOrder: 'desc',
    },
    { enabled: open && !!categoryId }
  );

  // Infinite scroll observer
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
              <Receipt className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">{categoryName}</SheetTitle>
              <SheetDescription className="text-sm">
                {formatPeriod(startDate, endDate)}
              </SheetDescription>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300"
            >
              {total} lançamento{total !== 1 ? 's' : ''}
            </Badge>
            <span className="text-lg font-bold font-mono">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <EntrySkeleton />
          ) : entries.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                Carregando mais...
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
