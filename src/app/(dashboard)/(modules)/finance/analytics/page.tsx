'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PeriodSelector,
  type DateRange,
} from '@/components/finance/analytics/period-selector';
import { KPICards } from '@/components/finance/analytics/kpi-cards';
import { RevenueExpenseChart } from '@/components/finance/analytics/revenue-expense-chart';
import { CashflowChart } from '@/components/finance/analytics/cashflow-chart';
import { CategoryDistributionChart } from '@/components/finance/analytics/category-distribution-chart';
import {
  useAnalyticsDashboard,
  useAnalyticsCashflow,
  useAnalyticsForecast,
} from '@/hooks/finance/use-analytics';

function getDefaultRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export default function FinanceAnalyticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const { data: dashboardData, isLoading: dashLoading } =
    useAnalyticsDashboard();

  const { data: cashflowData, isLoading: cashflowLoading } =
    useAnalyticsCashflow({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy,
    });

  // For projected, use from today forward 90 days
  const todayStr = new Date().toISOString().split('T')[0];
  const future90 = new Date();
  future90.setDate(future90.getDate() + 90);
  const future90Str = future90.toISOString().split('T')[0];

  const { data: forecastData, isLoading: forecastLoading } =
    useAnalyticsForecast({
      startDate: todayStr,
      endDate: future90Str,
      groupBy,
    });

  // Revenue vs Expense data from forecast (which has payable/receivable)
  const revenueExpenseData = forecastData?.data?.map((d) => ({
    date: d.date,
    receivable: d.receivable,
    payable: d.payable,
  }));

  // Category distribution from forecast byCategory
  const categoryData = (
    forecastData as {
      byCategory?: {
        categoryId: string;
        categoryName: string;
        total: number;
      }[];
    }
  )?.byCategory;

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
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Painel Financeiro</h1>
            <p className="text-muted-foreground">
              Indicadores, receitas, despesas e fluxo de caixa
            </p>
          </div>
        </div>
      </div>

      <PeriodSelector value={dateRange} onChange={setDateRange} />

      <KPICards data={dashboardData} isLoading={dashLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueExpenseChart
          data={revenueExpenseData}
          isLoading={forecastLoading}
        />
        <CategoryDistributionChart
          data={categoryData}
          isLoading={forecastLoading}
        />
      </div>

      <CashflowChart
        realizedData={cashflowData?.data?.map((d) => ({
          date: (d as { date?: string; period?: string }).date ?? d.period,
          cumulativeBalance: d.cumulativeBalance,
        }))}
        projectedData={forecastData?.data?.map((d) => ({
          date: d.date,
          cumulativeNet: d.cumulativeNet,
        }))}
        isLoading={cashflowLoading || forecastLoading}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />
    </div>
  );
}
