'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Scale,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { usePermissions } from '@/hooks/use-permissions';
import { useTrialBalance } from '@/hooks/finance';
import type { TrialBalanceAccount } from '@/types/finance';
import { cn } from '@/lib/utils';

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getDefaultDateRange() {
  const today = new Date();
  const firstDay = startOfMonth(today);
  return {
    from: format(firstDay, 'yyyy-MM-dd'),
    to: format(today, 'yyyy-MM-dd'),
  };
}

function isParentAccount(code: string, allCodes: string[]): boolean {
  return allCodes.some(c => c !== code && c.startsWith(code + '.'));
}

function getParentCode(code: string): string | null {
  const lastDot = code.lastIndexOf('.');
  if (lastDot < 0) return null;
  return code.substring(0, lastDot);
}

// =============================================================================
// EXPORT CSV
// =============================================================================

function exportCsv(
  accounts: TrialBalanceAccount[],
  period: { from: string; to: string }
) {
  const header = ['Código', 'Conta', 'Nível', 'Débito', 'Crédito', 'Saldo'];
  const rows = accounts.map(acc => [
    acc.code,
    acc.name,
    String(acc.level),
    acc.debitTotal.toFixed(2).replace('.', ','),
    acc.creditTotal.toFixed(2).replace('.', ','),
    acc.balance.toFixed(2).replace('.', ','),
  ]);

  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(';'))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `balancete_${period.from}_${period.to}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function TrialBalanceSkeleton() {
  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// TABLE ROW
// =============================================================================

interface TrialBalanceRowProps {
  account: TrialBalanceAccount;
  isParent: boolean;
  isCollapsed: boolean;
  isHidden: boolean;
  onToggle: (code: string) => void;
}

function TrialBalanceRow({
  account,
  isParent,
  isCollapsed,
  isHidden,
  onToggle,
}: TrialBalanceRowProps) {
  if (isHidden) return null;

  const balanceColor =
    account.balance > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : account.balance < 0
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-muted-foreground';

  return (
    <tr
      className={cn(
        'border-b border-border/30 transition-colors hover:bg-muted/30',
        isParent && 'font-semibold bg-slate-50/50 dark:bg-slate-800/20'
      )}
    >
      {/* Código */}
      <td className="px-4 py-2.5 whitespace-nowrap">
        <span className="font-mono text-sm text-muted-foreground">
          {account.code}
        </span>
      </td>

      {/* Conta */}
      <td className="px-4 py-2.5">
        <div
          className="flex items-center gap-1"
          style={{ paddingLeft: `${account.level * 24}px` }}
        >
          {isParent ? (
            <button
              onClick={() => onToggle(account.code)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isCollapsed ? 'Expandir' : 'Recolher'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 flex-shrink-0" />
          )}
          <span
            className={cn(
              'text-sm',
              isParent ? 'font-semibold text-foreground' : 'text-foreground/80'
            )}
          >
            {account.name}
          </span>
        </div>
      </td>

      {/* Débito */}
      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        <span
          className={cn(
            'font-mono text-sm tabular-nums',
            account.debitTotal > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground'
          )}
        >
          {formatCurrency(account.debitTotal)}
        </span>
      </td>

      {/* Crédito */}
      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        <span
          className={cn(
            'font-mono text-sm tabular-nums',
            account.creditTotal > 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-muted-foreground'
          )}
        >
          {formatCurrency(account.creditTotal)}
        </span>
      </td>

      {/* Saldo */}
      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        <span
          className={cn(
            'font-mono text-sm tabular-nums font-medium',
            balanceColor
          )}
        >
          {formatCurrency(account.balance)}
        </span>
      </td>
    </tr>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function TrialBalancePage() {
  const { hasPermission } = usePermissions();

  const defaults = useMemo(() => getDefaultDateRange(), []);
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [queryParams, setQueryParams] = useState<{
    dateFrom: string;
    dateTo: string;
  }>({
    dateFrom: defaults.from,
    dateTo: defaults.to,
  });

  const { data, isLoading, error } = useTrialBalance({
    dateFrom: queryParams.dateFrom,
    dateTo: queryParams.dateTo,
  });

  // Track collapsed parent accounts
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((code: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  const handleConsultar = useCallback(() => {
    setQueryParams({ dateFrom, dateTo });
    setCollapsed(new Set());
  }, [dateFrom, dateTo]);

  // Compute parent flags
  const accountCodes = useMemo(
    () => (data?.accounts ?? []).map(a => a.code),
    [data]
  );

  const parentSet = useMemo(() => {
    const set = new Set<string>();
    accountCodes.forEach(code => {
      if (isParentAccount(code, accountCodes)) {
        set.add(code);
      }
    });
    return set;
  }, [accountCodes]);

  // Determine hidden rows (child of a collapsed parent)
  const hiddenSet = useMemo(() => {
    const hidden = new Set<string>();
    (data?.accounts ?? []).forEach(acc => {
      // Walk up through all ancestor codes
      let code = acc.code;
      let parent = getParentCode(code);
      while (parent !== null) {
        if (collapsed.has(parent) && parentSet.has(parent)) {
          hidden.add(acc.code);
          break;
        }
        code = parent;
        parent = getParentCode(code);
      }
    });
    return hidden;
  }, [data, collapsed, parentSet]);

  const isBalanced =
    data && Math.abs(data.totals.debit - data.totals.credit) < 0.01;

  const formattedFrom = dateFrom
    ? format(new Date(dateFrom + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : '';
  const formattedTo = dateTo
    ? format(new Date(dateTo + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : '';

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Relatórios', href: '/finance/reports' },
          { label: 'Balancete de Verificação' },
        ]}
        hasPermission={hasPermission}
      />

      {/* Filter Bar */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="date-from"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Período — De
              </Label>
              <DatePicker
                id="date-from"
                value={dateFrom}
                onChange={v => setDateFrom(typeof v === 'string' ? v : '')}
                className="w-44"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="date-to"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Até
              </Label>
              <DatePicker
                id="date-to"
                value={dateTo}
                onChange={v => setDateTo(typeof v === 'string' ? v : '')}
                className="w-44"
              />
            </div>

            <Button
              onClick={handleConsultar}
              disabled={!dateFrom || !dateTo || isLoading}
              className="h-9 px-4 text-sm"
            >
              Consultar
            </Button>

            {data && (
              <Button
                variant="outline"
                className="h-9 px-3 text-sm gap-2 ml-auto"
                onClick={() => exportCsv(data.accounts, data.period)}
              >
                <Download className="h-3.5 w-3.5" />
                Exportar CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && <TrialBalanceSkeleton />}

      {/* Error */}
      {error && !isLoading && (
        <Card className="bg-white dark:bg-slate-800/60 border border-border">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-rose-500 opacity-50" />
            <p className="text-muted-foreground">
              Erro ao carregar o balancete. Tente novamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data */}
      {data && !isLoading && (
        <>
          {/* Period + Balance indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Período:{' '}
              <span className="font-medium text-foreground">
                {formattedFrom}
              </span>{' '}
              até{' '}
              <span className="font-medium text-foreground">{formattedTo}</span>
            </div>

            {isBalanced ? (
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30 px-3 py-1 text-sm gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Balancete Equilibrado
              </Badge>
            ) : (
              <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300 border-rose-200 dark:border-rose-800/30 px-3 py-1 text-sm gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Balancete Desequilibrado
              </Badge>
            )}
          </div>

          {/* Table */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap w-32">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Conta
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap w-36">
                      Débito
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap w-36">
                      Crédito
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap w-36">
                      Saldo
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.accounts.map(account => (
                    <TrialBalanceRow
                      key={account.id}
                      account={account}
                      isParent={parentSet.has(account.code)}
                      isCollapsed={collapsed.has(account.code)}
                      isHidden={hiddenSet.has(account.code)}
                      onToggle={handleToggle}
                    />
                  ))}
                </tbody>

                {/* Footer total row */}
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-700/50 border-t-2 border-border font-bold">
                    <td
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-foreground"
                      colSpan={2}
                    >
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(data.totals.debit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400">
                        {formatCurrency(data.totals.credit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span
                        className={cn(
                          'font-mono tabular-nums',
                          isBalanced
                            ? 'text-muted-foreground'
                            : 'text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {formatCurrency(data.totals.debit - data.totals.credit)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Empty state */}
      {!data && !isLoading && !error && (
        <Card className="bg-white dark:bg-slate-800/60 border border-border">
          <CardContent className="py-12 text-center">
            <Scale className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              Nenhum dado contábil encontrado no período.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
