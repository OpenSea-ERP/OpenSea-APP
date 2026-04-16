'use client';

import { cn } from '@/lib/utils';
import type { ReconciliationItem } from '@/types/finance';
import { ArrowDown, ArrowUp, Scale } from 'lucide-react';
import { useMemo } from 'react';

interface ReconciliationBalanceWidgetProps {
  items: ReconciliationItem[];
  totalCredits: number;
  totalDebits: number;
  className?: string;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function ReconciliationBalanceWidget({
  items,
  totalCredits,
  totalDebits,
  className,
}: ReconciliationBalanceWidgetProps) {
  const { statementNet, reconciledNet, difference } = useMemo(() => {
    const statementNet = totalCredits - totalDebits;

    const reconciledNet = items
      .filter(i => i.status === 'MATCHED' || i.status === 'CREATED')
      .reduce((sum, i) => {
        const signed =
          i.transactionType === 'CREDIT'
            ? Math.abs(i.amount)
            : -Math.abs(i.amount);
        return sum + signed;
      }, 0);

    const difference = statementNet - reconciledNet;
    return { statementNet, reconciledNet, difference };
  }, [items, totalCredits, totalDebits]);

  const hasDifference = Math.abs(difference) > 0.01;

  return (
    <div
      data-testid="reconciliation-balance-widget"
      className={cn(
        'rounded-xl border border-border bg-muted/30 dark:bg-slate-900/40 p-4',
        className
      )}
    >
      <div className="flex items-center gap-2 pb-3">
        <Scale className="h-4 w-4 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Confronto de saldos
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Statement (OFX) */}
        <div className="rounded-lg bg-white dark:bg-slate-800/60 p-3 border border-border/60">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Extrato (OFX)
          </p>
          <p
            className={cn(
              'text-lg font-bold font-mono tabular-nums mt-1',
              statementNet >= 0
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-rose-700 dark:text-rose-300'
            )}
            data-testid="balance-statement-net"
          >
            {statementNet >= 0 ? '+' : ''}
            {formatBRL(statementNet)}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <ArrowUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              {formatBRL(totalCredits)}
            </span>
            <span className="flex items-center gap-0.5">
              <ArrowDown className="h-3 w-3 text-rose-600 dark:text-rose-400" />
              {formatBRL(totalDebits)}
            </span>
          </div>
        </div>

        {/* Ledger (reconciled) */}
        <div className="rounded-lg bg-white dark:bg-slate-800/60 p-3 border border-border/60">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Razão conciliado
          </p>
          <p
            className={cn(
              'text-lg font-bold font-mono tabular-nums mt-1',
              reconciledNet >= 0
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-rose-700 dark:text-rose-300'
            )}
            data-testid="balance-reconciled-net"
          >
            {reconciledNet >= 0 ? '+' : ''}
            {formatBRL(reconciledNet)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Transações já vinculadas
          </p>
        </div>

        {/* Difference */}
        <div
          className={cn(
            'rounded-lg p-3 border',
            hasDifference
              ? 'bg-rose-50 dark:bg-rose-500/8 border-rose-200 dark:border-rose-500/20'
              : 'bg-emerald-50 dark:bg-emerald-500/8 border-emerald-200 dark:border-emerald-500/20'
          )}
        >
          <p
            className={cn(
              'text-[10px] uppercase tracking-wider font-semibold',
              hasDifference
                ? 'text-rose-700 dark:text-rose-300'
                : 'text-emerald-700 dark:text-emerald-300'
            )}
          >
            Diferença
          </p>
          <p
            className={cn(
              'text-lg font-bold font-mono tabular-nums mt-1',
              hasDifference
                ? 'text-rose-700 dark:text-rose-300'
                : 'text-emerald-700 dark:text-emerald-300'
            )}
            data-testid="balance-difference"
          >
            {difference > 0 ? '+' : ''}
            {formatBRL(difference)}
          </p>
          <p
            className={cn(
              'text-[11px] mt-1',
              hasDifference
                ? 'text-rose-700/80 dark:text-rose-300/80'
                : 'text-emerald-700/80 dark:text-emerald-300/80'
            )}
          >
            {hasDifference ? 'Ainda falta conciliar' : 'Saldos batem'}
          </p>
        </div>
      </div>
    </div>
  );
}
