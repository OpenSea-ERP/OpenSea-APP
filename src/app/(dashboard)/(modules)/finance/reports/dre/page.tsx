/**
 * DRE — Demonstração do Resultado do Exercício.
 *
 * Annual income statement: paid receivable lançamentos minus paid payable
 * lançamentos in the calendar year, with a 12-month breakdown chart and a
 * traditional table view.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { useDreAnnual } from '@/hooks/finance/use-reports';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  Percent,
  RotateCw,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - 4 + i);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1).replace('.', ',')}%`;
}

export default function DREPage() {
  const { hasPermission } = usePermissions();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading, error, refetch, isFetching } = useDreAnnual(year);

  // Bar chart scale: max absolute value across revenue/expenses for the year
  const monthlyMax = data
    ? Math.max(...data.monthly.flatMap(m => [m.revenue, m.expenses]), 1)
    : 1;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Relatórios', href: '/finance/reports' },
            { label: 'DRE' },
          ]}
          hasPermission={hasPermission}
        />
      </PageHeader>

      <PageBody>
        <PageHeroBanner
          title="DRE — Demonstração do Resultado"
          description="Resultado do exercício do ano selecionado: receitas e despesas realizadas, resultado líquido e margem. Detalhamento mês a mês para identificar sazonalidade."
          icon={FileText}
          iconGradient="from-violet-500 to-indigo-600"
          buttons={[]}
          hasPermission={hasPermission}
        />

        {/* Year selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="space-y-2">
                <Label htmlFor="dre-year">Exercício</Label>
                <Select
                  value={String(year)}
                  onValueChange={v => setYear(Number(v))}
                >
                  <SelectTrigger id="dre-year" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map(y => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error state */}
        {error && (
          <Card className="border-rose-200 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-500/5">
            <CardContent className="p-8 text-center space-y-3">
              <AlertCircle className="h-10 w-10 mx-auto text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-semibold text-rose-900 dark:text-rose-200">
                  Não foi possível carregar a DRE
                </p>
                <p className="text-sm text-rose-800 dark:text-rose-300">
                  {error instanceof Error
                    ? error.message
                    : 'Erro ao consultar o resultado do exercício.'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RotateCw
                  className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')}
                />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {isLoading && !data && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary KPIs */}
        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Receita Bruta
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(data.totalRevenue)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Despesas
                    </span>
                  </div>
                  <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                    {formatCurrency(data.totalExpenses)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Resultado Líquido
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-xl font-bold font-mono',
                      data.netResult >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {formatCurrency(data.netResult)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Margem Líquida
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-xl font-bold font-mono',
                      data.netMargin >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {formatPercent(data.netMargin)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly breakdown — bars + table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Detalhamento Mensal — {data.year}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Inline bar chart */}
                <div className="grid grid-cols-12 gap-2 h-40">
                  {data.monthly.map(row => {
                    const revHeight = (row.revenue / monthlyMax) * 100;
                    const expHeight = (row.expenses / monthlyMax) * 100;
                    return (
                      <div
                        key={row.month}
                        className="flex flex-col items-center justify-end gap-1"
                        title={`${MONTH_LABELS[row.month - 1]}: receita ${formatCurrency(
                          row.revenue
                        )} · despesa ${formatCurrency(row.expenses)} · resultado ${formatCurrency(
                          row.result
                        )}`}
                      >
                        <div className="flex items-end gap-0.5 h-32 w-full">
                          <div
                            className="flex-1 bg-emerald-400 dark:bg-emerald-500 rounded-sm transition-all"
                            style={{ height: `${Math.max(revHeight, 1)}%` }}
                          />
                          <div
                            className="flex-1 bg-rose-400 dark:bg-rose-500 rounded-sm transition-all"
                            style={{ height: `${Math.max(expHeight, 1)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {MONTH_LABELS[row.month - 1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-500" />
                    Receita
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-rose-400 dark:bg-rose-500" />
                    Despesa
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Mês
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Receita
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Despesa
                        </th>
                        <th className="text-right py-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Resultado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthly.map(row => (
                        <tr
                          key={row.month}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2 px-3 text-sm font-medium">
                            {MONTH_LABELS[row.month - 1]}
                          </td>
                          <td className="py-2 px-3 text-right text-sm font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(row.revenue)}
                          </td>
                          <td className="py-2 px-3 text-right text-sm font-mono text-rose-600 dark:text-rose-400">
                            {formatCurrency(row.expenses)}
                          </td>
                          <td
                            className={cn(
                              'py-2 px-3 text-right text-sm font-mono font-semibold',
                              row.result >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            )}
                          >
                            {formatCurrency(row.result)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50 font-bold border-t-2 border-border">
                        <td className="py-3 px-3 text-sm">Total {data.year}</td>
                        <td className="py-3 px-3 text-right text-sm font-mono text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(data.totalRevenue)}
                        </td>
                        <td className="py-3 px-3 text-right text-sm font-mono text-rose-700 dark:text-rose-300">
                          {formatCurrency(data.totalExpenses)}
                        </td>
                        <td
                          className={cn(
                            'py-3 px-3 text-right text-sm font-mono',
                            data.netResult >= 0
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-rose-700 dark:text-rose-300'
                          )}
                        >
                          {formatCurrency(data.netResult)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageLayout>
  );
}
