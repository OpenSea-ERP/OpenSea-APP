/**
 * DFC — Demonstração dos Fluxos de Caixa.
 *
 * Agrupa recebimentos e pagamentos realizados no ano em três atividades —
 * operacional, investimento e financiamento — a partir de uma heurística
 * sobre nome + slug da categoria. Inclui um gráfico mensal e uma tabela
 * de categorias com drill-down para os lançamentos.
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
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { useDfcAnnual, type DfcActivity } from '@/hooks/finance/use-reports';
import { useFinanceEntries } from '@/hooks/finance/use-finance-entries';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Banknote,
  Briefcase,
  ChevronRight,
  Landmark,
  Layers,
  RotateCw,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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

const ACTIVITY_META: Record<
  DfcActivity,
  { label: string; color: string; icon: typeof Briefcase }
> = {
  OPERATING: {
    label: 'Operacional',
    color:
      'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border-sky-300/60 dark:border-sky-500/25',
    icon: Briefcase,
  },
  INVESTING: {
    label: 'Investimento',
    color:
      'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 border-violet-300/60 dark:border-violet-500/25',
    icon: TrendingUp,
  },
  FINANCING: {
    label: 'Financiamento',
    color:
      'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-300/60 dark:border-amber-500/25',
    icon: Landmark,
  },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function netColor(value: number): string {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-rose-600 dark:text-rose-400';
  return 'text-muted-foreground';
}

export default function DfcPage() {
  const { hasPermission } = usePermissions();
  const [year, setYear] = useState(currentYear);
  const [drillDown, setDrillDown] = useState<{
    categoryId: string;
    categoryName: string;
    activity: DfcActivity;
  } | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useDfcAnnual(year);

  const monthlyMax = useMemo(() => {
    if (!data) return 1;
    const values = data.monthly.flatMap(m => [
      Math.abs(m.operating),
      Math.abs(m.investing),
      Math.abs(m.financing),
    ]);
    return Math.max(...values, 1);
  }, [data]);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="dfc-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Relatórios', href: '/finance/reports' },
          { label: 'DFC' },
        ]}
        hasPermission={hasPermission}
      />

      <PageHeroBanner
        title="DFC — Demonstração dos Fluxos de Caixa"
        description="Fluxos de caixa operacional, de investimento e de financiamento do ano selecionado. Clique em uma categoria para auditar os lançamentos que geraram o valor."
        icon={Waves}
        iconGradient="from-sky-500 to-cyan-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      {/* Year selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-2">
              <Label htmlFor="dfc-year">Exercício</Label>
              <Select
                value={String(year)}
                onValueChange={v => setYear(Number(v))}
              >
                <SelectTrigger id="dfc-year" className="w-32">
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

      {/* Error */}
      {error && (
        <Card className="border-rose-200 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-500/5">
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-rose-600 dark:text-rose-400" />
            <div>
              <p className="font-semibold text-rose-900 dark:text-rose-200">
                Não foi possível carregar a DFC
              </p>
              <p className="text-sm text-rose-800 dark:text-rose-300">
                {error instanceof Error
                  ? error.message
                  : 'Erro ao consultar os fluxos de caixa.'}
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

      {/* Loading */}
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

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <KpiCard
              icon={Briefcase}
              label="Operacional"
              value={data.operating}
              accent="sky"
            />
            <KpiCard
              icon={TrendingUp}
              label="Investimento"
              value={data.investing}
              accent="violet"
            />
            <KpiCard
              icon={Landmark}
              label="Financiamento"
              value={data.financing}
              accent="amber"
            />
            <KpiCard
              icon={Banknote}
              label="Variação Líquida"
              value={data.netCashFlow}
              accent="emerald"
              highlight
            />
          </div>

          {/* Monthly chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Fluxo mensal — {data.year}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-12 gap-2 h-44">
                {data.monthly.map(row => (
                  <div
                    key={row.month}
                    className="flex flex-col items-center justify-end gap-1"
                    title={`${MONTH_LABELS[row.month - 1]}: operacional ${formatCurrency(
                      row.operating
                    )} · investimento ${formatCurrency(
                      row.investing
                    )} · financiamento ${formatCurrency(
                      row.financing
                    )} · líquido ${formatCurrency(row.net)}`}
                  >
                    <div className="flex items-end gap-0.5 h-36 w-full">
                      {(['operating', 'investing', 'financing'] as const).map(
                        k => {
                          const value = row[k];
                          const heightPct =
                            (Math.abs(value) / monthlyMax) * 100;
                          const positive = value >= 0;
                          const colorMap = {
                            operating: positive
                              ? 'bg-sky-400 dark:bg-sky-500'
                              : 'bg-sky-200 dark:bg-sky-500/40',
                            investing: positive
                              ? 'bg-violet-400 dark:bg-violet-500'
                              : 'bg-violet-200 dark:bg-violet-500/40',
                            financing: positive
                              ? 'bg-amber-400 dark:bg-amber-500'
                              : 'bg-amber-200 dark:bg-amber-500/40',
                          };
                          return (
                            <div
                              key={k}
                              className={cn(
                                'flex-1 rounded-sm transition-all',
                                colorMap[k]
                              )}
                              style={{ height: `${Math.max(heightPct, 1)}%` }}
                            />
                          );
                        }
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {MONTH_LABELS[row.month - 1]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-sky-400 dark:bg-sky-500" />
                  Operacional
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-violet-400 dark:bg-violet-500" />
                  Investimento
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm bg-amber-400 dark:bg-amber-500" />
                  Financiamento
                </span>
                <span className="text-muted-foreground/70">
                  · Barras translúcidas indicam fluxo negativo no mês.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Categories with drill-down */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Categorias — clique para ver lançamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.categories.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum lançamento pago nesse ano.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Atividade
                        </th>
                        <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Categoria
                        </th>
                        <th className="text-right py-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Entradas
                        </th>
                        <th className="text-right py-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Saídas
                        </th>
                        <th className="text-right py-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Líquido
                        </th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.categories.map(row => {
                        const meta = ACTIVITY_META[row.activity];
                        return (
                          <tr
                            key={row.categoryId}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                            data-testid={`dfc-row-${row.categoryId}`}
                            onClick={() =>
                              setDrillDown({
                                categoryId: row.categoryId,
                                categoryName: row.categoryName,
                                activity: row.activity,
                              })
                            }
                          >
                            <td className="py-2 px-4">
                              <Badge
                                variant="outline"
                                className={cn('text-[10px]', meta.color)}
                              >
                                {meta.label}
                              </Badge>
                            </td>
                            <td className="py-2 px-4 text-sm font-medium">
                              {row.categoryName}
                            </td>
                            <td className="py-2 px-4 text-right text-sm font-mono text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(row.inflow)}
                            </td>
                            <td className="py-2 px-4 text-right text-sm font-mono text-rose-600 dark:text-rose-400">
                              {formatCurrency(row.outflow)}
                            </td>
                            <td
                              className={cn(
                                'py-2 px-4 text-right text-sm font-mono font-semibold',
                                netColor(row.net)
                              )}
                            >
                              {formatCurrency(row.net)}
                            </td>
                            <td className="py-2 px-4 text-muted-foreground">
                              <ChevronRight className="h-4 w-4" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Classificação derivada do nome + slug da categoria (palavras como
            "investimento", "imobilizado", "empréstimo", "financiamento" e
            similares). Para ajustar, renomeie a categoria ou inclua o termo
            correspondente no slug.
          </p>
        </>
      )}

      {/* Drill-down drawer */}
      <DrillDownDrawer
        year={year}
        drill={drillDown}
        onClose={() => setDrillDown(null)}
      />
    </div>
  );
}

// ============================================================================
// KPI CARD
// ============================================================================

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  highlight,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number;
  accent: 'sky' | 'violet' | 'amber' | 'emerald';
  highlight?: boolean;
}) {
  const accentClasses = {
    sky: 'text-sky-500',
    violet: 'text-violet-500',
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
  };

  return (
    <Card
      className={
        highlight
          ? 'border-emerald-300/60 dark:border-emerald-500/25'
          : undefined
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn('h-4 w-4', accentClasses[accent])} />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
        </div>
        <p
          className={cn(
            'text-xl font-bold font-mono',
            value >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          )}
        >
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DRILL-DOWN DRAWER — reuses finance entries listing filtered by category
// ============================================================================

function DrillDownDrawer({
  year,
  drill,
  onClose,
}: {
  year: number;
  drill: {
    categoryId: string;
    categoryName: string;
    activity: DfcActivity;
  } | null;
  onClose: () => void;
}) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, isLoading } = useFinanceEntries(
    drill
      ? {
          categoryId: drill.categoryId,
          dueDateFrom: startDate,
          dueDateTo: endDate,
          perPage: 200,
        }
      : undefined
  );

  const entries = data?.entries ?? [];
  const paidEntries = entries.filter(e =>
    ['PAID', 'RECEIVED', 'PARTIALLY_PAID'].includes(e.status)
  );

  return (
    <Sheet open={!!drill} onOpenChange={open => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base flex items-center gap-2">
            {drill && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] shrink-0',
                  ACTIVITY_META[drill.activity].color
                )}
              >
                {ACTIVITY_META[drill.activity].label}
              </Badge>
            )}
            <span>{drill?.categoryName}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : paidEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum lançamento pago nessa categoria no exercício.
            </p>
          ) : (
            paidEntries.map(entry => {
              const signed =
                entry.type === 'RECEIVABLE'
                  ? (entry.actualAmount ?? entry.expectedAmount)
                  : -(entry.actualAmount ?? entry.expectedAmount);
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {entry.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(entry.dueDate).toLocaleDateString('pt-BR')} ·{' '}
                        {entry.supplierName ?? entry.customerName ?? '—'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-mono font-semibold tabular-nums whitespace-nowrap',
                        signed >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      )}
                    >
                      {signed >= 0 ? '+' : ''}
                      {formatCurrency(signed)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
