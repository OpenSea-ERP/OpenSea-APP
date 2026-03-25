/**
 * Budget vs Actual Report Page
 * Compara orçamento planejado vs realizado por categoria de despesa.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  PieChart,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { usePermissions } from '@/hooks/use-permissions';
import { useBudgetReport } from '@/hooks/finance/use-budgets';
import { BudgetConfigModal } from '@/components/finance/budget-config-modal';
import type { BudgetReportRow, BudgetStatus } from '@/types/finance';
import {
  BUDGET_STATUS_LABELS,
  BUDGET_STATUS_COLORS,
} from '@/types/finance';
import { cn } from '@/lib/utils';

// ============================================================================
// HELPERS
// ============================================================================

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const MONTHS = [
  { value: '0', label: 'Ano Completo' },
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function StatusBadge({ status }: { status: BudgetStatus }) {
  const colors = BUDGET_STATUS_COLORS[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium border',
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      {BUDGET_STATUS_LABELS[status]}
    </Badge>
  );
}

// ============================================================================
// BUDGET BAR
// ============================================================================

function BudgetBar({
  budgeted,
  actual,
  status,
}: {
  budgeted: number;
  actual: number;
  status: BudgetStatus;
}) {
  if (budgeted <= 0) return null;

  const ratio = Math.min(actual / budgeted, 1.5);
  const barPercent = Math.min(ratio * 100, 100);
  const barColor =
    status === 'OVER_BUDGET'
      ? 'bg-rose-500'
      : status === 'ON_BUDGET'
        ? 'bg-sky-500'
        : 'bg-emerald-500';

  return (
    <div className="relative w-full h-3 rounded-full bg-muted overflow-hidden">
      {/* Budget line at 100% */}
      <div className="absolute right-0 top-0 h-full w-px bg-muted-foreground/30 z-10" />
      {/* Actual fill */}
      <div
        className={cn('h-full rounded-full transition-all', barColor)}
        style={{ width: `${barPercent}%` }}
      />
    </div>
  );
}

// ============================================================================
// TABLE ROW (COLLAPSIBLE)
// ============================================================================

function BudgetTableRow({
  row,
  depth = 0,
}: {
  row: BudgetReportRow;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = row.children && row.children.length > 0;

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
        <td className="py-2.5 px-3">
          <div
            className="flex items-center gap-1.5"
            style={{ paddingLeft: `${depth * 20}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="p-0.5 hover:bg-muted rounded"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-4.5" />
            )}
            <span
              className={cn(
                'text-sm',
                depth === 0 ? 'font-semibold' : 'font-normal'
              )}
            >
              {row.categoryName}
            </span>
          </div>
        </td>
        <td className="py-2.5 px-3 text-right text-sm font-mono">
          {formatCurrency(row.budgeted)}
        </td>
        <td className="py-2.5 px-3 text-right text-sm font-mono">
          {formatCurrency(row.actual)}
        </td>
        <td className="py-2.5 px-3 text-right text-sm font-mono">
          <span
            className={cn(
              row.variationAmount > 0
                ? 'text-rose-600 dark:text-rose-400'
                : row.variationAmount < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
            )}
          >
            {formatCurrency(row.variationAmount)}
          </span>
        </td>
        <td className="py-2.5 px-3 text-right text-sm font-mono">
          <span
            className={cn(
              row.variationPercent > 0
                ? 'text-rose-600 dark:text-rose-400'
                : row.variationPercent < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
            )}
          >
            {formatPercent(row.variationPercent)}
          </span>
        </td>
        <td className="py-2.5 px-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-[80px]">
              <BudgetBar
                budgeted={row.budgeted}
                actual={row.actual}
                status={row.status}
              />
            </div>
            <StatusBadge status={row.status} />
          </div>
        </td>
      </tr>
      {hasChildren &&
        expanded &&
        row.children!.map((child) => (
          <BudgetTableRow key={child.categoryId} row={child} depth={depth + 1} />
        ))}
    </>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function BudgetLoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function BudgetVsActualPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);

  const { data, isLoading } = useBudgetReport({
    year,
    month: month > 0 ? month : undefined,
  });

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const totals = data?.totals;

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Relatórios', href: '/finance/reports' },
          { label: 'Orçamento vs Realizado' },
        ]}
        hasPermission={hasPermission}
        buttons={[
          {
            id: 'config',
            title: 'Configurar Orçamentos',
            icon: Settings,
            variant: 'outline',
            onClick: () => setConfigOpen(true),
          },
        ]}
      />

      {/* Period Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/finance/reports')}
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <PieChart className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Orçamento vs Realizado</h1>
            <p className="text-sm text-muted-foreground">
              Comparação entre planejado e executado por categoria
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-28 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Orçado
              </p>
              <p className="text-xl font-bold font-mono mt-1">
                {formatCurrency(totals.budgeted)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Realizado
              </p>
              <p className="text-xl font-bold font-mono mt-1">
                {formatCurrency(totals.actual)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Variação
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p
                  className={cn(
                    'text-xl font-bold font-mono',
                    totals.variationAmount > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : totals.variationAmount < 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : ''
                  )}
                >
                  {formatCurrency(totals.variationAmount)}
                </p>
                <StatusBadge status={totals.status} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <BudgetLoadingSkeleton />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <PieChart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              Nenhum orçamento configurado para este período.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setConfigOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar Orçamentos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalhamento por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Categoria
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Orçamento
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Realizado
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Variação (R$)
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Variação (%)
                    </th>
                    <th className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[200px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <BudgetTableRow key={row.categoryId} row={row} />
                  ))}
                  {/* Totals row */}
                  {totals && (
                    <tr className="border-t-2 border-border bg-muted/50 font-bold">
                      <td className="py-3 px-3 text-sm">Total</td>
                      <td className="py-3 px-3 text-right text-sm font-mono">
                        {formatCurrency(totals.budgeted)}
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-mono">
                        {formatCurrency(totals.actual)}
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-mono">
                        <span
                          className={cn(
                            totals.variationAmount > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : totals.variationAmount < 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : ''
                          )}
                        >
                          {formatCurrency(totals.variationAmount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-mono">
                        <span
                          className={cn(
                            totals.variationPercent > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : totals.variationPercent < 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : ''
                          )}
                        >
                          {formatPercent(totals.variationPercent)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={totals.status} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Config Modal */}
      <BudgetConfigModal
        open={configOpen}
        onOpenChange={setConfigOpen}
        year={year}
      />
    </div>
  );
}
