'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileBarChart, FileText, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PeriodSelector,
  type DateRange,
} from '@/components/finance/analytics/period-selector';
import { DREInteractiveTable } from '@/components/finance/reports/dre-interactive-table';
import { BalanceSheet } from '@/components/finance/reports/balance-sheet';
import { ExportMenu } from '@/components/finance/reports/export-menu';
import { useInteractiveDRE } from '@/hooks/finance/use-reports';
import { useAnalyticsDashboard } from '@/hooks/finance/use-analytics';
import type { ReportType } from '@/services/finance/finance-reports.service';

function getDefaultRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

type ActiveReport = 'dre' | 'balance' | 'cashflow' | 'entries' | null;

const REPORT_TYPE_MAP: Record<string, ReportType> = {
  dre: 'DRE',
  balance: 'BALANCE',
  cashflow: 'CASHFLOW',
  entries: 'ENTRIES',
};

const reportCards = [
  {
    id: 'dre' as const,
    title: 'DRE',
    description: 'Demonstracao do Resultado do Exercicio com hierarquia e comparativo',
    icon: FileBarChart,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    id: 'balance' as const,
    title: 'Balanco Patrimonial',
    description: 'Ativo, passivo e patrimonio liquido',
    icon: Wallet,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    id: 'cashflow' as const,
    title: 'Fluxo de Caixa',
    description: 'Recebimentos e pagamentos operacionais',
    icon: TrendingUp,
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    id: 'entries' as const,
    title: 'Lancamentos',
    description: 'Listagem completa de lancamentos do periodo',
    icon: FileText,
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
];

export default function FinanceReportsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange);
  const [activeReport, setActiveReport] = useState<ActiveReport>(null);

  const { data: dreData, isLoading: dreLoading } = useInteractiveDRE({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: dashboardData, isLoading: dashLoading } =
    useAnalyticsDashboard();

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
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <FileBarChart className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Relatorios Financeiros</h1>
            <p className="text-muted-foreground">
              Visualize e exporte relatorios financeiros detalhados
            </p>
          </div>
        </div>
      </div>

      <PeriodSelector value={dateRange} onChange={setDateRange} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((card) => (
          <Card
            key={card.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeReport === card.id
                ? 'ring-2 ring-primary'
                : ''
            }`}
            onClick={() =>
              setActiveReport(activeReport === card.id ? null : card.id)
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{card.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveReport(
                      activeReport === card.id ? null : card.id,
                    );
                  }}
                >
                  {activeReport === card.id ? 'Ocultar' : 'Visualizar'}
                </Button>
                <ExportMenu
                  reportType={REPORT_TYPE_MAP[card.id]}
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeReport === 'dre' && (
        <DREInteractiveTable
          revenue={dreData?.revenue}
          expenses={dreData?.expenses}
          netResult={dreData?.netResult}
          previousNetResult={dreData?.previousNetResult}
          variationPercent={dreData?.variationPercent}
          isLoading={dreLoading}
        />
      )}

      {activeReport === 'balance' && (
        <BalanceSheet data={dashboardData} isLoading={dashLoading} />
      )}

      {activeReport === 'cashflow' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fluxo de Caixa</CardTitle>
            <ExportMenu
              reportType="CASHFLOW"
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </CardHeader>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Use o{' '}
              <Button
                variant="link"
                className="px-0"
                onClick={() => router.push('/finance/analytics')}
              >
                Painel Financeiro
              </Button>{' '}
              para visualizar o fluxo de caixa em graficos interativos, ou exporte o relatorio acima.
            </p>
          </CardContent>
        </Card>
      )}

      {activeReport === 'entries' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lancamentos</CardTitle>
            <ExportMenu
              reportType="ENTRIES"
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </CardHeader>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Acesse{' '}
              <Button
                variant="link"
                className="px-0"
                onClick={() => router.push('/finance/payable')}
              >
                Contas a Pagar
              </Button>{' '}
              ou{' '}
              <Button
                variant="link"
                className="px-0"
                onClick={() => router.push('/finance/receivable')}
              >
                Contas a Receber
              </Button>{' '}
              para visualizar lancamentos detalhados, ou exporte o relatorio acima.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
