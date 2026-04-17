'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  DollarSign,
  Lightbulb,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { usePermissions } from '@/hooks/use-permissions';
import { usePredictiveCashflow } from '@/hooks/finance';
import { PredictiveChart } from '@/components/finance/analytics/predictive-chart';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  if (d) return `${d}/${m}/${y}`;
  return `${m}/${y}`;
}

function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-');
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const monthIndex = parseInt(m, 10) - 1;
  return `${months[monthIndex]} ${y}`;
}

const periodOptions = [
  { value: 1, label: '1 mês' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
] as const;

function DataQualityBadge({ quality }: { quality: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const config = {
    HIGH: {
      label: 'Alta Confiança',
      className:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/8 dark:text-emerald-300 dark:border-emerald-800/30',
    },
    MEDIUM: {
      label: 'Confiança Moderada',
      className:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/8 dark:text-amber-300 dark:border-amber-800/30',
    },
    LOW: {
      label: 'Baixa Confiança',
      className:
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/8 dark:text-rose-300 dark:border-rose-800/30',
    },
  };

  const c = config[quality];
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

export default function PredictiveForecastPage() {
  const { hasPermission } = usePermissions();
  const [months, setMonths] = useState(3);
  const { data, isLoading, error } = usePredictiveCashflow(months);

  const dangerDays = data?.dangerZones.length ?? 0;
  const lastProjectedBalance =
    data?.projectedMonths[data.projectedMonths.length - 1]?.projectedBalance ??
    0;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Relatórios', href: '/finance/reports' },
            { label: 'Previsão de Fluxo de Caixa' },
          ]}
          hasPermission={hasPermission}
          buttons={[]}
        />
      </PageHeader>

      <PageBody>
        <PageHeroBanner
          title="Previsão de Fluxo de Caixa"
          description="Projeção baseada em média móvel e tendência dos últimos meses. Identifica semanas em risco de saldo negativo e sugere ações corretivas."
          icon={TrendingUp}
          iconGradient="from-violet-500 to-indigo-600"
          buttons={[]}
          hasPermission={hasPermission}
        />

        {/* Period Selector + Data Quality */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Período:</span>
            <div className="flex gap-1.5">
              {periodOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMonths(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    months === opt.value
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {data && <DataQualityBadge quality={data.dataQuality} />}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-5 w-32 mb-3" />
                    <Skeleton className="h-8 w-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-5">
                <Skeleton className="h-[280px] w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Erro ao carregar previsão de fluxo de caixa. Tente novamente.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Data */}
        {data && !isLoading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Saldo Atual */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Saldo Atual
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                    {formatCurrency(data.currentBalance)}
                  </p>
                </CardContent>
              </Card>

              {/* Saldo Projetado */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Saldo Projetado
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      lastProjectedBalance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCurrency(lastProjectedBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ao final do período
                  </p>
                </CardContent>
              </Card>

              {/* Dias em Risco */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Dias em Risco
                    </span>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      dangerDays > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {dangerDays}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dangerDays > 0
                      ? 'Dias com saldo negativo projetado'
                      : 'Nenhum dia com saldo negativo'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Daily Balance Chart (CSS-based) */}
            <PredictiveChart dailyProjection={data.dailyProjection} />

            {/* Monthly Breakdown Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  <CardTitle className="text-base">
                    Detalhamento Mensal
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Mês
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-sm">
                          Receita Projetada
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-sm">
                          Despesa Projetada
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-sm">
                          Saldo
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-sm">
                          Confiança
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.projectedMonths.map(month => (
                        <tr
                          key={month.month}
                          className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm font-medium">
                            {formatMonth(month.month)}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatCurrency(month.projectedRevenue)}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-rose-600 dark:text-rose-400 font-medium">
                            {formatCurrency(month.projectedExpenses)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right text-sm font-bold ${
                              month.projectedBalance >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatCurrency(month.projectedBalance)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <ConfidenceBadge value={month.confidence} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions Panel */}
            {data.suggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-base">Recomendações</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.suggestions.map(suggestion => {
                      const isDanger =
                        suggestion.includes('déficit') ||
                        suggestion.includes('negativo') ||
                        suggestion.includes('Atenção');
                      const isOpportunity =
                        suggestion.includes('investimento') ||
                        suggestion.includes('investimentos') ||
                        suggestion.includes('oportunidade');

                      return (
                        <div
                          key={suggestion}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            isDanger
                              ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/5 dark:border-rose-800/30'
                              : isOpportunity
                                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-800/30'
                                : 'bg-muted/30 border-border'
                          }`}
                        >
                          {isDanger ? (
                            <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                          ) : isOpportunity ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          ) : (
                            <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          )}
                          <p className="text-sm leading-relaxed">
                            {suggestion}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zones */}
            {data.dangerZones.length > 0 && (
              <Card className="border-rose-200 dark:border-rose-800/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-rose-500" />
                    <CardTitle className="text-base text-rose-700 dark:text-rose-300">
                      Zonas de Risco
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/8 dark:text-rose-300 dark:border-rose-800/30"
                    >
                      {data.dangerZones.length} dia(s)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {data.dangerZones.slice(0, 10).map(zone => (
                      <div
                        key={zone.date}
                        className="flex items-center justify-between p-3 rounded-lg bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-800/20"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {formatDate(zone.date)}
                            </span>
                            <span className="text-sm text-rose-600 dark:text-rose-400 font-bold">
                              {formatCurrency(zone.projectedBalance)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {zone.suggestion}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="ml-3 shrink-0 bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/8 dark:text-rose-300 dark:border-rose-800/30"
                        >
                          -{formatCurrency(zone.deficit)}
                        </Badge>
                      </div>
                    ))}
                    {data.dangerZones.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Exibindo 10 de {data.dangerZones.length} dias em risco
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </PageBody>
    </PageLayout>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const className =
    percent >= 70
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/8 dark:text-emerald-300 dark:border-emerald-800/30'
      : percent >= 40
        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/8 dark:text-amber-300 dark:border-amber-800/30'
        : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/8 dark:text-rose-300 dark:border-rose-800/30';

  return (
    <Badge variant="outline" className={className}>
      {percent}%
    </Badge>
  );
}
