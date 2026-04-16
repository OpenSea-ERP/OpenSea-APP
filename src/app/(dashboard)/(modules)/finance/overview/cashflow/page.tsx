'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CashflowChart } from '@/components/finance/analytics/cashflow-chart';
import { useFinanceCashflow, useCashflowAccuracy } from '@/hooks/finance';

type CashflowGroupBy = 'day' | 'week' | 'month';

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getAccuracyColorClass(accuracy: number): string {
  if (accuracy >= 80)
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20';
  if (accuracy >= 50)
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/20';
  return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/20';
}

function getAccuracyBgClass(accuracy: number): string {
  if (accuracy >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (accuracy >= 50) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-rose-100 dark:bg-rose-900/30';
}

function getAccuracyIconClass(accuracy: number): string {
  if (accuracy >= 80) return 'text-emerald-600';
  if (accuracy >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

export default function CashflowPage() {
  const router = useRouter();
  const defaultRange = getMonthRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [groupBy, setGroupBy] = useState<CashflowGroupBy>('day');

  const { data, isLoading } = useFinanceCashflow({
    startDate,
    endDate,
    groupBy,
  });

  const { data: accuracyData, isLoading: isAccuracyLoading } =
    useCashflowAccuracy({
      startDate,
      endDate,
    });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/finance')}
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">
            Visualize entradas, saídas e saldo acumulado por período
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <DatePicker
                id="startDate"
                value={startDate}
                onChange={v => setStartDate(typeof v === 'string' ? v : '')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <DatePicker
                id="endDate"
                value={endDate}
                onChange={v => setEndDate(typeof v === 'string' ? v : '')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupBy">Agrupar por</Label>
              <Select
                value={groupBy}
                onValueChange={value => setGroupBy(value as CashflowGroupBy)}
              >
                <SelectTrigger id="groupBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accuracy KPI Card */}
      {isAccuracyLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ) : accuracyData && accuracyData.periodCount > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Precisão das Projeções
                </p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold">
                    {accuracyData.accuracy.toFixed(1)}%
                  </p>
                  <Badge
                    variant="outline"
                    className={getAccuracyColorClass(accuracyData.accuracy)}
                  >
                    {accuracyData.accuracy >= 80
                      ? 'Excelente'
                      : accuracyData.accuracy >= 50
                        ? 'Moderada'
                        : 'Baixa'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseado em {accuracyData.periodCount} dia(s) com dados
                  comparáveis
                </p>
              </div>
              <div
                className={`p-3 rounded-full ${getAccuracyBgClass(accuracyData.accuracy)}`}
              >
                <Target
                  className={`h-5 w-5 ${getAccuracyIconClass(accuracyData.accuracy)}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Chart with projected overlay */}
      <CashflowChart
        realizedData={data?.data.map(entry => ({
          date: entry.period,
          cumulativeBalance: entry.cumulativeBalance,
        }))}
        accuracyData={accuracyData ?? undefined}
        isLoading={isLoading}
        isAccuracyLoading={isAccuracyLoading}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-8 bg-muted animate-pulse rounded" />
              <div className="h-8 bg-muted animate-pulse rounded" />
              <div className="h-8 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ) : !data || data.data.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Nenhum dado encontrado para o período selecionado
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">
                        Período
                      </th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">
                        Entradas
                      </th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">
                        Saídas
                      </th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">
                        Fluxo Líquido
                      </th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">
                        Saldo Acumulado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((entry, index) => {
                      const isPositiveFlow = entry.netFlow >= 0;
                      return (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">
                            {entry.period}
                          </td>
                          <td className="py-2 px-2 sm:py-3 sm:px-4 text-right text-emerald-600 font-medium text-xs sm:text-sm">
                            {formatCurrency(entry.inflow)}
                          </td>
                          <td className="py-2 px-2 sm:py-3 sm:px-4 text-right text-rose-600 font-medium text-xs sm:text-sm">
                            {formatCurrency(entry.outflow)}
                          </td>
                          <td
                            className={`py-2 px-2 sm:py-3 sm:px-4 text-right font-medium text-xs sm:text-sm ${
                              isPositiveFlow
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {formatCurrency(entry.netFlow)}
                          </td>
                          <td className="py-2 px-2 sm:py-3 sm:px-4 text-right font-semibold text-xs sm:text-sm">
                            {formatCurrency(entry.cumulativeBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.summary.openingBalance)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Total Entradas</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(data.summary.totalInflow)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingDown className="h-4 w-4" />
                    <span>Total Saídas</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-600">
                    {formatCurrency(data.summary.totalOutflow)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fluxo Líquido</p>
                  <p
                    className={`text-2xl font-bold ${
                      data.summary.netFlow >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(data.summary.netFlow)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Saldo Final</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.summary.closingBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
